# per.pung Store Manager

เว็บแอปส่วนตัวสำหรับร้านครอฟเฟิลขนาดเล็ก ใช้บันทึกรายรับ รายจ่าย ราคาวัตถุดิบ และคำนวณต้นทุนเมนูแบบง่าย ๆ โทน UI จะน่ารัก อบอุ่น และ mobile-first สำหรับใช้งานหน้าร้านจริง

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase Database + Authentication
- React Router
- Recharts
- Lucide React
- Deploy แบบ static frontend บน GitHub Pages

## ฟีเจอร์

- Login ด้วย Supabase Auth และ Protected Route
- Dashboard สรุปรายรับ รายจ่าย กำไร จำนวนชิ้นที่ขาย กราฟย้อนหลัง 7 วัน เมนูขายดี และรายการล่าสุด
- หน้ารายรับ เพิ่ม/แก้ไข/ลบยอดขาย กรองตามวันที่ และคำนวณรายรับ ต้นทุน กำไรอัตโนมัติ
- หน้ารายจ่าย เพิ่ม/แก้ไข/ลบ กรองตามวัน/เดือน และหมวดหมู่
- หน้าวัตถุดิบ เพิ่ม/แก้ไข/ลบ และคำนวณต้นทุนต่อหน่วย
- หน้าต้นทุนเมนู สร้างสูตรจากวัตถุดิบหลายรายการ คำนวณต้นทุน กำไรต่อชิ้น และ margin
- หน้าตั้งค่า สำหรับข้อมูลร้าน เป้าหมายยอดขาย เปลี่ยนรหัสผ่าน สำรองข้อมูล และออกจากระบบ
- RLS ทุกตาราง โดยทุก record ผูกกับ `auth.uid()` ผ่าน `user_id`
- Toast, loading state, empty state, confirm dialog และ responsive layout

## ติดตั้ง

```bash
npm install
```

แนะนำ Node.js 22+ สำหรับการใช้งานระยะยาวกับ Supabase libraries รุ่นใหม่ ๆ แต่โปรเจกต์นี้ตั้ง dependency ให้รันกับ Node 20 ในเครื่องปัจจุบันได้

## สร้าง Supabase Project

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. Create project ใหม่
3. ไปที่ `Authentication > Users`
4. เพิ่ม user สำหรับใช้งานส่วนตัวของร้าน
5. ไปที่ `Project Settings > API` แล้วคัดลอก Project URL และ anon/publishable key

## สร้าง Database Schema

1. เปิด `SQL Editor` ใน Supabase
2. วาง SQL จากไฟล์ `supabase/schema.sql`
3. กด Run

ไฟล์นี้จะสร้างตาราง `products`, `ingredients`, `product_ingredients`, `income_transactions`, `expense_transactions`, indexes, triggers, grants และ RLS policies ให้ครบ

ถ้าต้องการข้อมูลทดลอง ให้แก้ `app_user` ใน `supabase/sample-data.sql` เป็น user id จาก Supabase Auth ก่อน แล้วค่อย Run

## ตั้งค่า Environment Variables

คัดลอกไฟล์ตัวอย่าง:

```bash
cp .env.example .env
```

ใส่ค่าจริง:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

ห้ามใช้ `service_role` key ใน frontend

## รัน Local

```bash
npm run dev
```

เปิด URL ที่ Vite แสดง เช่น `http://localhost:5173`

## Build

```bash
npm run build
```

ตรวจ preview หลัง build:

```bash
npm run preview
```

## Deploy GitHub Pages

โปรเจกต์มี workflow ที่ `.github/workflows/deploy.yml`

1. Push โปรเจกต์ขึ้น GitHub
2. ไปที่ `Settings > Pages`
3. ตั้ง Source เป็น `GitHub Actions`
4. ไปที่ `Settings > Secrets and variables > Actions`
5. เพิ่ม repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Push เข้า branch `main` เพื่อ deploy

Vite จะตั้ง `base` จากชื่อ repo อัตโนมัติผ่าน `GITHUB_REPOSITORY` และแอปใช้ `HashRouter` เพื่อให้ refresh/deep link ทำงานบน GitHub Pages

## โครงสร้างไฟล์สำคัญ

```text
src/
  components/
    layout/
    ui/
  hooks/
  lib/
  pages/
  routes/
  types/
supabase/
  schema.sql
  sample-data.sql
```

## หมายเหตุเรื่อง Supabase Data API

Schema เปิด RLS และ grant สิทธิ์ให้ role `authenticated` แล้ว หากโปรเจกต์ Supabase ของคุณตั้งค่า Data API แบบปิดรายตาราง ให้ไปที่ Dashboard แล้วเปิด table exposure สำหรับตารางที่แอปใช้ด้วย
