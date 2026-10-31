'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createHoldConfirmation } from '@/lib/hold-confirmation';
import { useLanguage } from '@/lib/language-context';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import styles from './account-settings.module.css';

export function HoldToConfirm({ busy, onConfirm }: { busy: boolean; onConfirm: () => void }) {
  const { lang } = useLanguage();
  const t = accountSettingsCopy[lang];
  const id = useId();
  const latestConfirm = useRef(onConfirm);
  latestConfirm.current = onConfirm;
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(0);
  const controller = useRef<ReturnType<typeof createHoldConfirmation> | null>(null);
  if (!controller.current) controller.current = createHoldConfirmation({ complete: () => {
    setHolding(false); setElapsed(5000); latestConfirm.current();
  } });
  function cancel() { controller.current?.cancel(); setHolding(false); if (!busy) setElapsed(0); }
  function start() {
    if (busy || !controller.current?.start()) return;
    startTime.current = performance.now(); setElapsed(0); setHolding(true);
  }
  useEffect(() => {
    if (!holding) return;
    let frame = 0;
    const tick = () => { setElapsed(Math.min(5000, performance.now() - startTime.current)); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [holding]);
  useEffect(() => {
    const stop = () => { controller.current?.cancel(); setHolding(false); setElapsed(0); };
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => { controller.current?.cancel(); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <div>
    <button type="button" disabled={busy} className={styles.hold} aria-describedby={`${id}-hint`}
      onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); start(); }}
      onPointerMove={event => { if (!holding) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cancel(); }}
      onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel}
      onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start(); } }}
      onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); cancel(); } }}
      onClick={event => event.preventDefault()} onContextMenu={event => event.preventDefault()}>
      <span className={styles.holdProgress} style={{ width: `${elapsed / 50}%` }} aria-hidden="true" />
      <span className={styles.holdLabel} aria-live="polite">{busy ? t.deleting : holding ? `${t.holding} ${Math.max(1, Math.ceil((5000 - elapsed) / 1000))}s` : t.hold}</span>
    </button>
    <p id={`${id}-hint`} className={styles.hint}>{t.holdHint}</p>
  </div>;
}
