import type { GoogleFormTarget } from '../config.ts';
import type { Annotation } from '../types.ts';

/** The form fields for one answer: the same three the 2018 version sent (name, sentence, score). */
export function formBody(target: GoogleFormTarget, annotation: Annotation): URLSearchParams {
  return new URLSearchParams({
    [target.fields.name]: annotation.name,
    [target.fields.text]: annotation.text,
    [target.fields.score]: String(annotation.guess),
  });
}

export interface SendResult {
  /** The answers that went out, each with `sentAt` filled in. */
  sent: Annotation[];
  /** How many could not be sent (network error); they stay unsent and can be retried. */
  failed: number;
}

/**
 * Posts answers to the Google Form one by one, like submitting the form in a browser.
 *
 * Google Forms does not allow other sites to read its reply (no CORS), so the request goes out in
 * `no-cors` mode: the browser sends it but hides the response. A request that reaches Google
 * counts as sent; only a network error counts as failed. Whether Google stored it can only be
 * checked in the form's own responses.
 */
export async function sendAnnotations(
  target: GoogleFormTarget,
  annotations: readonly Annotation[],
  fetchImpl: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<SendResult> {
  const sent: Annotation[] = [];
  let failed = 0;
  for (const annotation of annotations) {
    try {
      await fetchImpl(target.action, { method: 'POST', mode: 'no-cors', body: formBody(target, annotation) });
      sent.push({ ...annotation, sentAt: now().toISOString() });
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
