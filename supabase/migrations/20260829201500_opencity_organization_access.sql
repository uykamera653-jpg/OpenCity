-- Organization accounts need a safe ownership link for operational report updates.
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create policy "organizations update assigned reports" on public.reports
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'organization' and p.organization_id = reports.organization_id and p.is_blocked = false
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'organization' and p.organization_id = reports.organization_id and p.is_blocked = false
    )
  );

create policy "organizations create timeline" on public.report_timeline
  for insert to authenticated
  with check (
    author_id = auth.uid() and (
      public.is_admin() or exists (
        select 1 from public.profiles p
        join public.reports r on r.organization_id = p.organization_id
        where p.id = auth.uid() and p.role = 'organization' and r.id = report_timeline.report_id
      )
    )
  );
