import type { VercelRequest, VercelResponse } from '@vercel/node';

export function methodNotAllowed(res: VercelResponse, allow: string): void {
  res.setHeader('Allow', allow);
  res.status(405).json({ error: 'Method not allowed' });
}

export async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}
