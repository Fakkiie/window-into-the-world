import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from './_lib/config';
import { createDb, upsertSubscriber } from './_lib/db';
import { createEmailClient, sendWelcomeEmail } from './_lib/email';
import { methodNotAllowed } from './_lib/http';

const config = getConfig();
const supabase = createDb(config);
const resendClient = createEmailClient(config.resendApiKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
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
    return res.status(500).json({ error: 'Failed to sign up' });
  }
}
