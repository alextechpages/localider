create type public.app_role as enum ('admin');

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.admin_roles to authenticated;
grant all on public.admin_roles to service_role;
alter table public.admin_roles enable row level security;
create policy "Users see own role" on public.admin_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to anon, authenticated;

create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  lock table public.admin_roles in exclusive mode;
  if exists (select 1 from public.admin_roles where role = 'admin') then return false; end if;
  insert into public.admin_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
revoke execute on function public.claim_first_admin() from anon, public;
grant execute on function public.claim_first_admin() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories readable" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.categories (slug, name, sort_order) values
  ('economico','Econômico',1),('hatch','Hatch',2),('seda','Sedã',3),
  ('suv','SUV',4),('picape','Picape',5),('utilitario','Utilitário',6);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  model text not null,
  year int,
  category_id uuid references public.categories(id) on delete set null,
  transmission text not null default 'manual' check (transmission in ('manual','automatica')),
  passengers int not null default 5,
  air_conditioning boolean not null default true,
  fuel text,
  description text not null default '',
  features text[] not null default '{}',
  main_image_url text,
  status text not null default 'disponivel' check (status in ('disponivel','sob_consulta','indisponivel')),
  is_published boolean not null default false,
  is_demo boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.vehicles to anon, authenticated;
grant insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;
create policy "Published vehicles readable" on public.vehicles for select to anon, authenticated
  using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert vehicles" on public.vehicles for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update vehicles" on public.vehicles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete vehicles" on public.vehicles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger vehicles_touch before update on public.vehicles for each row execute function public.touch_updated_at();

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.vehicle_images to anon, authenticated;
grant insert, update, delete on public.vehicle_images to authenticated;
grant all on public.vehicle_images to service_role;
alter table public.vehicle_images enable row level security;
create policy "Images of visible vehicles" on public.vehicle_images for select to anon, authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.is_published or public.has_role(auth.uid(), 'admin'))));
create policy "Admins manage images" on public.vehicle_images for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Settings readable" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.site_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.site_settings (id, data) values (1, jsonb_build_object(
  'hero_title','Seu próximo destino começa aqui!',
  'hero_subtitle','Locação de veículos com praticidade, segurança e liberdade para você ir mais longe.',
  'hero_image','',
  'road_image','',
  'about_image','',
  'about_title','Uma locadora feita para quem vive Luís Eduardo Magalhães',
  'about_text','A Localider é uma locadora de veículos de Luís Eduardo Magalhães – BA. Trabalhamos com atendimento próximo e transparente, ajudando cada cliente a encontrar o veículo certo para o trabalho, para a viagem em família ou para o dia a dia.' || chr(10) || chr(10) || 'Nosso compromisso é oferecer veículos revisados, um processo simples e uma equipe que atende você de verdade, do primeiro contato até a devolução.',
  'whatsapp','5577999840490',
  'phone_primary','(77) 99984-0490',
  'phone_secondary','(77) 99991-4748',
  'instagram','https://www.instagram.com/localider_lem/',
  'address_1','Av. JK, nº 1885, Centro, Luís Eduardo Magalhães – BA',
  'address_2','Av. JK, nº 2305, Centro, Luís Eduardo Magalhães – BA'
));

insert into public.vehicles (slug, brand, model, year, category_id, transmission, passengers, air_conditioning, fuel, description, features, main_image_url, status, is_published, is_demo, sort_order)
select v.slug, v.brand, v.model, v.year, c.id, v.transmission, v.passengers, true, v.fuel, v.description, v.features, v.img, v.status, true, true, v.ord
from (values
  ('demo-hatch','Exemplo','Hatch Compacto',2024,'hatch','manual',5,'Flex','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Direção elétrica','Vidros elétricos','Bluetooth'],'/demo/hatch.jpg','disponivel',1),
  ('demo-seda','Exemplo','Sedã Executivo',2024,'seda','automatica',5,'Flex','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Porta-malas amplo','Câmera de ré','Multimídia'],'/demo/seda.jpg','disponivel',2),
  ('demo-suv','Exemplo','SUV Familiar',2024,'suv','automatica',5,'Flex','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Posição de dirigir elevada','Multimídia','Sensor de estacionamento'],'/demo/suv.jpg','sob_consulta',3),
  ('demo-picape','Exemplo','Picape Cabine Dupla',2024,'picape','manual',5,'Diesel','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Caçamba','Tração robusta','Ideal para o campo'],'/demo/picape.jpg','disponivel',4),
  ('demo-utilitario','Exemplo','Utilitário de Carga',2023,'utilitario','manual',2,'Flex','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Compartimento de carga','Econômico'],'/demo/utilitario.jpg','disponivel',5),
  ('demo-economico','Exemplo','Econômico Urbano',2023,'economico','manual',5,'Flex','Veículo demonstrativo. Substitua pelo cadastro real da frota no painel administrativo.', array['Baixo consumo','Fácil de estacionar'],'/demo/economico.jpg','disponivel',6)
) as v(slug,brand,model,year,cat,transmission,passengers,fuel,description,features,img,status,ord)
join public.categories c on c.slug = v.cat;

insert into public.vehicle_images (vehicle_id, url, sort_order)
select id, main_image_url, 0 from public.vehicles where is_demo;

create policy "Admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Public read media" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');