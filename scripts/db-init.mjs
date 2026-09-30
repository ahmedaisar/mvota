/**
 * Post-Prisma database init: foreign keys to auth.users, Row Level Security
 * policies, grants, and the signup trigger that creates profile + rewards rows.
 * Idempotent — safe to re-run. Uses the session-mode pooler (DIRECT_URL).
 *
 * Usage: npm run db:init
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
    /* .env may not exist — Prisma will fall back to its own loading */
  }
  return out;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const directUrl = env.DIRECT_URL || process.env.DIRECT_URL;
if (!directUrl) {
  console.error('DIRECT_URL missing — add it to .env (see Supabase ORM connect steps).');
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: directUrl });

const statements = [
  // Foreign keys to auth.users (Prisma cannot express cross-schema FKs)
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'profiles_user_fk') then
       alter table public.profiles
         add constraint profiles_user_fk foreign key (id) references auth.users (id) on delete cascade;
     end if;
   end $$`,
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'rewards_user_fk') then
       alter table public.rewards
         add constraint rewards_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
     end if;
   end $$`,
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'bookings_user_fk') then
       alter table public.bookings
         add constraint bookings_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
     end if;
   end $$`,
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'saved_stays_user_fk') then
       alter table public.saved_stays
         add constraint saved_stays_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
     end if;
   end $$`,
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'reviews_user_fk') then
       alter table public.reviews
         add constraint reviews_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
     end if;
   end $$`,

  // Domain checks Prisma does not manage
  `do $$ begin
     if not exists (select 1 from pg_constraint where conname = 'bookings_status_check') then
       alter table public.bookings
         add constraint bookings_status_check check (status in ('confirmed', 'cancelled', 'completed'));
     end if;
     if not exists (select 1 from pg_constraint where conname = 'bookings_payment_type_check') then
       alter table public.bookings
         add constraint bookings_payment_type_check check (payment_type in ('pay_at_property', 'paid'));
     end if;
     if not exists (select 1 from pg_constraint where conname = 'reviews_rating_check') then
       alter table public.reviews
         add constraint reviews_rating_check check (rating between 1 and 5);
     end if;
   end $$`,

  // Row Level Security
  `alter table public.profiles enable row level security`,
  `alter table public.rewards enable row level security`,
  `alter table public.bookings enable row level security`,
  `alter table public.saved_stays enable row level security`,
  `alter table public.hotel_content enable row level security`,
  `alter table public.reviews enable row level security`,

  // is_admin(): security-definer so RLS can check the caller's role without
  // exposing other users' profile rows.
  `create or replace function public.is_admin() returns boolean
     language sql security definer set search_path = public stable
   as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$`,

  `drop policy if exists "own profile" on public.profiles`,
  `create policy "own profile" on public.profiles for select using (auth.uid() = id)`,
  `drop policy if exists "update own profile" on public.profiles`,
  `create policy "update own profile" on public.profiles for update using (auth.uid() = id)`,

  `drop policy if exists "own rewards" on public.rewards`,
  `create policy "own rewards" on public.rewards for select using (auth.uid() = user_id)`,
  `drop policy if exists "update own rewards" on public.rewards`,
  `create policy "update own rewards" on public.rewards for update using (auth.uid() = user_id)`,

  `drop policy if exists "own bookings" on public.bookings`,
  `create policy "own bookings" on public.bookings for select using (auth.uid() = user_id)`,
  `drop policy if exists "insert own bookings" on public.bookings`,
  `create policy "insert own bookings" on public.bookings for insert with check (auth.uid() = user_id)`,
  `drop policy if exists "update own bookings" on public.bookings`,
  `create policy "update own bookings" on public.bookings for update using (auth.uid() = user_id)`,

  `drop policy if exists "own saved stays" on public.saved_stays`,
  `create policy "own saved stays" on public.saved_stays for select using (auth.uid() = user_id)`,
  `drop policy if exists "save own stays" on public.saved_stays`,
  `create policy "save own stays" on public.saved_stays for insert with check (auth.uid() = user_id)`,
  `drop policy if exists "unsave own stays" on public.saved_stays`,
  `create policy "unsave own stays" on public.saved_stays for delete using (auth.uid() = user_id)`,

  // CMS: world-readable content, admin-only writes.
  `drop policy if exists "public read hotel_content" on public.hotel_content`,
  `create policy "public read hotel_content" on public.hotel_content for select using (true)`,
  `drop policy if exists "admin insert hotel_content" on public.hotel_content`,
  `create policy "admin insert hotel_content" on public.hotel_content for insert with check (public.is_admin())`,
  `drop policy if exists "admin update hotel_content" on public.hotel_content`,
  `create policy "admin update hotel_content" on public.hotel_content for update using (public.is_admin())`,
  `drop policy if exists "admin delete hotel_content" on public.hotel_content`,
  `create policy "admin delete hotel_content" on public.hotel_content for delete using (public.is_admin())`,

  // Reviews: public read; authenticated authors manage their own; admins moderate.
  `drop policy if exists "public read reviews" on public.reviews`,
  `create policy "public read reviews" on public.reviews for select using (true)`,
  `drop policy if exists "insert own reviews" on public.reviews`,
  `create policy "insert own reviews" on public.reviews for insert with check (auth.uid() = user_id)`,
  `drop policy if exists "update own reviews" on public.reviews`,
  `create policy "update own reviews" on public.reviews for update using (auth.uid() = user_id)`,
  `drop policy if exists "delete own or admin reviews" on public.reviews`,
  `create policy "delete own or admin reviews" on public.reviews for delete using (auth.uid() = user_id or public.is_admin())`,

  `grant all on table public.profiles to postgres, anon, authenticated, service_role`,
  `grant all on table public.rewards to postgres, anon, authenticated, service_role`,
  `grant all on table public.bookings to postgres, anon, authenticated, service_role`,
  `grant all on table public.saved_stays to postgres, anon, authenticated, service_role`,
  `grant all on table public.hotel_content to postgres, anon, authenticated, service_role`,
  `grant all on table public.reviews to postgres, anon, authenticated, service_role`,
  `grant execute on function public.is_admin() to postgres, anon, authenticated, service_role`,

  // Profile + rewards rows are created automatically at signup.
  `create or replace function public.handle_new_user() returns trigger
     language plpgsql security definer set search_path = public
   as $$
   begin
     insert into public.profiles (id, full_name)
     values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
     on conflict (id) do nothing;
     insert into public.rewards (user_id) values (new.id)
     on conflict (user_id) do nothing;
     return new;
   end;
   $$`,
  `drop trigger if exists on_auth_user_created on auth.users`,
  `create trigger on_auth_user_created
     after insert on auth.users
     for each row execute function public.handle_new_user()`,
];

let failed = false;
for (const [i, sql] of statements.entries()) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (e) {
    console.error(`  [${i + 1}/${statements.length}] FAILED: ${(e.message || String(e)).trim().split('\n')[0] || e.code || e}`);
    console.error(`    SQL: ${sql.slice(0, 160).replace(/\s+/g, ' ')}`);
    failed = true;
    break;
  }
}
if (!failed) console.log(`Applied ${statements.length} statements.`);

const tables = await prisma.$queryRawUnsafe(
  `select table_name t from information_schema.tables where table_schema = 'public'
     and table_name in ('profiles','rewards','bookings','saved_stays','hotel_content','reviews') order by 1`,
);
const policies = await prisma.$queryRawUnsafe(
  `select count(*)::int n from pg_policies where schemaname = 'public'`,
);
const trigger = await prisma.$queryRawUnsafe(
  `select count(*)::int n from pg_trigger where tgname = 'on_auth_user_created' and tgisinternal = false`,
);
console.log('Tables   :', tables.map((r) => r.t).join(', ') || '(none)');
console.log('Policies :', policies[0].n);
console.log('Trigger  :', trigger[0].n ? 'installed' : 'MISSING');

await prisma.$disconnect();
process.exit(failed ? 1 : 0);
