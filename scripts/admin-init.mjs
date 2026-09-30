/**
 * Creates (if needed) and grants the admin role to an email, so the in-app
 * CMS (hotel_content writes via RLS) has an owner.
 *
 * Usage:
 *   node scripts/admin-init.mjs [email] [password]
 *   (falls back to ADMIN_EMAIL / ADMIN_PASSWORD env, then to defaults)
 *
 * Credentials: reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from local env
 * files; the role grant runs over DIRECT_URL (Prisma), same as db-init.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(file) {
  const out = {};
  try {
    for (const line of readFileSync(resolve(root, file), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
  } catch {
    /* file optional */
  }
  return out;
}

const env = {
  ...loadEnv('.env'),
  ...loadEnv('.env.local'),
  ...loadEnv('.env.development.local'),
  ...process.env,
};

const email = (process.argv[2] || env.ADMIN_EMAIL || 'admin@atoll.app').toLowerCase();
const password = process.argv[3] || env.ADMIN_PASSWORD || 'Atoll-Cms-2026!';
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from env files.');
  process.exit(1);
}

// 1. Ensure the auth user exists (admin API — no signup rate limits, no email).
//    NOTE: the `?email=` filter is not an exact match — verify the email back.
let userId;
{
  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (res.ok) {
    const users = await res.json();
    userId = (users?.users ?? []).find((u) => (u.email || '').toLowerCase() === email)?.id;
  }
  if (!userId) {
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true, data: { full_name: 'Atoll Admin' } }),
    });
    const body = await created.json();
    if (!created.ok) {
      console.error('User create failed:', body?.msg || body?.message || created.status);
      process.exit(1);
    }
    userId = body.id;
    console.log(`Created user ${email}`);
  } else {
    console.log(`User ${email} already exists`);
    // Keep the known password (reset is idempotent and avoids stale credentials).
    const put = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, email_confirm: true }),
    });
    if (!put.ok) console.warn('Password reset failed:', put.status);
    else console.log(`Password reset for ${email}`);
  }
}

// 2. Grant the admin role (profile row exists via the signup trigger; insert is
//    a safety net for users created before the trigger).
const prisma = new PrismaClient({ datasourceUrl: env.DIRECT_URL });
try {
  await prisma.$executeRaw`
    insert into public.profiles (id, full_name, role)
    values (${userId}::uuid, 'Atoll Admin', 'admin')
    on conflict (id) do update set role = 'admin'`;
  console.log(`Role 'admin' granted to ${email} (${userId})`);
} finally {
  await prisma.$disconnect();
}
