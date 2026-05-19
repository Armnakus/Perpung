-- per.pung Store Manager
-- Run this file in Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  selling_price numeric not null default 0 check (selling_price >= 0),
  product_cost numeric not null default 0 check (product_cost >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  purchase_price numeric not null check (purchase_price >= 0),
  purchase_quantity numeric not null check (purchase_quantity > 0),
  unit text not null,
  cost_per_unit numeric not null check (cost_per_unit >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity_used numeric not null check (quantity_used > 0),
  ingredient_cost numeric not null check (ingredient_cost >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, ingredient_id)
);

create table if not exists public.income_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_date date not null,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_per_item numeric not null check (price_per_item >= 0),
  total_income numeric not null check (total_income >= 0),
  estimated_cost numeric not null check (estimated_cost >= 0),
  estimated_profit numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_date date not null,
  category text not null check (category in ('วัตถุดิบ', 'บรรจุภัณฑ์', 'อุปกรณ์', 'ค่าขนส่ง', 'ค่าใช้จ่ายอื่น ๆ')),
  title text not null,
  amount numeric not null check (amount >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists ingredients_user_id_idx on public.ingredients(user_id);
create index if not exists product_ingredients_user_id_idx on public.product_ingredients(user_id);
create index if not exists product_ingredients_product_id_idx on public.product_ingredients(product_id);
create index if not exists product_ingredients_ingredient_id_idx on public.product_ingredients(ingredient_id);
create index if not exists income_transactions_user_id_sale_date_idx on public.income_transactions(user_id, sale_date);
create index if not exists income_transactions_product_id_idx on public.income_transactions(product_id);
create index if not exists expense_transactions_user_id_expense_date_idx on public.expense_transactions(user_id, expense_date);
create index if not exists expense_transactions_user_id_category_idx on public.expense_transactions(user_id, category);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_ingredient_cost_per_unit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.cost_per_unit = round((new.purchase_price / nullif(new.purchase_quantity, 0))::numeric, 4);
  return new;
end;
$$;

create or replace function public.set_product_ingredient_cost()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  unit_cost numeric;
begin
  select cost_per_unit
  into unit_cost
  from public.ingredients
  where id = new.ingredient_id
    and user_id = new.user_id;

  if unit_cost is null then
    raise exception 'Ingredient does not belong to the current user';
  end if;

  new.ingredient_cost = round((unit_cost * new.quantity_used)::numeric, 4);
  return new;
end;
$$;

create or replace function public.refresh_product_cost(target_product_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.products
  set
    product_cost = coalesce((
      select round(sum(ingredient_cost)::numeric, 4)
      from public.product_ingredients
      where product_id = target_product_id
    ), 0),
    updated_at = now()
  where id = target_product_id;
end;
$$;

create or replace function public.refresh_product_cost_from_recipe()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_product_cost(new.product_id);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_product_cost(old.product_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_recipe_costs_from_ingredient()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.product_ingredients
  set ingredient_cost = round((new.cost_per_unit * quantity_used)::numeric, 4)
  where ingredient_id = new.id
    and user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists ingredients_set_updated_at on public.ingredients;
create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

drop trigger if exists income_transactions_set_updated_at on public.income_transactions;
create trigger income_transactions_set_updated_at
before update on public.income_transactions
for each row execute function public.set_updated_at();

drop trigger if exists expense_transactions_set_updated_at on public.expense_transactions;
create trigger expense_transactions_set_updated_at
before update on public.expense_transactions
for each row execute function public.set_updated_at();

drop trigger if exists ingredients_set_cost_per_unit on public.ingredients;
create trigger ingredients_set_cost_per_unit
before insert or update of purchase_price, purchase_quantity on public.ingredients
for each row execute function public.set_ingredient_cost_per_unit();

drop trigger if exists product_ingredients_set_cost on public.product_ingredients;
create trigger product_ingredients_set_cost
before insert or update of ingredient_id, quantity_used on public.product_ingredients
for each row execute function public.set_product_ingredient_cost();

drop trigger if exists product_ingredients_refresh_product_cost on public.product_ingredients;
create trigger product_ingredients_refresh_product_cost
after insert or update or delete on public.product_ingredients
for each row execute function public.refresh_product_cost_from_recipe();

drop trigger if exists ingredients_refresh_recipe_costs on public.ingredients;
create trigger ingredients_refresh_recipe_costs
after update of purchase_price, purchase_quantity, cost_per_unit on public.ingredients
for each row execute function public.refresh_recipe_costs_from_ingredient();

alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.income_transactions enable row level security;
alter table public.expense_transactions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.ingredients to authenticated;
grant select, insert, update, delete on public.product_ingredients to authenticated;
grant select, insert, update, delete on public.income_transactions to authenticated;
grant select, insert, update, delete on public.expense_transactions to authenticated;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
on public.products for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ingredients_select_own" on public.ingredients;
create policy "ingredients_select_own"
on public.ingredients for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ingredients_insert_own" on public.ingredients;
create policy "ingredients_insert_own"
on public.ingredients for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ingredients_update_own" on public.ingredients;
create policy "ingredients_update_own"
on public.ingredients for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ingredients_delete_own" on public.ingredients;
create policy "ingredients_delete_own"
on public.ingredients for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "product_ingredients_select_own" on public.product_ingredients;
create policy "product_ingredients_select_own"
on public.product_ingredients for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "product_ingredients_insert_own" on public.product_ingredients;
create policy "product_ingredients_insert_own"
on public.product_ingredients for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.ingredients
    where ingredients.id = ingredient_id
      and ingredients.user_id = (select auth.uid())
  )
);

drop policy if exists "product_ingredients_update_own" on public.product_ingredients;
create policy "product_ingredients_update_own"
on public.product_ingredients for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.ingredients
    where ingredients.id = ingredient_id
      and ingredients.user_id = (select auth.uid())
  )
);

drop policy if exists "product_ingredients_delete_own" on public.product_ingredients;
create policy "product_ingredients_delete_own"
on public.product_ingredients for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "income_transactions_select_own" on public.income_transactions;
create policy "income_transactions_select_own"
on public.income_transactions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "income_transactions_insert_own" on public.income_transactions;
create policy "income_transactions_insert_own"
on public.income_transactions for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.user_id = (select auth.uid())
  )
);

drop policy if exists "income_transactions_update_own" on public.income_transactions;
create policy "income_transactions_update_own"
on public.income_transactions for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.user_id = (select auth.uid())
  )
);

drop policy if exists "income_transactions_delete_own" on public.income_transactions;
create policy "income_transactions_delete_own"
on public.income_transactions for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "expense_transactions_select_own" on public.expense_transactions;
create policy "expense_transactions_select_own"
on public.expense_transactions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "expense_transactions_insert_own" on public.expense_transactions;
create policy "expense_transactions_insert_own"
on public.expense_transactions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "expense_transactions_update_own" on public.expense_transactions;
create policy "expense_transactions_update_own"
on public.expense_transactions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "expense_transactions_delete_own" on public.expense_transactions;
create policy "expense_transactions_delete_own"
on public.expense_transactions for delete
to authenticated
using ((select auth.uid()) = user_id);
