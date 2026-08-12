
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','customer');
create type public.order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled','returned');
create type public.coupon_type as enum ('percent','fixed');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  region text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin')) with check (true);
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- catalog
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_fr text not null,
  image_url text,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_fr text not null, hex text not null default '#000000',
  created_at timestamptz not null default now()
);
create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique, position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name_ar text not null, name_fr text not null,
  description_ar text, description_fr text,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2),
  category_id uuid references public.categories(id) on delete set null,
  featured boolean not null default false,
  is_new boolean not null default false,
  best_seller boolean not null default false,
  active boolean not null default true,
  sales_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(active);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null, position int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.colors(id) on delete set null,
  size_id uuid references public.sizes(id) on delete set null,
  stock int not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_id, size_id)
);
create index product_variants_product_idx on public.product_variants(product_id);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_fr text not null,
  fee numeric(10,2) not null default 0,
  eta_ar text not null default '', eta_fr text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.coupon_type not null default 'percent',
  value numeric(10,2) not null check (value > 0),
  min_order numeric(10,2) not null default 0,
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending',
  full_name text not null, phone text not null, email text,
  address text not null, city text not null, region text, postal_code text, notes text,
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  payment_method text not null default 'cod',
  tracking_number text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name_ar text not null, name_fr text not null,
  color_ar text, color_fr text, size_label text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  author_name text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews(product_id);

create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, phone text, message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- grants
grant select on public.categories, public.colors, public.sizes, public.products,
  public.product_images, public.product_variants, public.delivery_zones, public.settings, public.reviews to anon, authenticated;
grant insert, update, delete on public.categories, public.colors, public.sizes, public.products,
  public.product_images, public.product_variants, public.delivery_zones, public.settings, public.coupons to authenticated;
grant select on public.coupons to authenticated;
grant select, insert, update, delete on public.orders, public.order_items, public.favorites, public.reviews to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant insert on public.newsletter to anon, authenticated;
grant select, delete on public.newsletter to authenticated;
grant all on public.categories, public.colors, public.sizes, public.products, public.product_images,
  public.product_variants, public.delivery_zones, public.coupons, public.orders, public.order_items,
  public.favorites, public.reviews, public.settings, public.contact_messages, public.newsletter to service_role;

alter table public.categories enable row level security;
alter table public.colors enable row level security;
alter table public.sizes enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter enable row level security;

-- public read policies
create policy "public read categories" on public.categories for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read colors" on public.colors for select to anon, authenticated using (true);
create policy "admin write colors" on public.colors for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read sizes" on public.sizes for select to anon, authenticated using (true);
create policy "admin write sizes" on public.sizes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read products" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read product images" on public.product_images for select to anon, authenticated using (true);
create policy "admin write product images" on public.product_images for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read variants" on public.product_variants for select to anon, authenticated using (true);
create policy "admin write variants" on public.product_variants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read zones" on public.delivery_zones for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write zones" on public.delivery_zones for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin read coupons" on public.coupons for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin write coupons" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read settings" on public.settings for select to anon, authenticated using (true);
create policy "admin write settings" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "own orders read" on public.orders for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "own order items read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);

create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "read approved reviews" on public.reviews for select to anon, authenticated using (approved or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "insert own review if purchased" on public.reviews for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.product_id = reviews.product_id and o.user_id = auth.uid()
  )
);
create policy "update own review" on public.reviews for update to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin')) with check (true);
create policy "delete own review" on public.reviews for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create policy "anyone can contact" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin read contact" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin manage contact" on public.contact_messages for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete contact" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "anyone can subscribe" on public.newsletter for insert to anon, authenticated with check (true);
create policy "admin read newsletter" on public.newsletter for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete newsletter" on public.newsletter for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger variants_updated before update on public.product_variants for each row execute function public.set_updated_at();
create trigger zones_updated before update on public.delivery_zones for each row execute function public.set_updated_at();
create trigger coupons_updated before update on public.coupons for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();

