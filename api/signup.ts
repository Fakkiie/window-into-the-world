import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from './_lib/config.js';
import { createDb, upsertSubscriber } from './_lib/db.js';
import { createEmailClient, sendWelcomeEmail } from './_lib/email.js';
import { methodNotAllowed } from './_lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  try {
    const config = getConfig();
    const supabase = createDb(config);
    const resendClient = createEmailClient(config.resendApiKey);
    const parsedBody =
      typeof req.body === 'string' ? (JSON.parse(req.body) as Record<string, unknown>) : req.body || {};
    const email = String(parsedBody.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const subscriber = await upsertSubscriber(supabase, email);
    const emailResult = await sendWelcomeEmail({
      resendClient,
      from: config.fromEmail,
      to: email,
    });

    return res.status(200).json({
      ok: true,
      subscriberId: subscriber.id,
      welcomeEmailSent: !emailResult.skipped,
    });
  } catch (error) {
    console.error('signup failed', error);
    return res.status(500).json({
      error: 'Failed to sign up',
      detail: error instanceof Error ? error.message : 'unknown error',
    });
  }
}
