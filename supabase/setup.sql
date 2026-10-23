-- Run once in your project's Supabase SQL Editor. No application secrets here.
create schema if not exists menu_mentor;
revoke all on schema menu_mentor from public, anon, authenticated;
create table if not exists menu_mentor.records(key text primary key, value jsonb not null);
create table if not exists menu_mentor.progress(id text primary key, correct integer not null default 0, attempts integer not null default 0, due bigint not null default 0);
alter table menu_mentor.records enable row level security;
alter table menu_mentor.progress enable row level security;
revoke all on all tables in schema menu_mentor from public, anon, authenticated;

create or replace function public.mm_record_get(p_key text) returns jsonb language sql security definer set search_path='' as $$ select coalesce((select value from menu_mentor.records where key=p_key),'null'::jsonb); $$;
create or replace function public.mm_record_put(p_key text,p_value jsonb) returns void language sql security definer set search_path='' as $$ insert into menu_mentor.records(key,value) values(p_key,p_value) on conflict(key) do update set value=excluded.value; $$;
create or replace function public.mm_record_delete(p_key text) returns void language sql security definer set search_path='' as $$ delete from menu_mentor.records where key=p_key; $$;
create or replace function public.mm_rate_hit(p_key text,p_expires bigint) returns integer language plpgsql security definer set search_path='' as $$ declare n integer;begin insert into menu_mentor.records(key,value) values(p_key,jsonb_build_object('count',1,'expires',p_expires)) on conflict(key) do update set value=jsonb_set(menu_mentor.records.value,'{count}',to_jsonb((menu_mentor.records.value->>'count')::integer+1)) returning (value->>'count')::integer into n;return n;end $$;
create or replace function public.mm_session_create(p_key text,p_value jsonb,p_now bigint) returns void language plpgsql security definer set search_path='' as $$ begin insert into menu_mentor.records(key,value) values(p_key,p_value);delete from menu_mentor.records where (key like 'pin-session:%' or key like 'pin-rate:%' or key like 'upload:%') and (value->>'expires')::bigint<p_now;end $$;

create or replace function public.mm_catalog(p_seed jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ declare result jsonb;begin
 perform pg_advisory_xact_lock(7719001);
 select value into result from menu_mentor.records where key='catalog';
 if result is null then insert into menu_mentor.records(key,value) values('catalog',p_seed);result:=p_seed;end if;
 return result;
end $$;
create or replace function public.mm_progress() returns jsonb language sql security definer set search_path='' as $$ select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from menu_mentor.progress p; $$;
create or replace function public.mm_catalog_save(p_items jsonb,p_reset text[],p_delete_draft boolean,p_expected jsonb) returns boolean language plpgsql security definer set search_path='' as $$ declare current jsonb;begin
 perform pg_advisory_xact_lock(7719001);select value into current from menu_mentor.records where key='catalog';
 if current is distinct from p_expected then return false;end if;
 insert into menu_mentor.records(key,value) values('catalog',p_items) on conflict(key) do update set value=excluded.value;
 delete from menu_mentor.progress where id=any(p_reset);
 if p_delete_draft then delete from menu_mentor.records where key='draft';end if;
 return true;
end $$;
create or replace function public.mm_answer(p_id text,p_correct boolean,p_attempt text,p_now bigint) returns jsonb language plpgsql security definer set search_path='' as $$ declare previous jsonb;result jsonb;catalog jsonb;begin
 perform pg_advisory_xact_lock(7719001);
 select value into previous from menu_mentor.records where key='answer:'||p_attempt;
 if previous is not null then if previous->>'id'<>p_id or (previous->>'answer')::boolean<>p_correct then raise exception 'answer_conflict';end if;return previous-'answer';end if;
 select value into catalog from menu_mentor.records where key='catalog';
 if catalog is null or not exists(select 1 from jsonb_array_elements(catalog) d where d->>'id'=p_id) then raise exception 'unknown_drink';end if;
 insert into menu_mentor.progress(id,correct,attempts,due) values(p_id,case when p_correct then 1 else 0 end,1,p_now+case when p_correct then 172800000 else 600000 end)
 on conflict(id) do update set correct=case when p_correct then menu_mentor.progress.correct+1 else 0 end,attempts=menu_mentor.progress.attempts+1,due=p_now+case when p_correct then least(30,(1::bigint << least(menu_mentor.progress.correct+1,5)))*86400000 else 600000 end
 returning to_jsonb(menu_mentor.progress.*) into result;
 insert into menu_mentor.records(key,value) values('answer:'||p_attempt,result||jsonb_build_object('answer',p_correct));return result;
end $$;

-- Optional import into a fresh project. Never overwrites an initialized catalog.
create or replace function public.mm_import_snapshot(p_catalog jsonb,p_progress jsonb) returns void language plpgsql security definer set search_path='' as $$ begin
 perform pg_advisory_xact_lock(7719001);
 if exists(select 1 from menu_mentor.records where key='catalog') then raise exception 'target_not_empty';end if;
 if jsonb_typeof(p_catalog)<>'array' or jsonb_array_length(p_catalog)<1 or jsonb_array_length(p_catalog)>300 then raise exception 'invalid_catalog';end if;
 insert into menu_mentor.records(key,value) values('catalog',p_catalog);
 insert into menu_mentor.progress(id,correct,attempts,due) select p->>'id',(p->>'correct')::integer,(p->>'attempts')::integer,(p->>'due')::bigint from jsonb_array_elements(p_progress) p where exists(select 1 from jsonb_array_elements(p_catalog) d where d->>'id'=p->>'id');
end $$;

-- All RPCs are server-only. An anon/publishable key cannot call them.
revoke all on function public.mm_record_get(text),public.mm_record_put(text,jsonb),public.mm_record_delete(text),public.mm_rate_hit(text,bigint),public.mm_session_create(text,jsonb,bigint),public.mm_catalog(jsonb),public.mm_progress(),public.mm_catalog_save(jsonb,text[],boolean,jsonb),public.mm_answer(text,boolean,text,bigint),public.mm_import_snapshot(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.mm_record_get(text),public.mm_record_put(text,jsonb),public.mm_record_delete(text),public.mm_rate_hit(text,bigint),public.mm_session_create(text,jsonb,bigint),public.mm_catalog(jsonb),public.mm_progress(),public.mm_catalog_save(jsonb,text[],boolean,jsonb),public.mm_answer(text,boolean,text,bigint),public.mm_import_snapshot(jsonb,jsonb) to service_role;

-- Private originals; upload goes straight to Storage, avoiding Vercel's body limit.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-originals','menu-originals',false,15728640,array['application/pdf','text/plain','text/csv','application/json','application/octet-stream'])
on conflict(id) do update set public=false,file_size_limit=15728640,allowed_mime_types=excluded.allowed_mime_types;
notify pgrst,'reload schema';
