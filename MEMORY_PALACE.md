# Memory Palace — Marte & Zaharie Wedding Table Planner

Everything a developer (or Claude) needs to know to continue work on this project from a cold start.

---

## 1. What This App Does

A private, two-user web app for managing wedding seating at a venue split into three physical sections:
- **Women's Side** — 30 tables (numbered 1–30)
- **Men's Side** — 26 tables (numbered 1–26, separate numbering from Women)
- **Main Table** — 1 table (the head/wedding party table)

The Bride and Groom each log in, add guests, and assign them to tables in real time. Both sessions sync instantly via Supabase Realtime.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Realtime | Supabase Realtime (postgres_changes) |
| Hosting | Vercel |
| Repo | github.com/PepoStojan/marte-zaharie-weeding |

**Critical Next.js 16 note:** The auth/redirect file is `src/proxy.ts` (not `middleware.ts`). Next.js 16 renamed Middleware → Proxy. The exported function is named `proxy`, not `middleware`.

---

## 3. Supabase Project

| Item | Value |
|---|---|
| Project URL | https://vgpwbgrxswtewyetawqo.supabase.co |
| Project ref | vgpwbgrxswtewyetawqo |
| Anon key | sb_publishable_rGc3BNqyO8RD3GZPK5ancg_LS2wfqPT |
| SQL Editor | https://supabase.com/dashboard/project/vgpwbgrxswtewyetawqo/sql/new |
| Auth users | https://supabase.com/dashboard/project/vgpwbgrxswtewyetawqo/auth/users |

Env vars in `.env.local` (not committed) and Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL=https://vgpwbgrxswtewyetawqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rGc3BNqyO8RD3GZPK5ancg_LS2wfqPT
```

---

## 4. Database Schema

### `public.tables`
```sql
id             UUID PRIMARY KEY DEFAULT uuid_generate_v4()
table_number   INT4 NOT NULL
table_type     VARCHAR(20) CHECK (table_type IN ('Main', 'Women', 'Men'))
capacity_limit INT4 NOT NULL DEFAULT 12
```
**Unique constraint:** `(table_number, table_type)` — Women and Men each have their own 1–N numbering, so both can have a "table 1".

### `public.guests`
```sql
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
full_name  VARCHAR(255) NOT NULL
category   VARCHAR(100) NOT NULL DEFAULT ''  -- e.g. "Family Peposki"
table_id   UUID REFERENCES public.tables(id) ON DELETE SET NULL  -- nullable = unseated
created_at TIMESTAMPTZ DEFAULT now()
```

### DB-level triggers
- **`enforce_table_capacity`** — BEFORE INSERT OR UPDATE on guests. Aborts if the target table already has `capacity_limit` guests.
- **`enforce_user_limit`** — BEFORE INSERT on `auth.users`. Aborts if 2 users already exist (hard-coded two-user cap).

### RLS policies
All tables have RLS enabled. Authenticated users can SELECT/INSERT/UPDATE/DELETE on both `guests` and `tables`.

### Realtime
Both `guests` and `tables` are in `supabase_realtime` publication.

### Seeded data
- 1 Main table (table_number = 0, table_type = 'Main')
- 30 Women tables (table_number 1–30, table_type = 'Women')
- 26 Men tables (table_number 1–26, table_type = 'Men')
  - Originally seeded as 31–58, then renumbered to 1–26 via SQL migration
  - Also had tables 57 and 58 deleted (26 final, not 28)

### SQL migrations run (in order)
All located in `supabase/`:
1. `schema.sql` — initial schema + seed
2. `remove_extra_men_tables.sql` — DELETE tables 57, 58
3. `renumber_men_tables.sql` — drop old unique constraint, add composite unique, renumber Men 31-56 → 1-26

---

## 5. App Routes

```
/                    → redirects to /dashboard
/login               → email + password login (Supabase Auth)
/dashboard           → side picker: Women | Men | Main Table
/dashboard/women     → Women's side circle grid
/dashboard/men       → Men's side circle grid
/dashboard/main      → Main table circle grid
```

Auth is enforced by `src/proxy.ts`:
- Unauthenticated → redirect to `/login`
- Authenticated on `/login` → redirect to `/dashboard`

---

## 6. File Structure

```
src/
  app/
    page.tsx                  → redirects to /dashboard
    layout.tsx                → root layout (Geist font, metadata)
    globals.css               → Tailwind base styles
    login/page.tsx            → login form
    dashboard/
      page.tsx                → side picker (Women / Men / Main)
      women/page.tsx          → <SidePage sideType="Women" .../>
      men/page.tsx            → <SidePage sideType="Men" mainOnRight />
      main/page.tsx           → <SidePage sideType="Main" .../>
  components/
    CircleTable.tsx           → SVG pizza-slice circle per table
    SidePage.tsx              → shared page for all three sides
    TableModal.tsx            → bottom-sheet modal (assign/add guest)
  lib/
    supabase/
      client.ts               → createBrowserClient (client components)
      server.ts               → createServerClient (server components)
  types/
    index.ts                  → Table, Guest, TableType, GuestsByCategory
  proxy.ts                    → Next.js 16 Proxy (auth redirect)
