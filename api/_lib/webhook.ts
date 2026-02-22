import crypto from 'crypto';
import type { IncomingHttpHeaders } from 'http';
import { Resend } from 'resend';
import { Webhook } from 'svix';

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a || '', 'utf8');
  const bBuf = Buffer.from(b || '', 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseSignature(headerValue = ''): string {
  const parts = String(headerValue)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!value) continue;
    if (key === 'v1') return value;
  }

  if (parts.length === 1 && !parts[0].includes('=')) return parts[0];
  return '';
}

export function verifyResendWebhook({
  rawBody,
  headers,
  secret,
}: {
  rawBody: string;
  headers: IncomingHttpHeaders;
  secret: string;
}): boolean {
  if (!secret) return false;

  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  // Resend webhooks now use Svix signatures. Verify with the SDK helper first.
  if (
    typeof svixId === 'string' &&
    typeof svixTimestamp === 'string' &&
    typeof svixSignature === 'string'
  ) {
    try {
      const webhook = new Webhook(secret);
      webhook.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback for legacy header format.
  const signatureHeader = headers['resend-signature'] || headers['x-resend-signature'] || '';
  const timestamp = headers['resend-timestamp'] || headers['x-resend-timestamp'] || '';

  if (!signatureHeader || !timestamp || Array.isArray(signatureHeader) || Array.isArray(timestamp)) {
    return false;
  }

  const signature = parseSignature(signatureHeader);
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  return safeEqual(signature, expected);
}

function extractSenderEmail(fromValue = ''): string {
  const from = String(fromValue);
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();
  return from.trim().toLowerCase();
}

export function parseInboundPayload(payload: Record<string, any> = {}): {
  type: string;
  emailId: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
} {
  const eventType = String(payload.type || '');
  const candidate = payload.data || payload;
  const emailId = String(candidate.email_id || '');
  const textBody = candidate.text || candidate.text_body || '';
  const htmlBody = candidate.html || candidate.html_body || '';
  const normalizedBody = textBody || String(htmlBody).replace(/<[^>]+>/g, ' ').trim();

  return {
    type: eventType,
    emailId,
    fromEmail: extractSenderEmail(candidate.from || ''),
    subject: candidate.subject || '',
    bodyText: normalizedBody,
    receivedAt: candidate.created_at || new Date().toISOString(),
  };
}

export async function fetchReceivedEmailBody(
  resendApiKey: string,
  emailId: string
): Promise<{ text: string; subject: string; from: string }> {
  if (!emailId || !resendApiKey) {
    return { text: '', subject: '', from: '' };
  }

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.get(emailId);

  if (result.error || !result.data) {
    return { text: '', subject: '', from: '' };
  }

  const text = result.data.text || result.data.html || '';
  return {
    text: String(text),
    subject: result.data.subject || '',
    from: result.data.from || '',
  };
}
