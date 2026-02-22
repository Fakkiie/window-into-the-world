import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../_lib/config.js';
import { createDb, createPrompt, getActiveSubscribers, setLastPromptSentAt } from '../_lib/db.js';
import { createEmailClient, sendWeeklyPrompt } from '../_lib/email.js';
import { methodNotAllowed } from '../_lib/http.js';

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
    const token = req.headers['x-manual-send-secret'];
    if (config.manualSendSecret && token !== config.manualSendSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const promptText = String(parsedBody.promptText || '').trim();
    if (!promptText) {
      return res.status(400).json({ error: 'promptText is required' });
    }

    const prompt = await createPrompt(supabase, promptText);
    const subscribers = await getActiveSubscribers(supabase);

    const results = await Promise.all(
      subscribers.map((subscriber) =>
        sendWeeklyPrompt({
          resendClient,
          from: config.fromEmail,
          to: subscriber.email,
          promptText,
        })
      )
    );

    await setLastPromptSentAt(
      supabase,
      subscribers.map((subscriber) => subscriber.id),
      prompt.sent_at
    );

    return res.status(200).json({
      ok: true,
      promptId: prompt.id,
      recipients: subscribers.length,
      sent: results.filter((entry) => !entry.skipped).length,
      skipped: results.filter((entry) => entry.skipped).length,
    });
  } catch (error) {
    console.error('weekly prompt send failed', error);
    return res.status(500).json({
      error: 'Failed to send weekly prompt',
      detail: error instanceof Error ? error.message : 'unknown error',
    });
  }
}
