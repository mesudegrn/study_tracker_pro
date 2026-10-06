# study_tracker_pro

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-ih7fia8f)

## Supabase setup

Apply the SQL migrations in `supabase/migrations` to the project's Supabase database in timestamp order. In particular, apply `20261002170000_auth_profiles_and_grade_schema_repair.sql` if the database is missing `profiles` or `grade_entries`, or still reports an outdated PostgREST schema cache. It reconciles the owner-scoped tables, creates a signup trigger that copies name and semester metadata from `auth.users`, and requests a schema-cache reload. Grade entries and GPA calculator state are private to their authenticated owner through row-level security.

## Grade and GPA calculations

Course averages are weighted by entered assessment weights. Maximum and minimum final scores assume all remaining course weight is scored at 100% and 0%, respectively. The GPA calculator supports these 4.0 mappings:

- **AA:** AA 4.0, BA 3.5, BB 3.0, CB 2.5, CC 2.0, DC 1.5, DD 1.0, FD 0.5, FF 0.0.
- **A1:** A1 4.0, A2 3.75, A3 3.5, B1 3.25, B2 3.0, B3 2.75, C1 2.5, C2 2.25, C3 2.0, D 1.75, F 0.0.
- **A:** A+ 4.0, A 4.0, A- 3.7, B+ 3.3, B 3.0, B- 2.7, C+ 2.3, C 2.0, C- 1.7, D+ 1.3, D 1.0, D- 0.7, F 0.0.

For retakes, the old grade points are removed and the new grade points added without counting the credits a second time.
