-- ============================================
-- RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES
-- ============================================

-- 1. Supprimer toutes les tables existantes (dans le bon ordre)
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.product_variants cascade;
drop table if exists public.product_images cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.colors cascade;
drop table if exists public.sizes cascade;
drop table if exists public.delivery_zones cascade;
drop table if exists public.coupons cascade;
drop table if exists public.favorites cascade;
drop table if exists public.reviews cascade;
drop table if exists public.profiles cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.settings cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.newsletter cascade;

-- 2. Supprimer les types existants
drop type if exists public.app_role cascade;
drop type if exists public.order_status cascade;
drop type if exists public.coupon_type cascade;

-- 3. Supprimer les fonctions existantes
drop function if exists public.set_updated_at() cascade;
drop function if exists public.has_role(uuid, public.app_role) cascade;
drop function if exists public.preview_coupon(text, numeric) cascade;
drop function if exists public.place_order(jsonb, jsonb, uuid, text) cascade;
drop function if exists public.handle_order_status_change() cascade;
drop function if exists public.track_order(text, text) cascade;

-- ============================================
-- CRÉATION DES TYPES
-- ============================================

create type public.app_role as enum ('admin', 'customer');
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
create type public.coupon_type as enum ('percent', 'fixed');

-- ============================================
-- FONCTION set_updated_at
-- ============================================

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ============================================
-- TABLE profiles
-- ============================================

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

-- ============================================
-- TABLE user_roles
-- ============================================

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

-- ============================================
-- TABLE categories
-- ============================================

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

create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();

-- ============================================
-- TABLE colors
-- ============================================

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  hex text not null default '#000000',
  created_at timestamptz not null default now()
);

-- ============================================
-- TABLE sizes
-- ============================================

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- TABLE products
-- ============================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name_ar text not null,
  name_fr text not null,
  description_ar text,
  description_fr text,
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
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

-- ============================================
-- TABLE product_images
-- ============================================

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id);

-- ============================================
-- TABLE product_variants
-- ============================================

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
create trigger variants_updated before update on public.product_variants for each row execute function public.set_updated_at();

-- ============================================
-- TABLE delivery_zones
-- ============================================

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  fee numeric(10,2) not null default 0,
  eta_ar text not null default '',
  eta_fr text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger zones_updated before update on public.delivery_zones for each row execute function public.set_updated_at();

-- ============================================
-- TABLE coupons
-- ============================================

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

create trigger coupons_updated before update on public.coupons for each row execute function public.set_updated_at();

-- ============================================
-- TABLE orders
-- ============================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending',
  full_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  region text,
  postal_code text,
  notes text,
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
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

-- ============================================
-- TABLE order_items
-- ============================================

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name_ar text not null,
  name_fr text not null,
  color_ar text,
  color_fr text,
  size_label text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);

-- ============================================
-- TABLE favorites
-- ============================================

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ============================================
-- TABLE reviews
-- ============================================

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
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();

-- ============================================
-- TABLE settings
-- ============================================

create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================
-- TABLE contact_messages
-- ============================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- TABLE newsletter
-- ============================================

create table public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================
-- GRANTS
-- ============================================

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

-- ============================================
-- RLS
-- ============================================

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

-- ============================================
-- POLICIES
-- ============================================

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

-- ============================================
-- FONCTION preview_coupon
-- ============================================

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

-- ============================================
-- FONCTION place_order (CORRIGÉE)
-- ============================================

create or replace function public.place_order(
  _items jsonb, 
  _customer jsonb, 
  _zone_id uuid, 
  _coupon text
)
returns jsonb 
language plpgsql
security definer
set search_path = public 
as $$
declare
  item_record record;
  variant_record record;
  zone_record record;
  coupon_record public.coupons%rowtype;
  subtotal numeric := 0; 
  discount numeric := 0; 
  fee numeric := 0;
  order_id uuid;
  order_number text; 
  quantity int;
  user_id uuid;
  variant_id uuid;
  image_url text;
  color_name_ar text;
  color_name_fr text;
  size_label text;
  result jsonb;
