import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SessionUser } from './types';

const SESSION_COOKIE = 'obaol_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Missing SESSION_SECRET.');
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function encode(payload: SessionUser & { exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string): (SessionUser & { exp: number }) | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const expected = sign(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionUser & { exp: number };
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, user: SessionUser) {
  const token = encode({ ...user, exp: Date.now() + SESSION_TTL_MS });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`);
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function getSessionFromRequest(req: NextApiRequest): SessionUser | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!found) return null;

  const token = found.slice(`${SESSION_COOKIE}=`.length);
  const decoded = decode(token);
  if (!decoded) return null;
  return { email: decoded.email, name: decoded.name ?? null };
}
