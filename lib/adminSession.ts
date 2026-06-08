import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export type AdminSessionUser = {
  username: string;
};

const ADMIN_SESSION_COOKIE = 'obaol_admin_session';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET or SESSION_SECRET.');
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getAdminSessionSecret()).update(value).digest('hex');
}

function encode(payload: AdminSessionUser & { exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string): (AdminSessionUser & { exp: number }) | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSessionUser & { exp: number };
  if (!parsed.exp || Date.now() > parsed.exp) return null;
  return parsed;
}

export function setAdminSessionCookie(res: NextApiResponse, user: AdminSessionUser) {
  const token = encode({ ...user, exp: Date.now() + ADMIN_SESSION_TTL_MS });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`);
}

export function clearAdminSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function getAdminSessionFromRequest(req: NextApiRequest): AdminSessionUser | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  if (!found) return null;

  const token = found.slice(`${ADMIN_SESSION_COOKIE}=`.length);
  const decoded = decode(token);
  if (!decoded) return null;

  return { username: decoded.username };
}