begin
  user_id := auth.uid();
  
  if user_id is null then
    raise exception 'USER_NOT_AUTHENTICATED';
  end if;

  if _items is null or jsonb_array_length(_items) = 0 then 
    raise exception 'CART_EMPTY';
  end if;
  
  select * into zone_record from public.delivery_zones where id = _zone_id and active = true;
  if not found then 
    raise exception 'INVALID_ZONE';
  end if;
  fee := zone_record.fee;

  order_number := 'MA-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders (
    order_number, user_id, full_name, phone, email, address, city, region, postal_code, notes,
    delivery_zone_id, subtotal, discount, delivery_fee, total, coupon_code, status
  )
  values (
    order_number, user_id,
    coalesce(_customer->>'full_name', ''), 
    coalesce(_customer->>'phone', ''), 
    nullif(_customer->>'email', ''),
    coalesce(_customer->>'address', ''), 
    zone_record.name_fr, 
    nullif(_customer->>'region', ''), 
    nullif(_customer->>'postal_code', ''),
    nullif(_customer->>'notes', ''), 
    zone_record.id, 0, 0, fee, 0, 
    nullif(upper(_coupon), ''),
    'pending'
  )
  returning id into order_id;

  for item_record in select * from jsonb_array_elements(_items) loop
    quantity := coalesce((item_record.value->>'quantity')::int, 1);
    if quantity < 1 then
      quantity := 1;
    end if;
    
    variant_id := (item_record.value->>'variant_id')::uuid;
    
    select 
      pv.id as v_id,
      pv.product_id as p_id,
      pv.color_id,
      pv.size_id,
      pv.stock as v_stock,
      p.id as prod_id,
      p.name_ar,
      p.name_fr,
      p.price,
      p.active
    into variant_record
    from public.product_variants pv
    inner join public.products p on p.id = pv.product_id
    where pv.id = variant_id
    for update;
    
    if not found then 
      raise exception 'PRODUCT_NOT_FOUND: %', variant_id; 
    end if;
    
    if not variant_record.active then 
      raise exception 'PRODUCT_NOT_ACTIVE: %', variant_record.name_fr; 
    end if;
    
    if variant_record.v_stock < quantity then 
      raise exception 'OUT_OF_STOCK:%', variant_record.name_fr; 
    end if;

    color_name_ar := '';
    color_name_fr := '';
    if variant_record.color_id is not null then
      select coalesce(name_ar, ''), coalesce(name_fr, '') 
      into color_name_ar, color_name_fr
      from public.colors where id = variant_record.color_id;
    end if;

    size_label := '';
    if variant_record.size_id is not null then
      select coalesce(label, '') 
      into size_label
      from public.sizes where id = variant_record.size_id;
    end if;

    image_url := null;
    select url into image_url 
    from public.product_images 
    where product_id = variant_record.prod_id 
    order by position 
    limit 1;

    update public.product_variants 
    set stock = stock - quantity 
    where id = variant_record.v_id;
    
    update public.products 
    set sales_count = sales_count + quantity 
    where id = variant_record.prod_id;
    
    subtotal := subtotal + (variant_record.price * quantity);

    insert into public.order_items (
      order_id, product_id, variant_id, name_ar, name_fr, 
      color_ar, color_fr, size_label, image_url, unit_price, quantity
    )
    values (
      order_id, variant_record.prod_id, variant_record.v_id, 
      variant_record.name_ar, variant_record.name_fr, 
      color_name_ar, color_name_fr, size_label,
      image_url, 
      variant_record.price, quantity
    );
  end loop;

  if nullif(_coupon, '') is not null then
    select * into coupon_record from public.coupons 
    where upper(code) = upper(_coupon) and active = true;
    
    if found then
      if (coupon_record.expires_at is null or coupon_record.expires_at > now()) and
         (coupon_record.usage_limit is null or coupon_record.used_count < coupon_record.usage_limit) and
         subtotal >= coupon_record.min_order then
        
        if coupon_record.type = 'percent' then
          discount := round(subtotal * coupon_record.value / 100, 2);
        else
          discount := coupon_record.value;
        end if;
        
        if discount > subtotal then 
          discount := subtotal; 
        end if;
        
        update public.coupons 
        set used_count = used_count + 1 
        where id = coupon_record.id;
      end if;
    end if;
  end if;

  update public.orders 
  set 
    subtotal = subtotal,
    discount = discount,
    total = subtotal - discount + fee
  where id = order_id;

  result := jsonb_build_object(
    'id', order_id,
    'order_number', order_number,
    'subtotal', subtotal,
    'discount', discount,
    'delivery_fee', fee,
    'total', subtotal - discount + fee
  );
  
  return result;
exception
  when others then
    return jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
end; $$;

grant execute on function public.place_order(jsonb, jsonb, uuid, text) to anon, authenticated;

-- ============================================
-- FONCTION handle_order_status_change
-- ============================================

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

