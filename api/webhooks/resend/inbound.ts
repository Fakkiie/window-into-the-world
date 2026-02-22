import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../../_lib/config';
import { createDb, createResponse, findSubscriberByEmail, upsertSubscriber } from '../../_lib/db';
import { methodNotAllowed, readRawBody } from '../../_lib/http';
import { parseInboundPayload, verifyResendWebhook } from '../../_lib/webhook';

const envConfig = getConfig();
const supabase = createDb(envConfig);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  try {
    const streamedBody = await readRawBody(req);
    const rawBody =
      streamedBody ||
      (typeof req.body === 'string'
        ? req.body
        : req.body
          ? JSON.stringify(req.body)
          : '');

    const verified = verifyResendWebhook({
      rawBody,
      headers: req.headers,
      secret: envConfig.resendWebhookSecret,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody || '{}') as Record<string, unknown>;
    const inbound = parseInboundPayload(payload);

    if (!inbound.fromEmail || !inbound.bodyText) {
      return res.status(400).json({ error: 'Missing inbound payload fields' });
    }

    let subscriber = await findSubscriberByEmail(supabase, inbound.fromEmail);
    if (!subscriber) {
      subscriber = await upsertSubscriber(supabase, inbound.fromEmail);
    }

    await createResponse(supabase, {
      subscriber_id: subscriber.id,
      from_email: inbound.fromEmail,
      subject: inbound.subject,
      body_text: inbound.bodyText,
      received_at: inbound.receivedAt,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('resend inbound webhook failed', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