supabase/
  schema.sql                  → full initial schema
  remove_extra_men_tables.sql → deleted tables 57, 58
  renumber_men_tables.sql     → Men table renumbering migration
```

---

## 7. Key Components

### `CircleTable.tsx`
SVG donut chart where each slice = one seat (capacity_limit slices total).
- Occupied slice: colored fill (rose=Women, blue=Men, amber=Main) + guest's first name rotated radially
- Empty slice: light gray (`#f3f4f6`)
- Center hole: white circle showing table number and `seated/cap` count
- `direction: ltr` forced on the button to prevent text flip inside RTL grid
- Size: 140×140px fixed SVG viewBox

### `SidePage.tsx`
Shared component for Women, Men, and Main sides. Props:
```typescript
sideType: TableType        // 'Women' | 'Men' | 'Main'
title: string
emoji: string
accentClass: string        // Tailwind text color class
mainOnRight?: boolean      // true for Men (main table appears on right)
```
**Layout logic:**
- Women: main table rectangle on LEFT, circles flow left→right (ascending, LTR grid)
- Men: main table rectangle on RIGHT, circles flow right→left (ascending, RTL grid via `direction: rtl` on grid div only)
- `ROWS = 5` — grid fills top-to-bottom in columns of 5
- Realtime subscription updates on every postgres change

**Men's RTL trick:**
The grid container has `direction: rtl` so table 1 lands top-right (nearest main table), table 2 below it, table 6 at top of next column left. Each `CircleTable` button resets to `direction: ltr` so SVG renders correctly.

### `TableModal.tsx`
Opens when a circle is clicked.
- Mobile: full-screen bottom sheet (slides up) with drag handle
- Desktop: centered card with rounded corners
- Two tabs: "Assign existing" (dropdown of all unseated guests) and "Add new guest" (name + category form, seats directly at table)
- Shows current guests with unassign (↩) and delete (✕) actions
- Occupancy bar and FULL state

---

## 8. Realtime Sync

Both users get live updates via:
```typescript
supabase.channel(`realtime-${sideType}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchData)
  .subscribe()
```
When Bride assigns a guest, Groom's screen updates without refresh.

---

## 9. Business Rules

| Rule | Where enforced |
|---|---|
| Max 12 guests per table | DB trigger + client-side check before API call |
| Max 2 users | DB trigger on `auth.users` |
| Only authenticated users can read/write | Supabase RLS |
| Women tables 1–30, Men tables 1–26 (separate numbering) | Composite unique constraint `(table_number, table_type)` |
| Guest unseated = `table_id IS NULL` | FK nullable |

---

## 10. Deployment

- **Vercel project:** `marte-zaharie-weeding` under Stojan's projects (Hobby plan)
- **Live URL:** https://marte-zaharie-weeding.vercel.app
- **Auto-deploy:** every push to `main` branch triggers Vercel deployment
- **Env vars set in Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 11. Known Decisions & Gotchas

- **`table_number = 0` is the Main Table.** The circle renders `★` instead of `0`.
- **Men tables were originally 31–56.** They were renumbered to 1–26 via SQL after initial seed.
- **`supabase_realtime` publication** must include both tables — already done in schema.sql.
- **No drag-and-drop.** Assignment is: click circle → modal → select guest or add new → confirm.
- **Category field is a free-text string** (denormalized), not a foreign key to a categories table.
- **`npm run build` passes with zero warnings** — keep it that way before every push.
- **Next.js 16 breaking change:** `src/middleware.ts` → `src/proxy.ts`, function name `middleware` → `proxy`.
- **Tailwind v4** is in use — config is in `postcss.config.mjs`, no `tailwind.config.ts` file.
