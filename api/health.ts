import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed } from './_lib/http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  return res.status(200).json({ ok: true });
}
