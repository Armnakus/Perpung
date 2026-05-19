-- Optional starter data for per.pung Store Manager.
-- Replace the UUID below with your Supabase Auth user id, then run after schema.sql.

do $$
declare
  app_user uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  nutella_id uuid;
  banana_id uuid;
  dough_id uuid;
  product_id uuid;
begin
  insert into public.ingredients (user_id, name, purchase_price, purchase_quantity, unit, cost_per_unit, note)
  values (app_user, 'Nutella', 199, 680, 'g', 199 / 680.0, 'กระปุก 680g');

  insert into public.ingredients (user_id, name, purchase_price, purchase_quantity, unit, cost_per_unit, note)
  values (app_user, 'กล้วยหอม', 60, 10, 'ลูก', 60 / 10.0, 'เฉลี่ยต่อลูก');

  insert into public.ingredients (user_id, name, purchase_price, purchase_quantity, unit, cost_per_unit, note)
  values (app_user, 'แป้งครอฟเฟิล', 180, 12, 'ชิ้น', 180 / 12.0, 'แป้งสำเร็จรูป');

  select id into nutella_id from public.ingredients where user_id = app_user and name = 'Nutella' limit 1;
  select id into banana_id from public.ingredients where user_id = app_user and name = 'กล้วยหอม' limit 1;
  select id into dough_id from public.ingredients where user_id = app_user and name = 'แป้งครอฟเฟิล' limit 1;

  insert into public.products (user_id, name, selling_price, product_cost)
  values (app_user, 'Nutella Banana', 79, 0)
  returning id into product_id;

  insert into public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, ingredient_cost)
  values
    (app_user, product_id, dough_id, 1, 0),
    (app_user, product_id, nutella_id, 35, 0),
    (app_user, product_id, banana_id, 0.5, 0);

  insert into public.products (user_id, name, selling_price, product_cost)
  values (app_user, 'Brown Sugar Classic', 59, 0);
end $$;