-- secure coupon preview
create or replace function public.preview_coupon(_code text, _subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.coupons%rowtype; d numeric;
begin
  select * into c from public.coupons where upper(code) = upper(_code) and active;
  if not found then return jsonb_build_object('valid', false, 'reason', 'invalid'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('valid', false, 'reason', 'expired'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('valid', false, 'reason', 'limit'); end if;
  if _subtotal < c.min_order then return jsonb_build_object('valid', false, 'reason', 'min_order', 'min_order', c.min_order); end if;
  d := case when c.type = 'percent' then round(_subtotal * c.value / 100, 2) else c.value end;
  if d > _subtotal then d := _subtotal; end if;
  return jsonb_build_object('valid', true, 'code', c.code, 'discount', d);
end; $$;
grant execute on function public.preview_coupon(text, numeric) to anon, authenticated;

-- secure order placement: totals computed from DB, stock reserved
create or replace function public.place_order(_items jsonb, _customer jsonb, _zone_id uuid, _coupon text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; v record; p record; zone record; c public.coupons%rowtype;
  subtotal numeric := 0; discount numeric := 0; fee numeric := 0;
  new_order public.orders%rowtype; num text; qty int;
begin
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'EMPTY_CART'; end if;
  select * into zone from public.delivery_zones where id = _zone_id and active;
  if not found then raise exception 'INVALID_ZONE'; end if;
  fee := zone.fee;

  num := 'MA-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders (order_number, user_id, full_name, phone, email, address, city, region, postal_code, notes,
    delivery_zone_id, subtotal, discount, delivery_fee, total, coupon_code)
  values (num, auth.uid(),
    coalesce(_customer->>'full_name',''), coalesce(_customer->>'phone',''), nullif(_customer->>'email',''),
    coalesce(_customer->>'address',''), zone.name_fr, nullif(_customer->>'region',''), nullif(_customer->>'postal_code',''),
    nullif(_customer->>'notes',''), zone.id, 0, 0, fee, 0, nullif(upper(_coupon),''))
  returning * into new_order;

  for it in select * from jsonb_array_elements(_items) loop
    qty := greatest(1, coalesce((it->>'quantity')::int, 1));
    select pv.*, co.name_ar as c_ar, co.name_fr as c_fr, s.label as s_label
      into v
      from public.product_variants pv
      left join public.colors co on co.id = pv.color_id
      left join public.sizes s on s.id = pv.size_id
      where pv.id = (it->>'variant_id')::uuid
      for update;
    if not found then raise exception 'INVALID_VARIANT'; end if;
    select * into p from public.products where id = v.product_id and active;
    if not found then raise exception 'INVALID_PRODUCT'; end if;
    if v.stock < qty then raise exception 'OUT_OF_STOCK:%', p.name_fr; end if;

    update public.product_variants set stock = stock - qty where id = v.id;
    update public.products set sales_count = sales_count + qty where id = p.id;
    subtotal := subtotal + (p.price * qty);

    insert into public.order_items (order_id, product_id, variant_id, name_ar, name_fr, color_ar, color_fr, size_label, image_url, unit_price, quantity)
    values (new_order.id, p.id, v.id, p.name_ar, p.name_fr, v.c_ar, v.c_fr, v.s_label,
      (select url from public.product_images where product_id = p.id order by position limit 1), p.price, qty);
  end loop;

  if nullif(_coupon,'') is not null then
    select * into c from public.coupons where upper(code) = upper(_coupon) and active;
    if found
      and (c.expires_at is null or c.expires_at > now())
      and (c.usage_limit is null or c.used_count < c.usage_limit)
      and subtotal >= c.min_order then
      discount := case when c.type = 'percent' then round(subtotal * c.value / 100, 2) else c.value end;
      if discount > subtotal then discount := subtotal; end if;
      update public.coupons set used_count = used_count + 1 where id = c.id;
    else
      discount := 0;
      update public.orders set coupon_code = null where id = new_order.id;
    end if;
  end if;

  update public.orders set subtotal = subtotal, discount = discount, total = subtotal - discount + fee
    where id = new_order.id;

  return jsonb_build_object('id', new_order.id, 'order_number', num,
    'subtotal', subtotal, 'discount', discount, 'delivery_fee', fee, 'total', subtotal - discount + fee);
end; $$;
grant execute on function public.place_order(jsonb, jsonb, uuid, text) to anon, authenticated;

-- restore stock when an order is cancelled/returned before shipping
create or replace function public.handle_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('cancelled','returned') and old.status not in ('cancelled','returned','shipped','delivered') then
    update public.product_variants pv set stock = pv.stock + oi.quantity
      from public.order_items oi where oi.order_id = new.id and oi.variant_id = pv.id;
  end if;
  return new;
end; $$;
create trigger orders_status_change after update of status on public.orders for each row execute function public.handle_order_status_change();

-- guest order lookup by number + phone
create or replace function public.track_order(_order_number text, _phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('order', to_jsonb(o) - 'admin_notes',
    'items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where upper(o.order_number) = upper(_order_number) and o.phone = _phone
  limit 1;
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;