-- ============================================
-- FONCTION track_order
-- ============================================

create or replace function public.track_order(_order_number text, _phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('order', to_jsonb(o) - 'admin_notes',
    'items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where upper(o.order_number) = upper(_order_number) and o.phone = _phone
  limit 1;
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;

-- ============================================
-- POLICIES MANQUANTES POUR ORDERS
-- ============================================

create policy "users can insert own orders" on public.orders 
  for insert to authenticated 
  with check (auth.uid() = user_id);

create policy "users can insert own order items" on public.order_items 
  for insert to authenticated 
  with check (
    exists (
      select 1 from public.orders 
      where id = order_id and user_id = auth.uid()
    )
  );

-- ============================================
-- DONNÉES DE TEST
-- ============================================

insert into public.settings (key, value) values
('store', jsonb_build_object(
  'name_ar','دار الأناقة','name_fr','Dar Elegance','logo_url','',
  'phone','+212 6 61 00 00 00','email','contact@darelegance.ma','whatsapp','212661000000',
  'instagram','https://instagram.com','facebook','https://facebook.com','currency','MAD',
  'free_shipping_from', 800,
  'return_policy_ar','يمكنك إرجاع المنتج خلال 7 أيام من الاستلام بشرط أن يكون في حالته الأصلية.',
  'return_policy_fr','Vous pouvez retourner un article sous 7 jours après réception, dans son état d''origine.',
  'privacy_ar','نحن نحترم خصوصيتك ولا نشارك بياناتك مع أي طرف ثالث.',
  'privacy_fr','Nous respectons votre vie privée et ne partageons jamais vos données.',
  'terms_ar','باستخدامك للموقع فإنك توافق على شروط البيع والتوصيل المعتمدة.',
  'terms_fr','En utilisant ce site, vous acceptez nos conditions de vente et de livraison.'
));

insert into public.delivery_zones (name_ar, name_fr, fee, eta_ar, eta_fr) values
('الدار البيضاء','Casablanca',25,'24 ساعة','24 h'),
('الرباط','Rabat',30,'24-48 ساعة','24-48 h'),
('مراكش','Marrakech',35,'48 ساعة','48 h'),
('فاس','Fès',35,'48 ساعة','48 h'),
('طنجة','Tanger',35,'48 ساعة','48 h'),
('أكادير','Agadir',40,'48-72 ساعة','48-72 h'),
('مكناس','Meknès',35,'48 ساعة','48 h'),
('وجدة','Oujda',45,'72 ساعة','72 h'),
('القنيطرة','Kénitra',30,'24-48 ساعة','24-48 h'),
('تطوان','Tétouan',40,'48-72 ساعة','48-72 h'),
('آسفي','Safi',35,'48-72 ساعة','48-72 h'),
('الجديدة','El Jadida',30,'48 ساعة','48 h'),
('بني ملال','Béni Mellal',40,'48-72 ساعة','48-72 h'),
('الناظور','Nador',45,'72 ساعة','72 h'),
('ورزازات','Ouarzazate',50,'72 ساعة','72 h'),
('زاكورة','Zagora',55,'72-96 ساعة','72-96 h');

insert into public.categories (slug, name_ar, name_fr, position, image_url) values
('femme','نساء','Femme',1,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'),
('homme','رجال','Homme',2,'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80'),
('enfant','أطفال','Enfant',3,'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=80'),
('t-shirts','تيشيرتات','T-Shirts',4,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
('chemises','قمصان','Chemises',5,'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80'),
('pantalons','سراويل','Pantalons',6,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80'),
('jeans','جينز','Jeans',7,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80'),
('robes','فساتين','Robes',8,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'),
('vestes','جاكيتات','Vestes',9,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80'),
('hoodies','سويتشرتات','Hoodies',10,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'),
('chaussures','أحذية','Chaussures',11,'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80'),
('accessoires','إكسسوارات','Accessoires',12,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80');

insert into public.colors (name_ar, name_fr, hex) values
('أسود','Noir','#111111'),
('أبيض','Blanc','#f7f7f5'),
('بيج','Beige','#d9c7ad'),
('أزرق','Bleu','#2f4a7a'),
('أخضر زيتوني','Kaki','#6b6f4a'),
('بني','Marron','#5b3a2a'),
('أحمر','Rouge','#8c2f2f'),
('رمادي','Gris','#8a8a8a');

insert into public.sizes (label, position) values 
('XS',1),('S',2),('M',3),('L',4),('XL',5),('XXL',6),
('38',7),('39',8),('40',9),('41',10),('42',11),('43',12),
('Unique',13);

insert into public.coupons (code, type, value, min_order, usage_limit, expires_at) values
('BIENVENUE10','percent',10,300,500, now() + interval '180 days'),
('MAROC50','fixed',50,500,300, now() + interval '120 days'),
('RAMADAN15','percent',15,700,200, now() + interval '90 days');

-- Products
with c as (select slug, id from public.categories)
insert into public.products (slug, sku, name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, featured, is_new, best_seller, sales_count)
select p.slug, p.sku, p.name_ar, p.name_fr, p.desc_ar, p.desc_fr, p.price, p.old_price, c.id, p.featured, p.is_new, p.best, p.sales
from (values
('chemise-lin-atlas','SHIRT-001','قميص كتان أطلس','Chemise en lin Atlas','قميص من الكتان الطبيعي بقصة مريحة، مثالي لأيام الصيف المغربية الحارة.','Chemise en lin naturel à coupe décontractée, idéale pour les journées chaudes.',399,499,'chemises',true,true,true,42),
('chemise-oxford-classique','SHIRT-002','قميص أوكسفورد كلاسيكي','Chemise Oxford classique','قميص أوكسفورد قطني بخامة متينة يناسب العمل والمناسبات.','Chemise Oxford en coton épais, parfaite pour le bureau et les sorties.',349,null,'chemises',false,false,true,31),
('tshirt-coton-medina','TSHIRT-001','تيشيرت قطن المدينة','T-shirt coton Médina','تيشيرت قطن مشط 100% بغرزة كثيفة ولون ثابت بعد الغسل.','T-shirt 100% coton peigné, maille dense et couleur durable au lavage.',149,199,'t-shirts',true,true,true,120),
('tshirt-oversize-sahara','TSHIRT-002','تيشيرت أوفرسايز صحراء','T-shirt oversize Sahara','قصة واسعة عصرية بأكتاف منسدلة وخامة ثقيلة 220 غرام.','Coupe oversize moderne, épaules tombantes, jersey lourd 220 g.',189,null,'t-shirts',false,true,false,58),
('polo-pique-rabat','TSHIRT-003','بولو بيكيه الرباط','Polo piqué Rabat','بولو بنسيج بيكيه أنيق مع ياقة مقواة تحافظ على شكلها.','Polo en maille piquée avec col renforcé qui garde sa forme.',229,279,'t-shirts',false,false,true,73),
('jean-slim-casablanca','JEAN-001','جينز سليم كازابلانكا','Jean slim Casablanca','جينز مطاطي بقصة سليم مريحة ولون أزرق داكن ثابت.','Jean stretch coupe slim confortable, bleu foncé indigo.',449,559,'jeans',true,false,true,64),
('jean-droit-brut','JEAN-002','جينز مستقيم خام','Jean droit brut','دنيم خام 13 أونصة بقصة مستقيمة كلاسيكية.','Denim brut 13 oz, coupe droite intemporelle.',499,null,'jeans',false,true,false,22),
('chino-beige-fes','PANT-001','سروال شينو بيج فاس','Chino beige Fès','شينو قطني بقصة مستقيمة يناسب الإطلالات اليومية والرسمية.','Chino en coton coupe droite, du quotidien au semi-habillé.',329,399,'pantalons',false,false,true,47),
('pantalon-cargo-atlas','PANT-002','سروال كارغو أطلس','Pantalon cargo Atlas','كارغو بجيوب جانبية عملية وخامة مقاومة للاستعمال اليومي.','Cargo avec poches latérales pratiques et tissu résistant.',379,null,'pantalons',false,true,false,19),
('robe-longue-zellige','ROBE-001','فستان طويل زليج','Robe longue Zellige','فستان طويل بنقشة مستوحاة من الزليج المغربي وقصة انسيابية.','Robe longue à motif inspiré du zellige marocain, coupe fluide.',649,799,'robes',true,true,true,55),
('robe-satin-soiree','ROBE-002','فستان ساتان للسهرة','Robe satin soirée','فستان ساتان راقٍ بلمعة خفيفة مناسب للحفلات والمناسبات.','Robe en satin au tombé élégant, idéale pour les soirées.',789,null,'robes',false,false,false,26),
('robe-midi-lin','ROBE-003','فستان ميدي كتان','Robe midi en lin','فستان ميدي من الكتان بحزام خصر، خفيف ومريح.','Robe midi en lin avec ceinture, légère et respirante.',549,629,'robes',false,true,false,33),
('blazer-femme-rabat','VEST-001','بليزر نسائي الرباط','Blazer femme Rabat','بليزر بقصة مهيكلة وبطانة ناعمة يمنح إطلالة أنيقة فوراً.','Blazer structuré avec doublure douce pour une allure soignée.',899,1099,'vestes',true,false,true,29),
('veste-jean-tanger','VEST-002','جاكيت جينز طنجة','Veste en jean Tanger','جاكيت دنيم كلاسيكي بأزرار معدنية وجيوب أمامية.','Veste en denim classique, boutons métal et poches poitrine.',599,null,'vestes',false,true,false,24),
('veste-bombers-nuit','VEST-003','جاكيت بومبر ليلي','Bomber Nuit','بومبر خفيف بسحاب معدني وأساور مضلعة.','Bomber léger, zip métal et bords côtelés.',659,749,'vestes',false,false,false,17),
('hoodie-essentiel-noir','HOOD-001','سويتشرت أساسي أسود','Hoodie Essentiel','سويتشرت بقلنسوة من قطن مبطن دافئ وناعم من الداخل.','Hoodie en molleton gratté, chaud et doux à l''intérieur.',399,469,'hoodies',true,true,true,88),
('sweat-capuche-atlas','HOOD-002','سويتشرت أطلس','Sweat à capuche Atlas','سويتشرت بطبعة جبال الأطلس وخيوط قطنية سميكة.','Sweat imprimé montagnes de l''Atlas, coton épais.',429,null,'hoodies',false,true,false,35),
('sneakers-blanc-medina','SHOE-001','سنيكرز أبيض المدينة','Sneakers blanches Médina','سنيكرز جلدية بيضاء بنعل مريح مناسب للمشي الطويل.','Sneakers en cuir blanc, semelle confort pour la marche.',699,849,'chaussures',true,false,true,61),
('mocassins-cuir-fes','SHOE-002','موكاسان جلد فاس','Mocassins cuir Fès','موكاسان من الجلد الطبيعي المغربي بخياطة يدوية.','Mocassins en cuir marocain véritable, couture main.',899,null,'chaussures',false,true,false,14),
('ceinture-cuir-artisan','ACC-001','حزام جلد حرفي','Ceinture cuir artisan','حزام من الجلد الطبيعي بإبزيم معدني مصقول، صناعة محلية.','Ceinture en cuir véritable, boucle métal brossée, fabrication locale.',199,249,'accessoires',false,false,true,52),
('sac-cabas-toile','ACC-002','حقيبة قماش كابا','Sac cabas en toile','حقيبة قماش متينة بحجم عملي للاستعمال اليومي.','Sac cabas en toile résistante, format quotidien.',249,null,'accessoires',false,true,false,20),
('tshirt-enfant-oasis','KID-001','تيشيرت أطفال واحة','T-shirt enfant Oasis','تيشيرت أطفال قطني ناعم بألوان مبهجة وغرزة مقاومة.','T-shirt enfant en coton doux, couleurs gaies et maille solide.',119,149,'enfant',false,true,false,40)
) as p(slug, sku, name_ar, name_fr, desc_ar, desc_fr, price, old_price, cat, featured, is_new, best, sales)
join c on c.slug = p.cat;

-- Images
with pool as (
  select row_number() over () - 1 as i, url from (values
   ('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80')
  ) as t(url)
), p as (select id, row_number() over (order by created_at, slug) - 1 as n from public.products)
insert into public.product_images (product_id, url, position)
select p.id, pool.url, k
from p
cross join lateral (select k from generate_series(0,1) as k) g
join pool on pool.i = ((p.n + g.k * 5) % 12);

-- Variants
insert into public.product_variants (product_id, color_id, size_id, stock)
select p.id, col.id, s.id, 4 + ((abs(hashtext(p.id::text || col.id::text || s.id::text)) % 18))
from public.products p
join lateral (
  select id from public.colors order by md5(p.id::text || id::text) limit 3
) col on true
join public.sizes s on s.label = any (
  case
    when p.slug like 'sneakers%' or p.slug like 'mocassins%' then array['39','40','41','42','43']
    when p.slug like 'ceinture%' or p.slug like 'sac-%' then array['Unique']
    else array['S','M','L','XL']
  end
);

-- ============================================
-- TEST - Récupérer un ID de variant pour tester
-- ============================================

-- Sélectionner un ID de variant pour tester
select id from public.product_variants limit 1;

-- ============================================
-- FIN
-- ============================================