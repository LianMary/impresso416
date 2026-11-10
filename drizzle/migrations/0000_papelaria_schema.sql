
create type public.app_role as enum ('admin', 'user');
create type public.order_status as enum ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  cpf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- signup trigger: profile + initial admin by email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if lower(new.email) = 'admin@papelariacores.com.br' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null default 'Casa',
  recipient text,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text not null default 'coral',
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  active boolean not null default true,
  featured boolean not null default false,
  sales_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read active" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "products admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(md5(random()::text),1,8)),
  user_id uuid not null,
  status order_status not null default 'aguardando_pagamento',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_cpf text,
  delivery_method text not null check (delivery_method in ('entrega','retirada')),
  address jsonb,
  payment_method text not null check (payment_method in ('pix','cartao')),
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders own or admin read" on public.orders for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items own or admin read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);

-- place order: validates stock, decrements, creates order atomically
create or replace function public.place_order(
  _items jsonb, _customer jsonb, _delivery_method text, _address jsonb, _payment_method text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _order_id uuid;
  _item jsonb;
  _p public.products%rowtype;
  _qty int;
  _subtotal numeric(10,2) := 0;
  _shipping numeric(10,2) := 0;
begin
  if _uid is null then raise exception 'Faça login para finalizar a compra'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Carrinho vazio'; end if;

  for _item in select * from jsonb_array_elements(_items) loop
    _qty := (_item->>'quantity')::int;
    select * into _p from public.products where id = (_item->>'product_id')::uuid and active for update;
    if not found then raise exception 'Produto indisponível'; end if;
    if _qty <= 0 or _p.stock < _qty then raise exception 'Estoque insuficiente para %', _p.name; end if;
    _subtotal := _subtotal + _p.price * _qty;
  end loop;

  if _delivery_method = 'entrega' then
    if _address is null then raise exception 'Endereço obrigatório'; end if;
    _shipping := case when _subtotal >= 150 then 0 else 15 end;
  end if;

  insert into public.orders (user_id, customer_name, customer_email, customer_phone, customer_cpf,
    delivery_method, address, payment_method, subtotal, shipping, total)
  values (_uid, _customer->>'name', _customer->>'email', _customer->>'phone', _customer->>'cpf',
    _delivery_method, case when _delivery_method = 'entrega' then _address else null end,
    _payment_method, _subtotal, _shipping, _subtotal + _shipping)
  returning id into _order_id;

  for _item in select * from jsonb_array_elements(_items) loop
    _qty := (_item->>'quantity')::int;
    update public.products set stock = stock - _qty, sales_count = sales_count + _qty
      where id = (_item->>'product_id')::uuid returning * into _p;
    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
    values (_order_id, _p.id, _p.name, _p.images[1], _p.price, _qty);
  end loop;

  return _order_id;
end; $$;
revoke execute on function public.place_order(jsonb,jsonb,text,jsonb,text) from public, anon;
grant execute on function public.place_order(jsonb,jsonb,text,jsonb,text) to authenticated;

-- storage policies (private bucket, admin manages)
create policy "admin upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin read product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));

-- seed
insert into public.categories (name, slug, description, color, emoji, sort_order) values
 ('Cadernos','cadernos','Cadernos, agendas e blocos','coral','📒',1),
 ('Canetas','canetas','Canetas gel, marca-texto e mais','sky','🖊️',2),
 ('Material escolar','material-escolar','Tudo para a volta às aulas','mint','🎒',3),
 ('Escritório','escritorio','Organização para sua mesa','sun','📎',4),
 ('Arte e artesanato','arte-e-artesanato','Tintas, pincéis e criatividade','grape','🎨',5);

insert into public.products (name, slug, description, price, category_id, stock, images, featured) values
 ('Caderno Espiral Coral A5','caderno-espiral-coral-a5','Caderno de capa dura com espiral dourada, 160 folhas pautadas de 90g. Perfeito para anotações do dia a dia.',39.90,(select id from public.categories where slug='cadernos'),25,'{/images/products/caderno.jpg}',true),
 ('Planner Semanal Menta','planner-semanal-menta','Planner sem data com 52 semanas, adesivos e bolso interno.',54.90,(select id from public.categories where slug='cadernos'),3,'{/images/products/caderno.jpg}',false),
 ('Kit 12 Canetas Gel Coloridas','kit-12-canetas-gel','Doze cores vibrantes com ponta 0.7mm e grip emborrachado.',32.50,(select id from public.categories where slug='canetas'),40,'{/images/products/canetas.jpg}',true),
 ('Marca-texto Pastel (6 un.)','marca-texto-pastel','Seis tons pastel que não mancham o papel.',27.90,(select id from public.categories where slug='canetas'),0,'{/images/products/canetas.jpg}',false),
 ('Lápis de Cor 24 Cores Estojo Metal','lapis-de-cor-24','Lápis de cor macios com estojo de metal reutilizável.',49.90,(select id from public.categories where slug='material-escolar'),18,'{/images/products/lapis.jpg}',true),
 ('Mochila Escolar Menta','mochila-escolar-menta','Mochila resistente com bolso frontal e laterais em tela.',149.90,(select id from public.categories where slug='material-escolar'),8,'{/images/products/mochila.jpg}',true),
 ('Organizador de Mesa Amarelo','organizador-de-mesa-amarelo','Organizador com 4 divisórias para canetas, tesoura e post-its.',44.90,(select id from public.categories where slug='escritorio'),12,'{/images/products/organizador.jpg}',false),
 ('Kit Escritório Criativo','kit-escritorio-criativo','Grampeador, tesoura e bloco adesivo em amarelo vibrante.',69.90,(select id from public.categories where slug='escritorio'),4,'{/images/products/organizador.jpg}',true),
 ('Aquarela 24 Cores + 3 Pincéis','aquarela-24-cores','Estojo de aquarela em pastilha com 24 cores intensas e 3 pincéis.',89.90,(select id from public.categories where slug='arte-e-artesanato'),10,'{/images/products/aquarela.jpg}',true),
 ('Bloco Aquarela A4 300g','bloco-aquarela-a4','Papel texturizado ideal para aquarela e guache, 12 folhas.',36.90,(select id from public.categories where slug='arte-e-artesanato'),20,'{/images/products/aquarela.jpg}',false);
