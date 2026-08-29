# OpenCity — Real backend migration

This file tracks the conversion from demo/mock state to Supabase-backed production behavior.

## Scope
- Supabase Auth for accounts and sessions
- Supabase Postgres for profiles, organizations, reports, votes, comments, notifications, announcements, routing rules, citizen resolutions, and sponsors
- Remove demo login and fake Google login behavior
- Persist all mutations in Supabase and refresh/query real data
- Keep UI behavior intact while replacing mock persistence

## Note
The existing app currently contains mock data and Zustand persistence. The migration must preserve existing UI contracts while moving persistence to Supabase.
