-- Real notifications: assignment to an organization and status changes.
create or replace function public.notify_org_on_report_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.organization_id is not null then
    insert into public.notifications(user_id,type,title,message,report_id,read)
    select p.id,'assignment','Yangi murojaat',coalesce(new.title,'Yangi murojaat') || ' sizning tashkilotingizga yuborildi.',new.id,false
    from public.profiles p
    where p.role='organization' and p.organization_id=new.organization_id and coalesce(p.is_blocked,false)=false;
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_org_report_insert on public.reports;
create trigger trg_notify_org_report_insert after insert on public.reports for each row execute function public.notify_org_on_report_insert();

create or replace function public.notify_report_status_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from new.status and new.author_id is not null then
    insert into public.notifications(user_id,type,title,message,report_id,read)
    values(new.author_id,'status_change','Murojaat holati yangilandi','“' || coalesce(new.title,'Murojaat') || '” holati: ' || new.status,new.id,false);
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_report_status on public.reports;
create trigger trg_notify_report_status after update of status on public.reports for each row execute function public.notify_report_status_change();
