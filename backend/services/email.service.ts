import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn('RESEND_API_KEY environment variable is not set. Emails will not be sent.');
      // Return a mock client if no key is provided
      return { emails: { send: async (data: any) => console.log('[MOCK RESEND]', data) } } as any;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}
