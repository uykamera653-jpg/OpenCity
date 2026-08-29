-- OpenCity production hardening: auth/profile, storage, RLS and operational writes.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_blocked = false
  );
$$;

-- Profiles: a newly authenticated user may create only their own citizen profile.
create policy "users create own profile" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'citizen');

-- Admin read/update access. The security-definer helper avoids recursive RLS evaluation.
create policy "admins read profiles" on public.profiles
  for select to authenticated
  using (public.is_admin() or id = auth.uid());
create policy "admins update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

create policy "admins update reports" on public.reports
  for update to authenticated
  using (public.is_admin());
create policy "admins delete reports" on public.reports
  for delete to authenticated
  using (public.is_admin());

create policy "authenticated read votes" on public.report_votes
  for select to authenticated using (true);
create policy "authenticated read comment likes" on public.comment_likes
  for select to authenticated using (true);
create policy "authenticated like comments" on public.comment_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "authenticated unlike comments" on public.comment_likes
  for delete to authenticated using (user_id = auth.uid());

create policy "authenticated create timeline" on public.report_timeline
  for insert to authenticated with check (author_id = auth.uid() or public.is_admin());
create policy "admins update timeline" on public.report_timeline
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "users read own resolutions" on public.citizen_resolutions
  for select to authenticated using (solver_id = auth.uid() or public.is_admin());
create policy "admins update resolutions" on public.citizen_resolutions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated create notifications" on public.notifications
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy "admins manage organizations" on public.organizations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated create sponsors" on public.business_sponsors
  for insert to authenticated with check (user_id = auth.uid());
create policy "sponsor owners update" on public.business_sponsors
  for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Public read of the operational tables is intentional for the public civic feed.
create policy "public read resolution" on public.citizen_resolutions
  for select using (true);
create policy "public read resolution votes" on public.resolution_votes
  for select using (true);

-- Storage for report/completion media.
insert into storage.buckets (id, name, public)
values ('opencity-media', 'opencity-media', true)
on conflict (id) do update set public = true;

create policy "public read OpenCity media" on storage.objects
  for select using (bucket_id = 'opencity-media');
create policy "authenticated upload OpenCity media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'opencity-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own OpenCity media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'opencity-media' and owner_id = auth.uid()::text);

-- Useful base organizations/categories. Inserts are idempotent.
insert into public.organizations (id,name,description,phone,email,verified,district)
values
 ('00000000-0000-0000-0000-000000000001','Shahar Ma''muriyati','OpenCity shahar murojaatlarini boshqarish markazi','','',true,'Toshkent'),
 ('00000000-0000-0000-0000-000000000002','Toshkent Obodonlashtirish','Obodonlashtirish va chiqindilar bo‘yicha mas''ul tashkilot','','',true,'Toshkent'),
 ('00000000-0000-0000-0000-000000000003','Toshkent Suv Ta''minoti','Suv va kanalizatsiya masalalari bo‘yicha mas''ul tashkilot','','',true,'Toshkent'),
 ('00000000-0000-0000-0000-000000000004','Toshkent Elektr Tarmoqlari','Elektr ta''minoti bo‘yicha mas''ul tashkilot','','',true,'Toshkent')
on conflict (id) do nothing;

insert into public.categories (id,name,name_en,icon,color,bg_color,organization_id)
values
 ('roads','Yo‘llar','Roads','🛣️','#2563EB','#EFF6FF','00000000-0000-0000-0000-000000000001'),
 ('electricity','Elektr','Electricity','⚡','#F59E0B','#FFFBEB','00000000-0000-0000-0000-000000000004'),
 ('water','Suv','Water','💧','#0EA5E9','#F0F9FF','00000000-0000-0000-0000-000000000003'),
 ('gas','Gaz','Gas','🔥','#EF4444','#FEF2F2','00000000-0000-0000-0000-000000000001'),
 ('sewage','Kanalizatsiya','Sewage','🚰','#6366F1','#EEF2FF','00000000-0000-0000-0000-000000000003'),
 ('garbage','Chiqindi','Garbage','🗑️','#16A34A','#F0FDF4','00000000-0000-0000-0000-000000000002'),
 ('streetlights','Ko‘cha chiroqlari','Street lights','💡','#EAB308','#FEFCE8','00000000-0000-0000-0000-000000000001'),
 ('parks','Bog‘lar','Parks','🌳','#22C55E','#F0FDF4','00000000-0000-0000-0000-000000000002'),
 ('trees','Daraxtlar','Trees','🌲','#15803D','#F0FDF4','00000000-0000-0000-0000-000000000002'),
 ('transport','Transport','Transport','🚌','#7C3AED','#F5F3FF','00000000-0000-0000-0000-000000000001'),
 ('environment','Atrof-muhit','Environment','🌍','#059669','#ECFDF5','00000000-0000-0000-0000-000000000001'),
 ('buildings','Binolar','Buildings','🏢','#64748B','#F8FAFC','00000000-0000-0000-0000-000000000001'),
 ('safety','Xavfsizlik','Safety','🚨','#DC2626','#FEF2F2','00000000-0000-0000-0000-000000000001'),
 ('animals','Hayvonlar','Animals','🐾','#D97706','#FFFBEB','00000000-0000-0000-0000-000000000001'),
 ('other','Boshqa','Other','📌','#6B7280','#F9FAFB','00000000-0000-0000-0000-000000000001')
on conflict (id) do update set organization_id = excluded.organization_id;
