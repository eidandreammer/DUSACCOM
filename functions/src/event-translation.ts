import { createHash } from 'node:crypto';

// Machine translation for admin-created events (events/{id}).
// English title/description are the source. Spanish and Brazilian Portuguese
// copies are stored beside them; anything an admin typed is never overwritten.
//
// translation: {
//   sourceHash: sha256 of the English text the auto fields were made from,
//   es / pt: 'auto' | 'manual' | 'mixed' (per-language summary),
//   fields: { [field]: sha256 of the machine text written to that field },
//   translatedAt: server timestamp,
// }
// A field counts as machine-owned while it is blank or still equals the text
// this function wrote (hash match). Once an admin edits it, it becomes manual
// and is kept; clearing it hands it back to the translator.

export type TargetLang = 'es' | 'pt-BR';
export type TranslationField = 'titleEs' | 'descriptionEs' | 'titlePt' | 'descriptionPt';
export type Translate = (texts: string[], target: TargetLang) => Promise<string[]>;
export type LanguageStatus = 'auto' | 'manual' | 'mixed';
export type TranslationMeta = {
  sourceHash: string; es: LanguageStatus; pt: LanguageStatus;
  fields: Partial<Record<TranslationField, string>>; translatedAt: unknown;
};

const FIELDS: ReadonlyArray<{ field: TranslationField; source: 'title' | 'description'; lang: 'es' | 'pt'; target: TargetLang; max: number }> = [
  { field: 'titleEs', source: 'title', lang: 'es', target: 'es', max: 160 },
  { field: 'descriptionEs', source: 'description', lang: 'es', target: 'es', max: 2000 },
  { field: 'titlePt', source: 'title', lang: 'pt', target: 'pt-BR', max: 160 },
  { field: 'descriptionPt', source: 'description', lang: 'pt', target: 'pt-BR', max: 2000 },
];

// Browsers may submit CRLF from textareas and the client trims; hash what survives a round trip.
export const normalize = (value: unknown) => typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';
const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
export const sourceHash = (title: string, description: string) => sha256(JSON.stringify([normalize(title), normalize(description)]));
export const fieldHash = (value: string) => sha256(normalize(value));

// Keep machine text inside the Firestore rules / client schema limits so later admin edits still validate.
export function fit(text: string, max: number): string {
  const value = normalize(text);
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const word = cut.replace(/\s+\S*$/, '');
  return `${(word.length >= max / 2 ? word : cut).trimEnd()}…`;
}

type Log = (message: string, details?: Record<string, unknown>) => void;

export type TranslationPlan = Partial<Record<TranslationField, string>> & { translation: TranslationMeta };

/**
 * Decide what to write for an event document. Returns null when nothing should change
 * (missing source, already current, or the API failed: the doc is left as-is and the
 * UI falls back to English). Never throws for API errors.
 */
export async function planEventTranslation(data: Record<string, unknown> | undefined, translate: Translate, options: { now: unknown; log?: Log }): Promise<TranslationPlan | null> {
  const log = options.log ?? (() => {});
  if (!data) return null;
  const title = normalize(data.title), description = normalize(data.description);
  if (!title || !description) return null;
  const hash = sourceHash(title, description);
  const previous = data.translation && typeof data.translation === 'object' ? data.translation as Partial<TranslationMeta> : undefined;
  const previousFields = previous?.fields && typeof previous.fields === 'object' ? previous.fields : {};

  const manual = new Set<TranslationField>();
  const pending: typeof FIELDS[number][] = [];
  const fields: Partial<Record<TranslationField, string>> = {};
  for (const spec of FIELDS) {
    const value = normalize(data[spec.field]);
    const owned = value === '' || previousFields[spec.field] === fieldHash(value);
    if (!owned) { manual.add(spec.field); continue; }
    if (value === '' || previous?.sourceHash !== hash) pending.push(spec);
    else fields[spec.field] = previousFields[spec.field]!;
  }

  const updates: Partial<Record<TranslationField, string>> = {};
  if (pending.length) {
    const targets = [...new Set(pending.map(spec => spec.target))];
    let results: string[][];
    try {
      results = await Promise.all(targets.map(target => {
        const specs = pending.filter(spec => spec.target === target);
        return translate(specs.map(spec => spec.source === 'title' ? title : description), target);
      }));
    } catch (error) {
      log('Event translation failed; leaving the event unchanged.', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
    targets.forEach((target, index) => {
      const specs = pending.filter(spec => spec.target === target);
      specs.forEach((spec, position) => {
        const text = fit(results[index]?.[position] ?? '', spec.max);
        if (!text) return; // Leave the field as it was; English fallback.
        fields[spec.field] = fieldHash(text);
        if (text !== data[spec.field]) updates[spec.field] = text;
      });
    });
  }

  const status = (lang: 'es' | 'pt'): LanguageStatus => {
    const count = FIELDS.filter(spec => spec.lang === lang && manual.has(spec.field)).length;
    return count === 0 ? 'auto' : count === 2 ? 'manual' : 'mixed';
  };
  const meta = { sourceHash: hash, es: status('es'), pt: status('pt'), fields };
  const sameFields = (a: Partial<Record<TranslationField, string>>, b: Partial<Record<TranslationField, string>>) =>
    FIELDS.every(({ field }) => (a[field] ?? null) === (b[field] ?? null));
  const unchanged = previous && previous.sourceHash === meta.sourceHash && previous.es === meta.es && previous.pt === meta.pt
    && sameFields(previousFields, meta.fields) && previous.translatedAt != null;
  // Converged: this is also what stops the function's own write from looping.
  if (!Object.keys(updates).length && unchanged) return null;
  const translated = Object.keys(updates).length > 0;
  return { ...updates, translation: { ...meta, translatedAt: translated || previous?.translatedAt == null ? options.now : previous.translatedAt } };
}

export const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

/** Cloud Translation Basic (v2) over REST with an OAuth access token from the function's credentials. */
export function googleTranslator({ getAccessToken, fetchImpl = fetch, endpoint = TRANSLATE_ENDPOINT, timeoutMs = 15000 }: {
  getAccessToken: () => Promise<string>; fetchImpl?: typeof fetch; endpoint?: string; timeoutMs?: number;
}): Translate {
  return async (texts, target) => {
    if (!texts.length) return [];
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ q: texts, source: 'en', target, format: 'text' }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Cloud Translation responded ${response.status}`);
    const body = await response.json() as { data?: { translations?: Array<{ translatedText?: unknown }> } };
    const translations = body.data?.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length || translations.some(item => typeof item?.translatedText !== 'string')) {
      throw new Error('Cloud Translation returned an unexpected response');
    }
    return translations.map(item => item.translatedText as string);
  };
}
