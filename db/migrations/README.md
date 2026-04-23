# DB migrations

Plain-text SQL migrations applied by hand via the Supabase SQL editor.
No tooling, no Docker — you copy, paste, run.

## Workflow

1. **Write the SQL** as a new file in this folder.
2. **Name it** `NNNN_short_snake_name.sql` where `NNNN` is the next
   zero-padded sequence number (e.g. `0002_add_region_to_accounts.sql`).
   Numbers only ever go up; never rewrite or reorder a migration that has
   already been applied to production.
3. **Apply it** in the Supabase SQL editor. Each file should be idempotent
   where possible (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … IF NOT
   EXISTS`, etc.) so re-running is safe.
4. **Commit** the file in the same PR as the code that needs the new schema.

## Rules

- One logical change per file. A refactor that touches three tables can be
  one file; "add X column and seed games" should be two.
- Never edit a committed migration. If the change was wrong, write a new
  migration that fixes it.
- Keep it SQL — no application-language seeds. If you need data fixtures,
  put them in a `seed.sql` file adjacent to the migration that introduces
  the tables.
- RLS policies live in the same migration that creates the table. A table
  without policies effectively hides every row, so ship them together.

## `0001_baseline.sql`

The baseline was **reconstructed from application code and the live DB
notes in `BoostV2_DB_Architecture.md`** rather than dumped from Postgres.
Before trusting it against a fresh database, run the introspection query
below in the Supabase SQL editor and diff the results against the baseline.
Anything the live DB has that the baseline doesn't → write `0002_*.sql` to
add it.

### Introspection query (run in Supabase SQL editor)

```sql
-- Tables + columns
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- Constraints
select tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name as foreign_table,
       ccu.column_name as foreign_column
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type;

-- Policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Functions
select proname, pg_get_functiondef(oid)
from pg_proc
where pronamespace = 'public'::regnamespace;

-- Triggers
select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema in ('public', 'auth')
order by event_object_table, trigger_name;
```
