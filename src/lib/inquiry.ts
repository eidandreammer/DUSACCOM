import { z } from 'zod';
export const inquiryKinds = ['contact', 'membership', 'event', 'event-registration'] as const;
export const inquirySchema = z.object({
  kind: z.enum(inquiryKinds),
  name: z.string().trim().min(2, 'Please enter your full name.').max(100, 'Please use 100 characters or fewer.'),
  email: z.email('Please enter a valid email address.').max(254),
  company: z.string().trim().max(150).default(''),
  interest: z.string().trim().min(1, 'Please choose a topic.').max(200),
  message: z.string().trim().max(3000, 'Please use 3,000 characters or fewer.').default(''),
  consent: z.literal(true, { error: 'Please agree before continuing.' }),
  website: z.string().max(0, 'Please leave this field empty.').default(''),
  submissionId: z.uuid()
}).strict().superRefine((input, context) => {
  if (input.kind !== 'event-registration' && input.message.length < 10) context.addIssue({ code: 'custom', path: ['message'], message: 'Please write at least 10 characters.' });
});
export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryKind = Inquiry['kind'];
export type FieldErrors = Partial<Record<keyof Inquiry, string>>;
export type InquiryResponse = { ok: true; reference: string; receivedAt: string } | { ok: false; message: string; errors?: FieldErrors; requestId?: string };
export function validationErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof Inquiry;
    if (field && !result[field]) result[field] = issue.message;
  }
  return result;
}
