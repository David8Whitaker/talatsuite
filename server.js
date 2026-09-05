/* ============================================================
   TalatSuite v5.4 — API Server + Static Frontend
   Express + PostgreSQL · 4 บทบาท: แอดมิน / ผู้จัดการตลาด / ร้านค้า / ลูกค้า
   + ระบบสมาชิก (login) + สิทธิ์แยกตามตลาด/ร้าน + คอนโซลแอดมิน
   ============================================================ */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://talat@127.0.0.1:5433/talatsuite';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/* ---------------- constants / validation sets ---------------- */
const CATEGORIES = ['food', 'clothes', 'fresh', 'general'];
const ATTENDANCES = ['present', 'absent'];
const PAY_STATUSES = ['paid', 'unpaid'];
const PAY_METHODS = ['cash', 'promptpay'];
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const EVENT_TEXT = {
  pending: 'ร้านรับออร์ดอร์เข้าคิวแล้ว',
  preparing: 'กำลังเตรียมอาหาร',
  ready: 'อาหารพร้อมรับ/รอส่งแล้ว 🎉',
  completed: 'เสร็จสิ้น — ขอบคุณที่ใช้บริการ',
};

/* ---------------- schema ---------------- */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  hours_text TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🏪',
  open_days TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
  open_time TEXT NOT NULL DEFAULT '',
  close_time TEXT NOT NULL DEFAULT '',
  force_open BOOLEAN,
  open_today BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lots (
  code TEXT NOT NULL,
  market_id INT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  position INT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  rent_amount NUMERIC(10,2) NOT NULL DEFAULT 150,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (market_id, code)
);

CREATE TABLE IF NOT EXISTS lot_day (
  id SERIAL PRIMARY KEY,
  lot_code TEXT NOT NULL,
  market_id INT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  vendor_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('food','clothes','fresh','general')),
  attendance TEXT NOT NULL DEFAULT 'present'
    CHECK (attendance IN ('present','absent')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid','unpaid')),
  payment_method TEXT CHECK (payment_method IN ('cash','promptpay')),
  rent_amount NUMERIC(10,2) NOT NULL DEFAULT 150,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, lot_code, day),
  FOREIGN KEY (market_id, lot_code) REFERENCES lots(market_id, code) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lot_day_day ON lot_day(day);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  lot_code TEXT NOT NULL,
  market_id INT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  vendor_name TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('cash','promptpay')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, lot_code, day),
  FOREIGN KEY (market_id, lot_code) REFERENCES lots(market_id, code) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_day ON payments(day);

CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  market_id INT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  lot_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'food'
    CHECK (category IN ('food','clothes','fresh','general')),
  description TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  line_id TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🍽️',
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shops_market ON shops(market_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  image TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_shop ON menu_items(shop_id);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  customer_contact TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','completed')),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  unit_price NUMERIC(10,2) NOT NULL,
  qty INT NOT NULL CHECK (qty > 0)
);

CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','vendor','customer')),
  display_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  passcode_hash TEXT,
  market_id INT REFERENCES markets(id) ON DELETE SET NULL,
  shop_id INT REFERENCES shops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`;
/* คอลัมน์เพิ่มของตาราง orders (ปลอดภัยกับ DB เดิม) */
const SCHEMA_MIGRATE = `
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_user_id INT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_cuser ON orders(customer_user_id);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS announcement TEXT NOT NULL DEFAULT '';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS track_token TEXT NOT NULL DEFAULT '';

/* ── v6: ระบบสมัคร-อนุมัติ (ผจก.ยื่นตลาด / ร้านยื่นเข้าร่วม) ── */
ALTER TABLE markets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type TEXT NOT NULL DEFAULT 'night';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS applied_by INT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deny_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_user_id INT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS deny_reason TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('market','shop')),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id INT REFERENCES markets(id) ON DELETE SET NULL,
  shop_id INT,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  deny_reason TEXT NOT NULL DEFAULT '',
  decided_by INT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(user_id);
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id INT,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT '',
  market_id INT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  target TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_market ON audit_log(market_id);
`;

/* ---------------- date helpers (UTC-safe, no tz drift) ---------------- */
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
  }).format(new Date());
}
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function periodRange(dateStr, period) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (period === 'daily') return { from: dateStr, to: dateStr };
  if (period === 'weekly') {
    const dow = date.getUTCDay();
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - ((dow + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return { from: iso(monday), to: iso(sunday) };
  }
  return {
    from: iso(new Date(Date.UTC(y, m - 1, 1))),
    to: iso(new Date(Date.UTC(y, m, 0))),
  };
}

/* ---------------- seed data ---------------- */
const DEMO_VENDORS = [
  { code: 'A1', name: 'ข้าวมันไก่ป้าแดง', cat: 'food', pay: 'cash', today: 'paid' },
  { code: 'A2', name: 'ผักสดสวนคุณนิ่ม', cat: 'fresh', pay: 'promptpay', today: 'paid' },
  { code: 'A3', name: 'ชาไทยเจ๊แอ๊ด', cat: 'food', pay: 'cash', today: 'unpaid' },
  { code: 'A4', name: 'เสื้อยืด Thai Land', cat: 'clothes', pay: 'cash', today: 'unpaid' },
  { code: 'A5', name: 'พิซซ่าอิฐร้อน บี', cat: 'food', pay: 'cash', today: 'paid' },
  { code: 'A6', name: 'ผลไม้ริมทางเจ๊หนู', cat: 'fresh', pay: 'cash', today: 'unpaid', absent: true },
  { code: 'B1', name: 'ก๋วยเตี๋ยวเรือลุงหนู', cat: 'food', pay: 'promptpay', today: 'paid' },
  { code: 'B3', name: 'ร้านของชำจันทร์เพ็ญ', cat: 'general', pay: 'cash', today: 'paid' },
  { code: 'B5', name: 'ปลาเผาเจ๊ปิ่ง', cat: 'food', pay: 'cash', today: 'unpaid' },
];

async function seed() {
  const { rows: mkCount } = await pool.query('SELECT COUNT(*)::int AS n FROM markets');
  if (mkCount[0].n > 0) return; /* seed เฉพาะรอบแรก */

  /* ── SEED_DEMO=false → โหมด production สะอาด: ไม่มีข้อมูล/บัญชีตัวอย่าง ──
     สร้างเฉพาะบัญชีแอดมิน (รหัสจาก ADMIN_PASSWORD) เพื่อให้เจ้าของระบบ
     สร้างตลาด/ร้าน/ผู้ใช้ของตัวเองทั้งหมดผ่าน UI */
  if ((process.env.SEED_DEMO || 'true') === 'false') {
    const adminPw = process.env.ADMIN_PASSWORD || 'admin123';
    await pool.query(
      `INSERT INTO users (login, password_hash, role, display_name, phone, email)
       VALUES ('admin', $1, 'admin', 'เจ้าของระบบ', '', '')
       ON CONFLICT (login) DO NOTHING`,
      [hashPassword(adminPw)]
    );
    console.log('[seed] SEED_DEMO=false → โหมด production สะอาด: สร้างเฉพาะบัญชีแอดมิน');
    return;
  }

  /* ── ตลาด 1: เปิดวันนี้ ── */
  const { rows: mk1 } = await pool.query(
    `INSERT INTO markets (name, area, description, hours_text, emoji, open_days, open_time, close_time, open_today, sort_order, address, lat, lng, announcement, market_type)
     VALUES ('ตลาดนัดริมคลองบางบอน', 'กรุงเทพฯ · เขตบางบอน',
             'ตลาดสด + ตลาดนัดย้อนหลังริมคลอง มีทั้งของกิน ของใช้ และผักผลไม้สดจากสวน',
             'เปิดทุกวัน 16:00 – 23:00', '🏪', '0,1,2,3,4,5,6', '16:00', '23:00', TRUE, 1,
             '25 ซอยบางบอน 5 ถนนเอกชัย แขวงบางบอน เขตบางบอน กรุงเทพฯ 10150', 13.6990, 100.4036,
             'ตลาดปิดทำการวันที่ 1 พ.ค. เพื่อทำความสะอาดใหญ่ประจำปี', 'night')
     RETURNING id`
  );
  const M1 = mk1[0].id;

  /* ── ตลาด 2: ปิดวันนี้ (ไนท์มาร์เก็ต ศุ–อา) ── */
  const { rows: mk2 } = await pool.query(
    `INSERT INTO markets (name, area, description, hours_text, emoji, open_days, open_time, close_time, open_today, sort_order, address, lat, lng, market_type)
     VALUES ('ไนท์มาร์เก็ตสวนลุม', 'กรุงเทพฯ · ปทุมวัน',
             'ตลาดกลางคืนสไตล์สวนสาธารณะ อาหารร้านเด็ด คาเฟ่ และของฝาก',
             'เปิดศุกร์–อาทิตย์ 17:00 – 24:00', '🌙', '5,6,0', '17:00', '24:00', FALSE, 2,
             'สวนลุมพินี ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330', 13.7297, 100.5424, 'night')
     RETURNING id`
  );
  const M2 = mk2[0].id;

  /* ── ล็อค ── */
  const lotRows = [];
  for (let i = 1; i <= 10; i++) lotRows.push([`A${i}`, M1, 'A', i, 150]);
  for (let i = 1; i <= 10; i++) lotRows.push([`B${i}`, M1, 'B', i, 120]);
  for (let i = 1; i <= 8; i++) lotRows.push([`N${i}`, M2, 'N', i, 200]);
  for (const [code, mid, row, pos, rent] of lotRows) {
    await pool.query(
      `INSERT INTO lots (code, market_id, row_label, position, rent_amount) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (market_id, code) DO NOTHING`,
      [code, mid, row, pos, rent]
    );
  }

  /* ── ประวัติล็อค + การชำระ 14 วัน (ตลาด 1) ── */
  const today = todayStr();
  const [ty, tm, td] = today.split('-').map(Number);
  for (let off = 13; off >= 0; off--) {
    const d = new Date(Date.UTC(ty, tm - 1, td - off));
    const day = iso(d);
    const isToday = off === 0;
    for (const v of DEMO_VENDORS) {
      let paid;
      if (isToday) paid = v.today === 'paid';
      else
        paid =
          ['A1', 'A2', 'A5', 'B1', 'B3'].includes(v.code) ||
          (v.code === 'A4' && off % 3 === 0) ||
          (v.code === 'A3' && off % 2 === 0) ||
          (v.code === 'B5' && off % 2 === 1);
      const rent = v.code[0] === 'A' ? 150 : 120;
      await pool.query(
        `INSERT INTO lot_day (lot_code, market_id, day, vendor_name, category, attendance, payment_status, payment_method, rent_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (market_id, lot_code, day) DO NOTHING`,
        [v.code, M1, day, v.name, v.cat, v.absent ? 'absent' : 'present',
         paid ? 'paid' : 'unpaid', v.pay, rent]
      );
      if (paid) {
        await pool.query(
          `INSERT INTO payments (lot_code, market_id, day, vendor_name, amount, method)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (market_id, lot_code, day) DO UPDATE
             SET amount = EXCLUDED.amount, method = EXCLUDED.method,
                 vendor_name = EXCLUDED.vendor_name, updated_at = now()`,
          [v.code, M1, day, v.name, rent, v.pay]
        );
      } else {
        await pool.query('DELETE FROM payments WHERE market_id=$1 AND lot_code=$2 AND day=$3', [M1, v.code, day]);
      }
    }
  }

  /* ── ร้านค้า ── */
  const { rows: sh1 } = await pool.query(
    `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id, whatsapp, facebook, emoji, is_open)
     VALUES ($1,'A5','พิซซ่าอิฐร้อน บี','food','พิซซ่าอิฐเผา ชีสเยิ้ม โดว์หมัก 48 ชม. ของสดทำวันต่อวัน',
             '089-111-2223','satohot.pizza@gmail.com','@pizzabee','66891112223','pizzabee.th','🍕',TRUE)
     RETURNING id`, [M1]
  );
  const { rows: sh2 } = await pool.query(
    `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id, whatsapp, facebook, emoji, is_open)
     VALUES ($1,'A3','ชาไทยเจ๊แอ๊ด','food','ชาไทยเข้มข้นหอมใบเตย ชงสดทุกแก้ว รับออเดอร์ล่วงหน้าได้',
             '086-222-3344','cha.aed@gmail.com','@chaaid','66862223344','','🧋',TRUE)
     RETURNING id`, [M1]
  );
  const { rows: sh3 } = await pool.query(
    `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id, whatsapp, facebook, emoji, is_open)
     VALUES ($1,'N3','สเต็กเตาถ่านพี่บอส','food','สเต็กเนื้อชิ้นหนา ย่างเตาถ่าน ซอสสูตรลับของพี่บอส',
             '092-333-4455','','@bosssteak','','','🥩',TRUE) RETURNING id`, [M2]
  );

  /* ── เมนู ── */
  const menuDefs = [
    [sh1[0].id, 'พิซซ่าฮาวายเอี้ยน', 159, '🍍', 1],
    [sh1[0].id, 'พิซซ่าซีฟู้ดต้มยำ', 199, '🦐', 2],
    [sh1[0].id, 'มันฝรั่งทอดกรอบ', 79, '🍟', 3],
    [sh1[0].id, 'พิซซ่ามาการีตา', 139, '🍕', 4],
    [sh2[0].id, 'ชาไทยเข้มข้น', 25, '🧋', 1],
    [sh2[0].id, 'ชาเขียวนมสด', 30, '🍵', 2],
    [sh2[0].id, 'กาแฟโบราณ', 30, '☕', 3],
    [sh2[0].id, 'นมสดคั้นสด', 20, '🥛', 4],
  ];
  const menuIds = {};
  for (const [shopId, name, price, emoji, sort] of menuDefs) {
    const { rows } = await pool.query(
      `INSERT INTO menu_items (shop_id, name, price, emoji, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, name`,
      [shopId, name, price, emoji, sort]
    );
    menuIds[name] = rows[0].id;
  }
  await pool.query(
    `INSERT INTO menu_items (shop_id, name, price, emoji, sort_order, stock) VALUES
      ((SELECT id FROM shops WHERE name='สเต็กเตาถ่านพี่บอส'),'สเต็กเนื้อออสเตรเลีย',259,'🥩',1,NULL),
      ((SELECT id FROM shops WHERE name='สเต็กเตาถ่านพี่บอส'),'ข้าวหน้าเนื้อสไลซ์',179,'🍚',2,12)`
  );
  await pool.query(`UPDATE menu_items SET stock=8 WHERE name='พิซซ่าฮาวายเอี้ยน'`);
  await pool.query(`UPDATE menu_items SET stock=0, available=FALSE WHERE name='มันฝรั่งทอดกรอบ'`);

  /* ── ออเดอร์ตัวอย่าง + ไทม์ไลน์ ── */
  const t0 = Date.now();
  const demoOrders = [
    { shop: sh1[0].id, customer: 'คุณอารยา', note: '', status: 'pending', mins: 14,
      items: [['พิซซ่าฮาวายเอี้ยน', 1]] },
    { shop: sh1[0].id, customer: 'โต๊ะ 7 หมูกระทะ', note: 'พิเศษพริกไทยดำ', status: 'preparing', mins: 9,
      items: [['พิซซ่าซีฟู้ดต้มยำ', 2]] },
    { shop: sh1[0].id, customer: 'น้องแพร', note: 'ห่อกลับบ้าน', status: 'ready', mins: 4,
      items: [['พิซซ่าฮาวายเอี้ยน', 1], ['มันฝรั่งทอดกรอบ', 1]] },
    { shop: sh1[0].id, customer: 'คุณวิทยา', note: '', status: 'completed', mins: 42,
      items: [['พิซซ่าซีฟู้ดต้มยำ', 1]] },
    { shop: sh2[0].id, customer: 'น้องมะลิ', note: 'หวานน้อย', status: 'pending', mins: 3,
      items: [['ชาไทยเข้มข้น', 1], ['ชาเขียวนมสด', 1]] },
    { shop: sh1[0].id, customer: 'พี่โอ๊ต (แขก)', note: 'แยกถุงซอส', status: 'ready', mins: 2, guest: true, phone: '0831234567',
      items: [['พิซซ่ามาการีตา', 1]] },
  ];
  for (const o of demoOrders) {
    const when = new Date(t0 - o.mins * 60000).toISOString();
    const items = o.items.map(([name, qty]) => {
      const mid = menuIds[name];
      return { mid, name, qty };
    });
    const { rows: menuRows } = await pool.query(
      'SELECT id, name, price, emoji FROM menu_items WHERE id = ANY($1::int[])',
      [items.map((i) => i.mid)]
    );
    const total = items.reduce((s, it) => {
      const m = menuRows.find((r) => r.id === it.mid);
      return s + Number(m.price) * it.qty;
    }, 0);
    const { rows: created } = await pool.query(
      `INSERT INTO orders (shop_id, customer_name, customer_contact, customer_id, is_guest, track_token, note, status, total, created_at, updated_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11) RETURNING id`,
      [o.shop, o.customer, o.phone || '', o.guest ? `g:${o.phone}` : '', !!o.guest,
       o.guest ? 'demo0001' : '', o.note, o.status, total, when,
       o.status === 'completed' ? new Date(t0 - (o.mins - 3) * 60000).toISOString() : null]
    );
    const oid = created[0].id;
    for (const it of items) {
      const m = menuRows.find((r) => r.id === it.mid);
      await pool.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, emoji, unit_price, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [oid, m.id, m.name, m.emoji, m.price, it.qty]
      );
    }
    /* ไทม์ไลน์ตามสถานะ */
    const flow = ['pending', 'preparing', 'ready', 'completed'].slice(
      0,
      ['pending', 'preparing', 'ready', 'completed'].indexOf(o.status) + 1
    );
    let k = 0;
    for (const st of flow) {
      await pool.query(
        `INSERT INTO order_events (order_id, status, text, created_at) VALUES ($1,$2,$3,$4)`,
        [oid, st, EVENT_TEXT[st], new Date(t0 - (o.mins - k * 2) * 60000).toISOString()]
      );
      k++;
    }
  }
  console.log('[seed] สร้างข้อมูลตัวอย่าง: 2 ตลาด · 3 ร้าน · เมนู 9 รายการ · ออเดอร์ 6 ใบ');

  /* ── บัญชีผู้ใช้ตัวอย่าง ── */
  const seedUsers = [
    { login: 'admin', pw: 'admin123', role: 'admin', display_name: 'เจ้าของระบบ', phone: '', email: '' },
    { login: 'somchai', pw: 'market123', role: 'manager', display_name: 'สมชาย ใจดี', market: M1 },
    { login: 'prakai', pw: 'market123', role: 'manager', display_name: 'ปรักษ์ วงศ์สว่าง', market: M2 },
    { login: 'pizzabee', pw: 'vendor123', role: 'vendor', display_name: 'บี · พิซซ่าอิฐร้อน', shop: sh1[0].id },
    { login: 'chaed', pw: 'vendor123', role: 'vendor', display_name: 'เจ๊แอ๊ด · ชาไทย', shop: sh2[0].id },
    { login: 'boss', pw: 'vendor123', role: 'vendor', display_name: 'พี่บอส · สเต็กเตาถ่าน', shop: sh3[0].id },
    { login: '0890000001', pw: 'cust123', role: 'customer', display_name: 'คุณอารยา', phone: '089-000-0001' },
    { login: '0860000002', pw: 'cust123', role: 'customer', display_name: 'น้องมะลิ', phone: '086-000-0002' },
    { login: 'malee', pw: 'market123', role: 'manager', display_name: 'มะลิ ศรีสุข' },
    { login: 'paedaeng', pw: 'vendor123', role: 'vendor', display_name: 'ป้าแดง · ขนมไทย' },
    { login: 'warmcoffee', pw: 'vendor123', role: 'vendor', display_name: 'อุ่นใจ · กาแฟ' },
  ];
  /* วันสมัครย้อนหลัง (วัน) — ให้ "สมาชิกตั้งแต่..." สมจริง */
  const joinedDaysAgo = { admin: 220, somchai: 180, prakai: 150, pizzabee: 120, chaed: 96, boss: 70, '0890000001': 45, '0860000002': 12, malee: 6, paedaeng: 3, warmcoffee: 15 };
  const userIds = {};
  for (const su of seedUsers) {
    const joined = new Date(Date.now() - (joinedDaysAgo[su.login] || 30) * 86400000).toISOString();
    const { rows } = await pool.query(
      `INSERT INTO users (login, password_hash, role, display_name, phone, email, market_id, shop_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (login) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id, login`,
      [su.login, hashPassword(su.pw), su.role, su.display_name, su.phone || '', su.email || '',
       su.market || null, su.shop || null, joined]
    );
    userIds[su.login] = rows[0].id;
  }
  /* ผูกออเดอร์ตัวอย่างกับบัญชีลูกค้า */
  await pool.query(`UPDATE orders SET customer_user_id=$1, customer_id=$2 WHERE customer_name='คุณอารยา'`, [userIds['0890000001'], `u:${userIds['0890000001']}`]);
  await pool.query(`UPDATE orders SET customer_user_id=$1, customer_id=$2 WHERE customer_name='น้องมะลิ'`, [userIds['0860000002'], `u:${userIds['0860000002']}`]);

  /* ── v6: เจ้าของร้านตัวอย่าง + ใบสมัครรอพิจารณา/ถูกปฏิเสธ ── */
  await pool.query('UPDATE shops SET owner_user_id=$1 WHERE id=$2', [userIds['pizzabee'], sh1[0].id]);
  await pool.query('UPDATE shops SET owner_user_id=$1 WHERE id=$2', [userIds['chaed'], sh2[0].id]);
  await pool.query('UPDATE shops SET owner_user_id=$1 WHERE id=$2', [userIds['boss'], sh3[0].id]);

  /* ตลาด 3: ผจก.ใหม่ยื่นขอเปิด (ตลาดกลางวัน) — รอแอดมินอนุมัติ */
  const { rows: mk3 } = await pool.query(
    `INSERT INTO markets (name, area, description, hours_text, emoji, open_days, open_time, close_time,
                          open_today, sort_order, address, status, market_type, applied_by)
     VALUES ('ตลาดกลางวันสวนหลวง ร.9', 'กรุงเทพฯ · วัฒนา',
             'ตลาดเช้าสไตล์สวนหลวง ผักผลไม้จากไร่ อาหารตามสั่ง และของฝากสุขภาพ',
             'ตลาดกลางวัน 06:00 – 13:00', '☀️', '0,2,3,4,5,6', '06:00', '13:00', FALSE, 3,
             'สวนหลวง ร.9 ถนนพระราม 9 แขวงห้วยขวาง เขตวัฒนา กรุงเทพฯ 10310',
             'pending', 'day', $1) RETURNING id`,
    [userIds['malee']]
  );
  const M3 = mk3[0].id;
  await pool.query('UPDATE users SET market_id=$1 WHERE id=$2', [M3, userIds['malee']]);
  await pool.query(
    `INSERT INTO applications (kind, user_id, market_id, payload)
     VALUES ('market', $1, $2, $3)`,
    [userIds['malee'], M3, JSON.stringify({
      market_name: 'ตลาดกลางวันสวนหลวง ร.9', area: 'กรุงเทพฯ · วัฒนา', market_type: 'day',
      address: 'สวนหลวง ร.9 ถนนพระราม 9 แขวงห้วยขวาง เขตวัฒนา กรุงเทพฯ 10310',
      description: 'ตลาดเช้าสไตล์สวนหลวง ผักผลไม้จากไร่ อาหารตามสั่ง และของฝากสุขภาพ',
      open_days: '0,2,3,4,5,6', open_time: '06:00', close_time: '13:00',
      contact_name: 'มะลิ ศรีสุข', phone: '085-333-4455', email: 'malee.market@gmail.com',
    })]
  );

  /* ร้าน pending: ป้าแดงยื่นล็อค B2 ในตลาด 1 — รอผจก.พิจารณา */
  const { rows: shP } = await pool.query(
    `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id,
                        emoji, is_open, status, owner_user_id)
     VALUES ($1, 'B2', 'ขนมไทยป้าแดง', 'food',
             'ขนมไทยโบราณ ทำสดทุกเช้า — ขนมชั้น ทองหยิบ ฝอยทอง และขนมครกไข่หวาน',
             '087-555-1234', 'paedaeng@gmail.com', '@paedaeng', '🍡', TRUE, 'pending', $2)
     RETURNING id`,
    [M1, userIds['paedaeng']]
  );
  await pool.query('UPDATE users SET shop_id=$1 WHERE id=$2', [shP[0].id, userIds['paedaeng']]);
  await pool.query(
    `INSERT INTO applications (kind, user_id, market_id, shop_id, payload)
     VALUES ('shop', $1, $2, $3, $4)`,
    [userIds['paedaeng'], M1, shP[0].id, JSON.stringify({
      shop_name: 'ขนมไทยป้าแดง', category: 'food', lot_code: 'B2', market_name: 'ตลาดนัดริมคลองบางบอน',
      description: 'ขนมไทยโบราณ ทำสดทุกเช้า — ขนมชั้น ทองหยิบ ฝอยทอง และขนมครกไข่หวาน',
      phone: '087-555-1234', email: 'paedaeng@gmail.com', line_id: '@paedaeng', emoji: '🍡',
    })]
  );

  /* ร้าน denied: ตัวอย่างเหตุผลการปฏิเสธ (เพื่อดูฟลาว UI ครบ) */
  const denyReason = 'ล็อค N5 อยู่ในโซนที่กำลังปรับปรุงระบบไฟ — เลือกล็อคอื่นแล้วยื่นใหม่ได้เลยครับ';
  const { rows: shD } = await pool.query(
    `INSERT INTO shops (market_id, lot_code, name, category, description, phone,
                        emoji, is_open, status, deny_reason, owner_user_id)
     VALUES ($1, 'N5', 'กาแฟอุ่นใจ', 'food',
             'กาแฟคั่วเอง 100% อาราบิก้า ชงเย็น-ร้อน พร้อมเบเกอรี่ปังสดทุกวัน',
             '088-777-8899', '☕', TRUE, 'denied', $2, $3)
     RETURNING id`,
    [M2, denyReason, userIds['warmcoffee']]
  );
  await pool.query('UPDATE users SET shop_id=$1 WHERE id=$2', [shD[0].id, userIds['warmcoffee']]);
  await pool.query(
    `INSERT INTO applications (kind, user_id, market_id, shop_id, payload, status, deny_reason, decided_by, decided_at)
     VALUES ('shop', $1, $2, $3, $4, 'denied', $5, $6, now() - interval '2 days')`,
    [userIds['warmcoffee'], M2, shD[0].id, JSON.stringify({
      shop_name: 'กาแฟอุ่นใจ', category: 'food', lot_code: 'N5', market_name: 'ไนท์มาร์เก็ตสวนลุม',
      description: 'กาแฟคั่วเอง 100% อาราบิก้า ชงเย็น-ร้อน พร้อมเบเกอรี่ปังสดทุกวัน',
      phone: '088-777-8899', emoji: '☕',
    }), denyReason, userIds['admin']]
  );

  /* audit ใบสมัคร */
  await pool.query(
    `INSERT INTO audit_log (actor_id, actor_name, actor_role, market_id, action, detail, target)
     VALUES
      ($1, 'มะลิ ศรีสุข', 'manager', $2, 'apply.market', 'ยื่นขอเปิดตลาด "ตลาดกลางวันสวนหลวง ร.9" (กลางวัน) — รอแอดมินอนุมัติ', 'ตลาดกลางวันสวนหลวง ร.9'),
      ($3, 'ป้าแดง · ขนมไทย', 'vendor', $4, 'apply.shop', 'ยื่นขอเปิดร้าน "ขนมไทยป้าแดง" ในตลาด "ตลาดนัดริมคลองบางบอน" ล็อค B2 — รอพิจารณา', 'ขนมไทยป้าแดง'),
      ($5, 'อุ่นใจ · กาแฟ', 'vendor', $6, 'apply.shop', 'ยื่นขอเปิดร้าน "กาแฟอุ่นใจ" ในตลาด "ไนท์มาร์เก็ตสวนลุม" ล็อค N5 — รอพิจารณา', 'กาแฟอุ่นใจ')`,
    [userIds['malee'], M3, userIds['paedaeng'], M1, userIds['warmcoffee'], M2]
  );
  console.log('[seed] v6 ใบสมัครตัวอย่าง: ตลาดรออนุมัติ 1 (malee/market123) · ร้านรอพิจารณา 1 (paedaeng/vendor123) · ร้านถูกปฏิเสธ 1 (warmcoffee/vendor123)');
  console.log('[seed] บัญชีตัวอย่าง: admin/admin123 · somchai/market123 (ผจก.ตลาด 1) · prakai/market123 (ผจก.ตลาด 2) · pizzabee/chaed/boss: vendor123 · ลูกค้า 0890000001/cust123');
}

/* ---------------- app ---------------- */
const app = express();
app.use(express.json({ limit: '1mb' }));

/* ═══ v6.1 Security headers ═══ */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function num(v, def = null) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function cleanStr(v, max) {
  return String(v ?? '').trim().slice(0, max);
}

/* ---------- health ---------- */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true, service: 'TalatSuite', time: new Date().toISOString(), demo: process.env.SEED_DEMO !== 'false' });
  } catch {
    res.status(503).json({ ok: true, db: false, error: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ' });
  }
});

/* ============================================================
   ระบบสมาชิก (Auth) — scrypt hashing + session token
   ============================================================ */
const SESSION_DAYS = 30;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const check = crypto.scryptSync(String(pw), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}
function newToken() {
  return crypto.randomBytes(32).toString('hex');
}
/* ---------- ตารางเปิดทำการของตลาด ---------- */
const TH_DAY_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']; /* getDay() 0=อาทิตย์ */
function parseOpenDays(s) {
  return String(s || '').split(',').map((x) => x.trim()).filter((x) => /^[0-6]$/.test(x)).map(Number);
}
function marketOpenToday(mk, now = new Date()) {
  if (mk.force_open === true) return true;
  if (mk.force_open === false) return false;
  const days = parseOpenDays(mk.open_days);
  if (!days.length) return !!mk.open_today;
  return days.includes(now.getDay());
}
function scheduleText(mk) {
  const days = parseOpenDays(mk.open_days);
  const hasTime = !!(mk.open_time && mk.close_time);
  const time = hasTime ? `${mk.open_time}–${mk.close_time}` : (mk.hours_text || '');
  let dayTxt;
  if (!days.length || days.length === 7) dayTxt = 'เปิดทุกวัน';
  else if (days.length === 1) dayTxt = `เปิดวัน${TH_DAY_S[days[0]]}`;
  else {
    /* รวมวันติดกันเป็นช่วง เช่น จ–ศ (รองรับข้ามสัปดาห์ ศ–อา) */
    let sorted = days.slice().sort((a, b) => a - b);
    if (sorted.includes(0) && sorted.includes(6)) {
      /* มี ส. และ อา. — เลื่อนจุดเริ่มไปหลังช่องว่าง เช่น [0,5,6] → [5,6,0] */
      const set = new Set(sorted);
      for (const s of sorted) {
        const chain = [];
        let d = s;
        while (chain.length < sorted.length && set.has(d)) { chain.push(d); d = (d + 1) % 7; }
        if (chain.length === sorted.length) { sorted = chain; break; }
      }
    }
    const ranges = [];
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const d = sorted[i];
      if (d === (prev + 1) % 7) { prev = d; continue; }
      ranges.push(start === prev ? TH_DAY_S[start] : `${TH_DAY_S[start]}–${TH_DAY_S[prev]}`);
      start = prev = d;
    }
    dayTxt = 'เปิด ' + ranges.join(' · ');
  }
  return time ? `${dayTxt} ${time}${hasTime ? ' น.' : ''}` : dayTxt;
}
function marketPublicSchedule(mk) {
  return {
    open_days: parseOpenDays(mk.open_days),
    open_time: mk.open_time || '',
    close_time: mk.close_time || '',
    force_open: mk.force_open == null ? null : mk.force_open,
    schedule_text: scheduleText(mk),
    open_today: marketOpenToday(mk),
  };
}

function userPublic(u) {
  return {
    id: u.id, login: u.login, role: u.role, display_name: u.display_name,
    phone: u.phone, email: u.email,
    has_passcode: !!u.passcode_hash,
    market_id: u.market_id == null ? null : Number(u.market_id),
    shop_id: u.shop_id == null ? null : Number(u.shop_id),
    created_at: u.created_at, last_login_at: u.last_login_at,
  };
}

/* v6: ข้อมูลเสริมตามบทบาท — ร้านค้าเห็นร้านทุกแห่งของตัวเอง (หลายตลาดได้) · ผจก.เห็นสถานะตลาดตัวเอง */
async function authExtras(u) {
  const out = {};
  try {
    if (u.role === 'vendor') {
      const { rows } = await pool.query(
        `SELECT s.id, s.name, s.emoji, s.lot_code, s.status, s.deny_reason, s.market_id,
                m.name AS market_name, m.market_type AS market_type
         FROM shops s JOIN markets m ON m.id = s.market_id
         WHERE s.owner_user_id = $1 OR s.id = $2
         ORDER BY s.created_at, s.id`,
        [u.id, u.shop_id || 0]
      );
      out.vendor_shops = rows.map((r) => ({ ...r, id: Number(r.id), market_id: Number(r.market_id) }));
    }
    if (u.role === 'manager' && u.market_id) {
      const { rows } = await pool.query(
        'SELECT id, name, status, deny_reason, market_type FROM markets WHERE id=$1', [u.market_id]
      );
      out.manager_market = rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
    }
  } catch (e) { console.error('[authExtras]', e.message); }
  return out;
}

/* ผู้ใช้ปัจจุบันจาก header Authorization: Bearer <token> */
const ROLE_TH_SRV = { admin: 'แอดมิน', manager: 'ผู้จัดการตลาด', vendor: 'ร้านค้า', customer: 'ลูกค้า', guest: 'แขก' };

/* ---------- audit log (v5) — บันทึกทุกการกระทำสำคัญ ให้แอดมินตรวจสอบย้อนหลัง ---------- */
async function audit(actor, action, detail = '', marketId = null, target = '') {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_name, actor_role, market_id, action, detail, target)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [actor ? actor.id : null,
       actor ? actor.display_name : 'ระบบ',
       actor ? actor.role : 'system',
       marketId || null,
       String(action).slice(0, 60),
       String(detail || '').slice(0, 500),
       String(target || '').slice(0, 200)]
    );
  } catch (e) { console.error('[audit]', e.message); }
}

/* ตรวจ/กรองเบอร์โทรไทย — คืน '' ถ้าไม่ถูกต้อง */
function normalizeThaiPhone(raw) {
  let d = String(raw || '').replace(/[^0-9+]/g, '');
  if (d.startsWith('+66')) d = '0' + d.slice(3);
  else if (d.startsWith('66') && d.length === 11) d = '0' + d.slice(2);
  d = d.replace(/\D/g, '');
  if (/^0[2689]\d{8}$/.test(d)) return d; /* มือถือ 0[689] + สายบ้าน 0[2] (9-10 หลัก) */
  if (/^0[2-57]\d{7}$/.test(d)) return d;
  return '';
}

async function currentUser(req) {
  const h = String(req.headers.authorization || '');
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  try {
    const { rows } = await pool.query(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`, [token]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}
async function startSession(userId) {
  const token = newToken();
  await pool.query(
    `INSERT INTO sessions (token, user_id, expires_at)
     VALUES ($1,$2, now() + ($3 || ' days')::interval)`,
    [token, userId, String(SESSION_DAYS)]
  );
  return token;
}

/* Guards — คืน user หรือ null (และตอบ error ให้เอง) */
async function requireUser(req, res, roles) {
  const u = await currentUser(req);
  if (!u) {
    bad(res, 'ต้องเข้าสู่ระบบก่อนใช้งานส่วนนี้', 401);
    return null;
  }
  if (roles && !roles.includes(u.role)) {
    bad(res, 'บัญชีของคุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403);
    return null;
  }
  return u;
}
async function requireMarketAccess(req, res, marketId) {
  const u = await requireUser(req, res, ['admin', 'manager']);
  if (!u) return null;
  if (u.role === 'manager' && Number(u.market_id) !== Number(marketId)) {
    bad(res, 'คุณดูแลได้เฉพาะตลาดของตัวเองเท่านั้น', 403);
    return null;
  }
  return u;
}
async function requireShopAccess(req, res, shopId, { allowManager = false } = {}) {
  const u = await requireUser(req, res, allowManager ? ['admin', 'vendor', 'manager'] : ['admin', 'vendor']);
  if (!u) return null;
  if (u.role === 'vendor') {
    const { rows } = await pool.query(
      'SELECT id FROM shops WHERE id=$1 AND (owner_user_id=$2 OR id=$3)',
      [shopId, u.id, u.shop_id || 0]
    );
    if (!rows.length) {
      bad(res, 'คุณดูแลได้เฉพาะร้านของตัวเองเท่านั้น', 403);
      return null;
    }
    return u;
  }
  if (u.role === 'manager') {
    const { rows } = await pool.query('SELECT market_id FROM shops WHERE id=$1', [shopId]);
    if (!rows.length) { bad(res, 'ไม่พบร้านนี้', 404); return null; }
    if (Number(rows[0].market_id) !== Number(u.market_id)) {
      bad(res, 'ร้านนี้ไม่ได้อยู่ในตลาดที่คุณดูแล', 403);
      return null;
    }
  }
  return u;
}

/* ---------- POST /api/auth/register — สมัคร (ลูกค้า / เปิดร้านค้า) ---------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!rlAllow(rlKey(req), RL_MAX_AUTH)) return bad(res, 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', 429);
    const b = req.body || {};
    const role = b.role === 'vendor' ? 'vendor' : 'customer';
    const login = cleanStr(b.login, 60).toLowerCase();
    const password = String(b.password || '');
    const display_name = cleanStr(b.display_name, 120);
    if (!display_name) return bad(res, 'กรุณากรอกชื่อ');
    if (login.length < 3) return bad(res, role === 'customer' ? 'กรุณากรอกเบอร์โทรให้ถูกต้อง (ใช้เข้าสู่ระบบ)' : 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร');
    if (!/^[\w.\-@+]+$/.test(login)) return bad(res, 'ชื่อผู้ใช้/เบอร์โทรมีอักขระที่ใช้ไม่ได้');
    if (password.length < 4) return bad(res, 'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร');
    const { rows: dup } = await pool.query('SELECT id FROM users WHERE login=$1', [login]);
    if (dup.length) return bad(res, role === 'customer' ? 'เบอร์โทรนี้เป็นสมาชิกอยู่แล้ว — ลองเข้าสู่ระบบ' : 'ชื่อผู้ใช้นี้ถูกใช้แล้ว');

    let market_id = null;
    if (role === 'vendor' && b.market_id) {
      const mid = num(b.market_id);
      const { rows: mk } = await pool.query('SELECT id FROM markets WHERE id=$1', [mid]);
      if (!mk.length) return bad(res, 'ไม่พบตลาดนี้', 404);
      market_id = mid;
    }
    const { rows } = await pool.query(
      `INSERT INTO users (login, password_hash, role, display_name, phone, email, market_id, last_login_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now()) RETURNING *`,
      [login, hashPassword(password), role, display_name, cleanStr(b.phone, 32) || (role === 'customer' ? login : ''),
       cleanStr(b.email, 120), market_id]
    );
    const token = await startSession(rows[0].id);
    await audit(rows[0], 'auth.register', `สมัครสมาชิกใหม่ (${ROLE_TH_SRV[rows[0].role]})`, rows[0].market_id, rows[0].login);
    res.status(201).json({ ok: true, token, user: userPublic(rows[0]), ...(await authExtras(rows[0])) });
  } catch (err) {
    console.error('[register]', err);
    bad(res, 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ═══ v6.1 Rate limiting (in-memory, ต่อ IP) ═══ */
const RL_WINDOW_MS = 5 * 60 * 1000;
const RL_MAX_AUTH = 150;  /* คำขอต่อ window ต่อ IP สำหรับ auth endpoints */
const RL_MAX_FAIL = 12;   /* การล็อกอินผิดพลาดต่อ window ต่อ IP */
const rlBuckets = new Map();
function rlKey(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}
function rlBucket(key) {
  const now = Date.now();
  let b = rlBuckets.get(key);
  if (!b || now - b.t0 > RL_WINDOW_MS) { b = { t0: now, n: 0, fails: 0 }; rlBuckets.set(key, b); }
  return b;
}
function rlAllow(key, max) {
  const b = rlBucket(key);
  b.n += 1;
  return b.n <= max;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rlBuckets) if (now - b.t0 > RL_WINDOW_MS * 2) rlBuckets.delete(k);
}, 10 * 60 * 1000).unref();

/* ═══ v6.1 ล้าง session หมดอายุ (ทุก 6 ชม. + ตอนบูต) ═══ */
async function cleanupSessions() {
  try { await pool.query('DELETE FROM sessions WHERE expires_at < now()'); }
  catch (e) { console.error('[session-cleanup]', e.message); }
}
setInterval(cleanupSessions, 6 * 60 * 60 * 1000).unref();
setTimeout(cleanupSessions, 15000).unref(); /* รอ schema/seed เสร็จก่อน */


/* ---------- POST /api/auth/login ---------- */
app.post('/api/auth/login', async (req, res) => {
  try {
    const rlIP = rlKey(req);
    if (!rlAllow(rlIP, RL_MAX_AUTH)) return bad(res, 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', 429);
    const b = req.body || {};
    const login = cleanStr(b.login, 60).toLowerCase();
    const password = String(b.password || '');
    if (!login || !password) return bad(res, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    const { rows } = await pool.query('SELECT * FROM users WHERE login=$1', [login]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      const bkt = rlBucket(rlIP);
      bkt.fails += 1;
      if (bkt.fails > RL_MAX_FAIL) return bad(res, 'พยายามเข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณารอประมาณ 5 นาทีแล้วลองใหม่', 429);
      return bad(res, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }
    await pool.query('UPDATE users SET last_login_at=now() WHERE id=$1', [rows[0].id]);
    const token = await startSession(rows[0].id);
    await audit(rows[0], 'auth.login', `เข้าสู่ระบบ (${ROLE_TH_SRV[rows[0].role] || rows[0].role})`, rows[0].market_id, rows[0].login);
    res.json({ ok: true, token, user: userPublic(rows[0]), ...(await authExtras(rows[0])) });
  } catch (err) {
    console.error('[login]', err);
    bad(res, 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ---------- POST /api/auth/logout ---------- */
app.post('/api/auth/logout', async (req, res) => {
  try {
    const h = String(req.headers.authorization || '');
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (token) await pool.query('DELETE FROM sessions WHERE token=$1', [token]);
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

/* ---------- GET /api/auth/me ---------- */
app.get('/api/auth/me', async (req, res) => {
  const u = await currentUser(req);
  if (!u) return bad(res, 'ยังไม่ได้เข้าสู่ระบบ', 401);
  res.json({ user: userPublic(u), ...(await authExtras(u)) });
});

/* ---------- DELETE /api/auth/me — ลบบัญชีตัวเอง (profile delete) ---------- */
app.delete('/api/auth/me', async (req, res) => {
  try {
    const u = await currentUser(req);
    if (!u) return bad(res, 'ยังไม่ได้เข้าสู่ระบบ', 401);
    if (u.role === 'admin') {
      const { rows: admins } = await pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role='admin'`);
      if (admins[0].n <= 1) return bad(res, 'ไม่สามารถลบบัญชีแอดมินคนสุดท้ายของระบบได้ — ให้สร้างแอดมินคนใหม่ก่อน');
    }
    await pool.query('DELETE FROM sessions WHERE user_id=$1', [u.id]);
    const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [u.id]);
    if (!rowCount) return bad(res, 'ไม่พบบัญชีนี้', 404);
    await audit(u, 'user.delete',
      `ลบบัญชีตัวเอง (${ROLE_TH_SRV[u.role] || u.role} \"${u.display_name}\")`, u.market_id, u.login);
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth me delete]', err);
    bad(res, 'ลบบัญชีไม่สำเร็จ', 500);
  }
});

/* ---------- PUT /api/auth/password — เปลี่ยนรหัสผ่าน ---------- */
app.put('/api/auth/password', async (req, res) => {
  try {
    const u = await currentUser(req);
    if (!u) return bad(res, 'ยังไม่ได้เข้าสู่ระบบ', 401);
    const b = req.body || {};
    const oldPw = String(b.old_password || '');
    const newPw = String(b.new_password || '');
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [u.id]);
    if (!rows.length) return bad(res, 'ไม่พบผู้ใช้', 404);
    if (!verifyPassword(oldPw, rows[0].password_hash))
      return bad(res, 'รหัสผ่านเดิมไม่ถูกต้อง', 401);
    if (newPw.length < 4) return bad(res, 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 4 ตัวอักษร');
    if (newPw === oldPw) return bad(res, 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');

    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hashPassword(newPw), u.id]);

    /* ยกเลิก session อื่นทั้งหมด — บังคับออกจากระบบทุกเครื่อง ยกเว้นเครื่องปัจจุบัน */
    const h = String(req.headers.authorization || '');
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    await pool.query('DELETE FROM sessions WHERE user_id=$1 AND token <> $2', [u.id, token]);
    await audit(u, 'auth.password', 'เปลี่ยนรหัสผ่าน (ไล่เซสชันอื่น)', u.market_id, u.login);

    res.json({ ok: true, user: userPublic(u) });
  } catch (err) {
    console.error('[password change]', err);
    bad(res, 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ---------- PUT /api/auth/passcode — ตั้ง/เปลี่ยน/ลบรหัสล็อคหน้าจอ ---------- */
app.put('/api/auth/passcode', async (req, res) => {
  try {
    const u = await currentUser(req);
    if (!u) return bad(res, 'ยังไม่ได้เข้าสู่ระบบ', 401);
    const b = req.body || {};
    const password = String(b.password || '');
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [u.id]);
    if (!rows.length) return bad(res, 'ไม่พบผู้ใช้', 404);
    if (!verifyPassword(password, rows[0].password_hash))
      return bad(res, 'รหัสผ่านไม่ถูกต้อง', 401);

    if (b.passcode === null || b.passcode === '' || b.passcode === undefined) {
      await pool.query('UPDATE users SET passcode_hash=NULL WHERE id=$1', [u.id]);
      await audit(u, 'auth.passcode', 'ลบรหัสล็อคหน้าจอ', u.market_id, u.login);
      return res.json({ ok: true, has_passcode: false });
    }
    const pc = String(b.passcode);
    if (!/^[0-9]{4,8}$/.test(pc)) return bad(res, 'รหัสล็อคเป็นตัวเลข 4–8 หลัก');
    await pool.query('UPDATE users SET passcode_hash=$1 WHERE id=$2', [hashPassword(pc), u.id]);
    await audit(u, 'auth.passcode', 'ตั้ง/เปลี่ยนรหัสล็อคหน้าจอ', u.market_id, u.login);
    res.json({ ok: true, has_passcode: true });
  } catch (err) {
    console.error('[passcode]', err);
    bad(res, 'บันทึกรหัสล็อคไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ---------- POST /api/auth/verify-passcode — ปลดล็อคหน้าจอ ---------- */
app.post('/api/auth/verify-passcode', async (req, res) => {
  try {
    const u = await currentUser(req);
    if (!u) return bad(res, 'ยังไม่ได้เข้าสู่ระบบ', 401);
    const pc = String((req.body || {}).passcode || '');
    const { rows } = await pool.query('SELECT passcode_hash FROM users WHERE id=$1', [u.id]);
    if (!rows.length || !rows[0].passcode_hash) return bad(res, 'บัญชีนี้ไม่ได้ตั้งรหัสล็อค', 400);
    if (!verifyPassword(pc, rows[0].passcode_hash))
      return bad(res, 'รหัสล็อคไม่ถูกต้อง', 401);
    res.json({ ok: true });
  } catch (err) {
    console.error('[verify passcode]', err);
    bad(res, 'ปลดล็อคไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ============================================================
   ตลาด (public + manager)
   ============================================================ */

/* GET /api/markets — รายการตลาดทั้งหมด (ลูกค้า/ผู้จัดการ) */
app.get('/api/markets', async (req, res) => {
  try {
    /* v6: ลูกค้า/ร้านค้าเห็นเฉพาะตลาดที่อนุมัติแล้ว · ผจก.เห็นของตัวเองด้วย (รวมรออนุมัติ) · แอดมินเห็นทั้งหมด */
    const u = await currentUser(req);
    const isAdmin = u && u.role === 'admin';
    const isManager = u && u.role === 'manager' && u.market_id;
    const { rows } = await pool.query(
      `SELECT m.*,
              (SELECT COUNT(*)::int FROM shops s WHERE s.market_id = m.id AND s.status='approved') AS shops_total,
              (SELECT COUNT(*)::int FROM shops s WHERE s.market_id = m.id AND s.status='approved' AND s.is_open) AS shops_open,
              (SELECT COUNT(*)::int FROM lots l WHERE l.market_id = m.id) AS lots_total
       FROM markets m
       ${isAdmin ? '' : isManager ? "WHERE m.status='approved' OR m.id = $1" : "WHERE m.status='approved'"}
       ORDER BY m.sort_order, m.id`,
      isManager ? [u.market_id] : []
    );
    res.json({ markets: rows.map((m) => ({
      id: m.id, name: m.name, area: m.area, description: m.description,
      hours_text: m.hours_text, emoji: m.emoji, sort_order: m.sort_order,
      shops_total: m.shops_total, shops_open: m.shops_open, lots_total: m.lots_total,
      address: m.address, lat: m.lat, lng: m.lng, announcement: m.announcement,
      status: m.status, market_type: m.market_type,
      ...marketPublicSchedule(m),
    })) });
  } catch (err) {
    console.error('[markets]', err);
    bad(res, 'โหลดรายชื่อตลาดไม่สำเร็จ', 500);
  }
});

/* POST /api/markets — สร้างตลาดใหม่ (แอดมินเท่านั้น) */
/* อ่านฟิลด์ตารางเปิดทำการจาก body */
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
function validTime(t) {
  if (TIME_RE.test(String(t))) return t;
  if (String(t) === '24:00') return '24:00'; /* เวลาปิดเที่ยงคืน */
  return '';
}
function readGeoBody(b) {
  const out = {};
  if (b.address !== undefined) out.address = cleanStr(b.address, 300);
  if (b.announcement !== undefined) out.announcement = cleanStr(b.announcement, 300);
  if (b.lat !== undefined) {
    const v = b.lat === null || b.lat === '' ? null : Number(b.lat);
    if (v !== null && (!Number.isFinite(v) || v < -90 || v > 90)) out.lat = null;
    else out.lat = v;
  }
  if (b.lng !== undefined) {
    const v = b.lng === null || b.lng === '' ? null : Number(b.lng);
    if (v !== null && (!Number.isFinite(v) || v < -180 || v > 180)) out.lng = null;
    else out.lng = v;
  }
  return out;
}
function readScheduleBody(b) {
  const out = {};
  if (b.open_days !== undefined) {
    const days = Array.isArray(b.open_days) ? b.open_days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
    out.open_days = [...new Set(days)].sort().join(',');
  }
  if (b.open_time !== undefined) out.open_time = validTime(b.open_time);
  if (b.close_time !== undefined) out.close_time = validTime(b.close_time);
  if (b.force_open !== undefined) out.force_open = b.force_open === null ? null : Boolean(b.force_open);
  return out;
}

app.post('/api/markets', async (req, res) => {
  try {
    const u = await requireUser(req, res, ['admin']);
    if (!u) return;
    const b = req.body || {};
    const name = cleanStr(b.name, 120);
    if (!name) return bad(res, 'กรุณากรอกชื่อตลาด');
    const sched = readScheduleBody(b);
    const openDays = sched.open_days !== undefined ? sched.open_days : '0,1,2,3,4,5,6';
    const openTime = sched.open_time !== undefined ? sched.open_time : '';
    const closeTime = sched.close_time !== undefined ? sched.close_time : '';
    const forceOpen = sched.force_open !== undefined ? sched.force_open : null;
    const { rows: max } = await pool.query('SELECT COALESCE(MAX(sort_order),0)::int AS m FROM markets');
    const geo = readGeoBody(b);
    const marketType = b.market_type === 'day' ? 'day' : 'night';
    const { rows } = await pool.query(
      `INSERT INTO markets (name, area, description, hours_text, emoji, open_days, open_time, close_time, force_open, open_today, sort_order, address, lat, lng, announcement, market_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [name, cleanStr(b.area, 160), cleanStr(b.description, 500), cleanStr(b.hours_text, 120),
       cleanStr(b.emoji, 8) || '🏪', openDays, openTime, closeTime, forceOpen,
       true, max[0].m + 1, geo.address || '', geo.lat || null, geo.lng || null, geo.announcement || '', marketType]
    );
    await audit(u, 'market.create', `สร้างตลาด "${name}"`, rows[0].id, name);
    res.status(201).json({ ok: true, market: { ...rows[0], ...marketPublicSchedule(rows[0]) } });
  } catch (err) {
    console.error('[market create]', err);
    bad(res, 'สร้างตลาดไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* PUT /api/markets/:id — แก้ข้อมูลตลาด */
app.put('/api/markets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!(await requireMarketAccess(req, res, id))) return;
    const { rows: cur } = await pool.query('SELECT * FROM markets WHERE id=$1', [id]);
    if (!cur.length) return bad(res, 'ไม่พบตลาดนี้', 404);
    const b = req.body || {};
    const f = {};
    f.name = b.name !== undefined ? cleanStr(b.name, 120) : cur[0].name;
    if (!f.name) return bad(res, 'ชื่อตลาดห้ามว่าง');
    f.area = b.area !== undefined ? cleanStr(b.area, 160) : cur[0].area;
    f.description = b.description !== undefined ? cleanStr(b.description, 500) : cur[0].description;
    f.hours_text = b.hours_text !== undefined ? cleanStr(b.hours_text, 120) : cur[0].hours_text;
    f.emoji = b.emoji !== undefined ? (cleanStr(b.emoji, 8) || '🏪') : cur[0].emoji;
    f.open_today = b.open_today !== undefined ? Boolean(b.open_today) : cur[0].open_today;
    const sched = readScheduleBody(b);
    f.open_days = sched.open_days !== undefined ? sched.open_days : cur[0].open_days;
    f.open_time = sched.open_time !== undefined ? sched.open_time : cur[0].open_time;
    f.close_time = sched.close_time !== undefined ? sched.close_time : cur[0].close_time;
    f.force_open = sched.force_open !== undefined ? sched.force_open : cur[0].force_open;
    const geo = readGeoBody(b);
    f.address = geo.address !== undefined ? geo.address : cur[0].address;
    f.announcement = geo.announcement !== undefined ? geo.announcement : cur[0].announcement;
    f.lat = geo.lat !== undefined ? geo.lat : cur[0].lat;
    f.lng = geo.lng !== undefined ? geo.lng : cur[0].lng;
    f.market_type = b.market_type !== undefined ? (b.market_type === 'day' ? 'day' : 'night') : cur[0].market_type;
    const { rows } = await pool.query(
      `UPDATE markets SET name=$2, area=$3, description=$4, hours_text=$5, emoji=$6, open_today=$7,
              open_days=$8, open_time=$9, close_time=$10, force_open=$11,
              address=$12, lat=$13, lng=$14, announcement=$15, market_type=$16
       WHERE id=$1 RETURNING *`,
      [id, f.name, f.area, f.description, f.hours_text, f.emoji, f.open_today,
       f.open_days, f.open_time, f.close_time, f.force_open,
       f.address, f.lat, f.lng, f.announcement, f.market_type]
    );
    const actor = await currentUser(req);
    /* รายละเอียดบอกว่าแก้อะไรบ้าง — แอดมินไล่ย้อนหลังได้ง่าย */
    const changed = [];
    const labels = [
      ['name', 'ชื่อ'], ['area', 'ที่ตั้ง'], ['description', 'คำอธิบาย'], ['hours_text', 'เวลาเปิด'],
      ['emoji', 'อิโมจิ'], ['open_today', 'เปิดวันนี้'], ['open_days', 'วันเปิด'], ['open_time', 'เวลาเปิด'],
      ['close_time', 'เวลาปิด'], ['force_open', 'บังคับเปิด/ปิด'],
      ['address', 'ที่อยู่'], ['lat', 'พิกัด'], ['lng', 'พิกัด'], ['announcement', 'ประกาศ'],
      ['market_type', 'ประเภทตลาด'],
    ];
    for (const [k, label] of labels) {
      const was = cur[0][k] == null ? '' : String(cur[0][k]);
      const now = f[k] == null ? '' : String(f[k]);
      if (was !== now && !(label === 'พิกัด' && changed.includes('พิกัด'))) changed.push(label);
    }
    await audit(actor, 'market.update',
      `แก้ไขตลาด "${f.name}"${changed.length ? ' (' + changed.join(', ') + ')' : ''}`, id, f.name);
    res.json({ ok: true, market: { ...rows[0], ...marketPublicSchedule(rows[0]) } });
  } catch (err) {
    console.error('[market update]', err);
    bad(res, 'อัปเดตตลาดไม่สำเร็จ', 500);
  }
});

/* DELETE /api/markets/:id — ลบตลาด (แอดมิน) — ล็อค/ร้าน/เมนู/ออเดอร์ถูกลบตาม (cascade) */
app.delete('/api/markets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const u = await requireUser(req, res, ['admin']);
    if (!u) return;
    const { rows: accts } = await pool.query(
      `SELECT login, role FROM users WHERE market_id=$1 OR shop_id IN (SELECT id FROM shops WHERE market_id=$1)`, [id]
    );
    if (accts.length) {
      await pool.query('UPDATE users SET market_id=NULL, shop_id=NULL WHERE market_id=$1 OR shop_id IN (SELECT id FROM shops WHERE market_id=$1)', [id]);
    }
    const { rows: mkName } = await pool.query('SELECT name FROM markets WHERE id=$1', [id]);
    const { rowCount } = await pool.query('DELETE FROM markets WHERE id=$1', [id]);
    if (!rowCount) return bad(res, 'ไม่พบตลาดนี้', 404);
    await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE login=\'\')'); /* เผื่อค้าง */
    await audit(u, 'market.delete', `ลบตลาด "${mkName[0].name}" (ยกเลิกการผูกบัญชี ${accts.length} บัญชี)`, id, mkName[0].name);
    res.json({ ok: true, unlinked_accounts: accts.length });
  } catch (err) {
    console.error('[market delete]', err);
    bad(res, 'ลบตลาดไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* GET /api/market/layout?market_id= — โครงสร้างแถวล็อคของตลาด */
app.get('/api/market/layout', async (req, res) => {
  try {
    const mid = num(req.query.market_id, 1);
    if (!(await requireMarketAccess(req, res, mid))) return;
    const { rows } = await pool.query(
      `SELECT row_label, COUNT(*)::int AS count, MAX(rent_amount)::float8 AS rent
       FROM lots WHERE market_id=$1 GROUP BY row_label ORDER BY row_label`, [mid]
    );
    res.json({ rows: rows.map((r) => ({ row_label: r.row_label, count: r.count, rent: Number(r.rent) })) });
  } catch (err) {
    console.error('[layout]', err);
    bad(res, 'โหลดผังตลาดไม่สำเร็จ', 500);
  }
});

/* PUT /api/market/layout?market_id= — แก้โครงสร้างแถวล็อค */
app.put('/api/market/layout', async (req, res) => {
  try {
    const mid = num(req.query.market_id, 1);
    if (!(await requireMarketAccess(req, res, mid))) return;
    const { rows: mk } = await pool.query('SELECT id FROM markets WHERE id=$1', [mid]);
    if (!mk.length) return bad(res, 'ไม่พบตลาดนี้', 404);

    const rows = req.body && req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 8)
      return bad(res, 'โครงสร้างต้องมี 1–8 แถว');

    const seen = new Set();
    const cleanRows = [];
    for (const r of rows) {
      const label = cleanStr(r.row_label, 1).toUpperCase();
      if (!/^[A-Z]$/.test(label)) return bad(res, `รหัสแถวต้องเป็นตัวอักษร A–Z (ได้รับ "${label}")`);
      if (seen.has(label)) return bad(res, `รหัสแถว "${label}" ซ้ำกัน`);
      seen.add(label);
      const count = num(r.count);
      if (!Number.isInteger(count) || count < 1 || count > 30)
        return bad(res, `จำนวนล็อคของแถว ${label} ต้องเป็น 1–30`);
      const rent = num(r.rent);
      if (rent === null || rent < 0 || rent > 100000)
        return bad(res, `ค่าเช่าของแถว ${label} ต้องเป็นตัวเลข 0–100,000`);
      cleanRows.push({ label, count, rent });
    }

    /* รหัสล็อคที่จะเกิดใหม่ทั้งหมด — รหัส unique เฉพาะในตลาด (market_id, code) ใช้แถว A–Z ซ้ำกันข้ามตลาดได้ */
    const wantCodes = [];
    for (const r of cleanRows) for (let i = 1; i <= r.count; i++) wantCodes.push(`${r.label}${i}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      /* ลบล็อคเก่าที่หายไป (ประวัติ lot_day/payments ถูกลบตาม) */
      await client.query(
        'DELETE FROM lots WHERE market_id=$1 AND NOT (code = ANY($2::text[]))',
        [mid, wantCodes]
      );
      for (const r of cleanRows) {
        for (let i = 1; i <= r.count; i++) {
          const code = `${r.label}${i}`;
          await client.query(
            `INSERT INTO lots (code, market_id, row_label, position, rent_amount)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (market_id, code) DO UPDATE SET rent_amount = EXCLUDED.rent_amount`,
            [code, mid, r.label, i, r.rent]
          );
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    const actorL = await currentUser(req);
    await audit(actorL, 'market.layout',
      `บันทึกผังล็อค ${cleanRows.length} แถว (${cleanRows.map((r) => `${r.label}×${r.count}`).join(', ')}) = ${wantCodes.length} ล็อค`, mid);
    res.json({ ok: true, count: wantCodes.length });
  } catch (err) {
    console.error('[layout save]', err);
    bad(res, 'บันทึกผังตลาดไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* ============================================================
   แอป 1 — ระบบจัดการตลาด (Manager)
   ============================================================ */

/* GET /api/market/dashboard?date=&period=&market_id= */
app.get('/api/market/dashboard', async (req, res) => {
  try {
    const mid = num(req.query.market_id, 1);
    if (!(await requireMarketAccess(req, res, mid))) return;
    const date = DAY_RE.test(String(req.query.date || '')) ? req.query.date : todayStr();
    const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
      ? req.query.period : 'daily';
    const range = periodRange(date, period);

    const lots = await pool.query(
      `SELECT l.code, l.row_label, l.label, l.position, l.rent_amount AS default_rent,
              s.vendor_name, s.category, s.attendance, s.payment_status, s.payment_method,
              s.rent_amount AS day_rent
       FROM lots l
       LEFT JOIN lot_day s ON s.lot_code = l.code AND s.market_id = l.market_id AND s.day = $1
       WHERE l.market_id = $2
       ORDER BY l.row_label, l.position`,
      [date, mid]
    );

    const rev = await pool.query(
      `SELECT COALESCE(SUM(p.amount),0)::float8 AS total, COUNT(*)::int AS n
       FROM payments p JOIN lots l ON l.code = p.lot_code AND l.market_id = p.market_id
       WHERE l.market_id = $1 AND p.day BETWEEN $2 AND $3`,
      [mid, range.from, range.to]
    );

    const occ = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE s.vendor_name <> '')::int AS occupied,
         COUNT(*) FILTER (WHERE s.vendor_name <> '' AND s.payment_status = 'unpaid')::int AS unpaid,
         COUNT(*) FILTER (WHERE s.vendor_name <> '' AND s.payment_status = 'paid')::int AS paid
       FROM lot_day s JOIN lots l ON l.code = s.lot_code AND l.market_id = s.market_id
       WHERE s.day = $1 AND l.market_id = $2`,
      [date, mid]
    );

    const totalLots = await pool.query('SELECT COUNT(*)::int AS n FROM lots WHERE market_id=$1', [mid]);

    const shopsStat = await pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_open)::int AS open
       FROM shops WHERE market_id=$1`, [mid]);

    res.json({
      date,
      period,
      range,
      lots: lots.rows.map((r) => ({
        code: r.code,
        row: r.row_label,
        label: r.label || '',
        position: r.position,
        default_rent: Number(r.default_rent),
        state: r.vendor_name === null ? null : {
          vendor_name: r.vendor_name,
          category: r.category,
          attendance: r.attendance,
          payment_status: r.payment_status,
          payment_method: r.payment_method,
          rent_amount: Number(r.day_rent),
        },
      })),
      metrics: {
        revenue: Number(rev.rows[0].total),
        payment_count: rev.rows[0].n,
        total_lots: totalLots.rows[0].n,
        occupied: occ.rows[0].occupied,
        unpaid: occ.rows[0].unpaid,
        paid: occ.rows[0].paid,
        shops_open: shopsStat.rows[0].open,
        shops_total: shopsStat.rows[0].total,
      },
    });
  } catch (err) {
    console.error('[dashboard]', err);
    bad(res, 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* PUT /api/market/lots/:code — บันทึกสถานะล็อคของวันนั้น */
app.put('/api/market/lots/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const b = req.body || {};
    const date = String(b.date || '');
    if (!DAY_RE.test(date)) return bad(res, 'รูปแบบวันที่ไม่ถูกต้อง');
    const mid = num(req.query.market_id);
    if (!mid) return bad(res, 'ระบุ market_id ของล็อค');

    const { rows: lotRows } = await pool.query('SELECT * FROM lots WHERE code=$1 AND market_id=$2', [code, mid]);
    if (!lotRows.length) return bad(res, `ไม่พบล็อค ${code} ในตลาดนี้`, 404);
    const lot = lotRows[0];
    if (!(await requireMarketAccess(req, res, lot.market_id))) return;

    /* ชื่อล็อคกำหนดเอง (ป้ายบนการ์ด เช่น "ป้าแดง") */
    if (b.label !== undefined) {
      await pool.query('UPDATE lots SET label=$1 WHERE market_id=$2 AND code=$3',
        [cleanStr(b.label, 60), lot.market_id, code]);
    }

    const vendor_name = cleanStr(b.vendor_name, 120);
    const category = CATEGORIES.includes(b.category) ? b.category : 'general';
    const attendance = ATTENDANCES.includes(b.attendance) ? b.attendance : 'present';
    const payment_status = PAY_STATUSES.includes(b.payment_status) ? b.payment_status : 'unpaid';
    const payment_method = PAY_METHODS.includes(b.payment_method) ? b.payment_method : 'cash';
    const rent = num(b.rent_amount, Number(lot.rent_amount));
    if (rent === null || rent < 0 || rent > 1_000_000)
      return bad(res, 'ค่าเช่าต้องเป็นตัวเลข 0 ถึง 1,000,000');

    const occupied = vendor_name !== '';

    await pool.query(
      `INSERT INTO lot_day (lot_code, market_id, day, vendor_name, category, attendance, payment_status, payment_method, rent_amount, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (market_id, lot_code, day) DO UPDATE SET
         vendor_name = EXCLUDED.vendor_name, category = EXCLUDED.category,
         attendance = EXCLUDED.attendance, payment_status = EXCLUDED.payment_status,
         payment_method = EXCLUDED.payment_method, rent_amount = EXCLUDED.rent_amount,
         updated_at = now()`,
      [code, lot.market_id, date, vendor_name, category, attendance, payment_status, payment_method, rent]
    );

    if (occupied && payment_status === 'paid') {
      await pool.query(
        `INSERT INTO payments (lot_code, market_id, day, vendor_name, amount, method, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (market_id, lot_code, day) DO UPDATE SET
           vendor_name = EXCLUDED.vendor_name, amount = EXCLUDED.amount,
           method = EXCLUDED.method, updated_at = now()`,
        [code, lot.market_id, date, vendor_name, rent, payment_method]
      );
    } else {
      await pool.query('DELETE FROM payments WHERE market_id=$1 AND lot_code=$2 AND day=$3', [lot.market_id, code, date]);
    }

    const lotActor = await currentUser(req);
    if (occupied && payment_status === 'paid') {
      await audit(lotActor, 'lot.payment',
        `บันทึกชำระค่าเช่าล็อค ${code} (${vendor_name || '—'}) ${rent} บาท · ${payment_method || 'cash'}`, mid, code);
    } else {
      await audit(lotActor, 'lot.update',
        `แก้ข้อมูลล็อค ${code} (${vendor_name || '—'}) · ${occupied ? (payment_status === 'unpaid' ? 'ยังไม่ชำระ' : 'ชำระแล้ว') : 'ว่าง'}`, mid, code);
    }
    res.json({ ok: true, code, date });
  } catch (err) {
    console.error('[lot save]', err);
    bad(res, 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* DELETE /api/market/lots/:code?date= — เคลียร์ข้อมูลล็อคของวันนั้น */
app.delete('/api/market/lots/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const date = String(req.query.date || '');
    if (!DAY_RE.test(date)) return bad(res, 'รูปแบบวันที่ไม่ถูกต้อง');
    const mid = num(req.query.market_id);
    if (!mid) return bad(res, 'ระบุ market_id ของล็อค');
    const lotRow = await pool.query('SELECT market_id FROM lots WHERE code=$1 AND market_id=$2', [code, mid]);
    if (!lotRow.rows.length) return bad(res, `ไม่พบล็อค ${code} ในตลาดนี้`, 404);
    if (!(await requireMarketAccess(req, res, lotRow.rows[0].market_id))) return;
    await pool.query('DELETE FROM payments WHERE market_id=$1 AND lot_code=$2 AND day=$3', [mid, code, date]);
    await pool.query('DELETE FROM lot_day WHERE market_id=$1 AND lot_code=$2 AND day=$3', [mid, code, date]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[lot clear]', err);
    bad(res, 'เคลียร์ข้อมูลล็อคไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* GET /api/market/payments?from=&to=&market_id= */
app.get('/api/market/payments', async (req, res) => {
  try {
    const mid = num(req.query.market_id, 1);
    if (!(await requireMarketAccess(req, res, mid))) return;
    const from = DAY_RE.test(String(req.query.from || '')) ? req.query.from : todayStr();
    const to = DAY_RE.test(String(req.query.to || '')) ? req.query.to : from;
    const { rows } = await pool.query(
      `SELECT to_char(p.day,'YYYY-MM-DD') AS day, p.lot_code, p.vendor_name,
              p.amount::float8 AS amount, p.method, p.updated_at
       FROM payments p JOIN lots l ON l.code = p.lot_code AND l.market_id = p.market_id
       WHERE l.market_id = $1 AND p.day BETWEEN $2 AND $3
       ORDER BY p.day DESC, p.lot_code`,
      [mid, from, to]
    );
    res.json({ from, to, count: rows.length, total: rows.reduce((s, r) => s + r.amount, 0), payments: rows });
  } catch (err) {
    console.error('[payments]', err);
    bad(res, 'โหลดประวัติการชำระเงินไม่สำเร็จ', 500);
  }
});

/* ============================================================
   ร้านค้า (Vendor + Customer)
   ============================================================ */
function shopPublic(s, extra = {}) {
  return {
    id: s.id, market_id: s.market_id, lot_code: s.lot_code, name: s.name,
    category: s.category, description: s.description, phone: s.phone, email: s.email,
    line_id: s.line_id, whatsapp: s.whatsapp, facebook: s.facebook, emoji: s.emoji,
    is_open: s.is_open, created_at: s.created_at,
    status: s.status || 'approved', deny_reason: s.deny_reason || '',
    owner_user_id: s.owner_user_id == null ? null : Number(s.owner_user_id),
    ...extra,
  };
}

/* GET /api/shops?market_id=&open_only=1 */
app.get('/api/shops', async (req, res) => {
  try {
    const mid = num(req.query.market_id);
    const openOnly = req.query.open_only === '1';
    /* v6: คนทั่วไป/ลูกค้าเห็นเฉพาะร้านที่อนุมัติแล้ว · ร้านค้าเห็นร้านตัวเอง (ทุกสถานะ) · ผจก.เห็นทั้งตลาดตัวเอง · แอดมินเห็นหมด */
    const u = await currentUser(req);
    let where = "s.status='approved'";
    const params = [];
    if (u && u.role === 'admin') where = 'TRUE';
    else if (u && u.role === 'vendor') { where = "(s.status='approved' OR s.owner_user_id=$1 OR s.id=$2)"; params.push(u.id, u.shop_id || 0); }
    else if (u && u.role === 'manager' && u.market_id) { where = "(s.status='approved' OR s.market_id=$1)"; params.push(u.market_id); }
    let q = `SELECT s.*, m.name AS market_name, m.address AS market_address, m.lat AS market_lat, m.lng AS market_lng,
              m.open_days, m.open_time, m.close_time, m.force_open, m.open_today,
              (SELECT COUNT(*)::int FROM menu_items mi WHERE mi.shop_id = s.id) AS menu_count
       FROM shops s JOIN markets m ON m.id = s.market_id WHERE (${where})`;
    if (mid) { params.push(mid); q += ` AND s.market_id=$${params.length}`; }
    q += ' ORDER BY m.sort_order, s.id';
    const { rows } = await pool.query(q, params);
    const list = rows
      .filter((s) => !openOnly || s.is_open)
      .map((s) => shopPublic(s, {
        market_name: s.market_name,
        market_address: s.market_address, market_lat: s.market_lat, market_lng: s.market_lng,
        market_open: marketOpenToday(s),
        market_schedule: scheduleText(s),
        menu_count: s.menu_count,
      }));
    res.json({ shops: list });
  } catch (err) {
    console.error('[shops]', err);
    bad(res, 'โหลดรายชื่อร้านไม่สำเร็จ', 500);
  }
});

/* GET /api/shops/:id */
app.get('/api/shops/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT s.*, m.name AS market_name, m.address AS market_address, m.lat AS market_lat, m.lng AS market_lng,
              m.open_days, m.open_time, m.close_time, m.force_open, m.open_today
       FROM shops s JOIN markets m ON m.id = s.market_id WHERE s.id=$1`, [id]
    );
    if (!rows.length) return bad(res, 'ไม่พบร้านนี้', 404);
    /* v6: ร้านที่ยังไม่อนุมัติ — เจ้าของ/ผจก.ของตลาด/แอดมินดูได้ คนอื่นไม่ได้ */
    if ((rows[0].status || 'approved') !== 'approved') {
      const u = await currentUser(req);
      const allowed =
        (u && u.role === 'admin') ||
        (u && u.role === 'manager' && Number(u.market_id) === Number(rows[0].market_id)) ||
        (u && u.role === 'vendor' && (Number(rows[0].owner_user_id) === Number(u.id) || Number(u.shop_id) === Number(id)));
      if (!allowed) return bad(res, 'ร้านนี้ยังไม่เปิดให้บริการ', 403);
    }
    res.json({ shop: shopPublic(rows[0], {
      market_name: rows[0].market_name,
      market_address: rows[0].market_address, market_lat: rows[0].market_lat, market_lng: rows[0].market_lng,
      market_open: marketOpenToday(rows[0]),
      market_schedule: scheduleText(rows[0]),
    }) });
  } catch (err) {
    console.error('[shop get]', err);
    bad(res, 'โหลดข้อมูลร้านไม่สำเร็จ', 500);
  }
});

/* ═══════════ v6: ระบบสมัคร-อนุมัติ ═══════════
   ผจก.ยื่นเปิดตลาด → แอดมินอนุมัติ · ร้านค้ายื่นเข้าร่วมตลาด → ผจก.ตลาดนั้น/แอดมินอนุมัติ
   ตลาด/ร้านที่ยังไม่อนุมัติ = ลูกค้ามองไม่เห็น */

/* GET /api/public/market-lots?market_id= — ผังล็อค+ว่าง/ถูกจอง (สำหรับฟอร์มสมัครร้าน) */
app.get('/api/public/market-lots', async (req, res) => {
  try {
    const mid = num(req.query.market_id);
    if (!mid) return bad(res, 'กรุณาระบุตลาด');
    const { rows: mk } = await pool.query('SELECT id, status FROM markets WHERE id=$1', [mid]);
    if (!mk.length || mk[0].status !== 'approved') return bad(res, 'ไม่พบตลาดนี้', 404);
    const { rows } = await pool.query(
      `SELECT l.code, l.row_label, l.position, l.rent_amount::float8 AS rent,
              s.name AS taken_by, s.status AS taken_status
       FROM lots l
       LEFT JOIN shops s ON s.market_id = l.market_id AND s.lot_code = l.code
                        AND s.status IN ('pending','approved')
       WHERE l.market_id = $1
       ORDER BY l.row_label, l.position`, [mid]
    );
    res.json({ lots: rows.map((r) => ({
      code: r.code, row_label: r.row_label, position: r.position,
      rent: Number(r.rent), taken: !!r.taken_by, taken_by: r.taken_by || '',
      taken_status: r.taken_status || '',
    })) });
  } catch (err) {
    console.error('[public lots]', err);
    bad(res, 'โหลดผังล็อคไม่สำเร็จ', 500);
  }
});

/* POST /api/apply/market — ผจก.ยื่นเปิดตลาดใหม่ (สร้างบัญชี+ตลาดสถานะ pending) */
app.post('/api/apply/market', async (req, res) => {
  try {
    const b = req.body || {};
    const m = b.market || {};
    /* — ผู้ยื่น: ผจก.เดิมที่ยังไม่มีตลาด (ถูกปฏิเสธแล้วยื่นใหม่) หรือสมัครใหม่ — */
    const u0 = await currentUser(req);
    if (u0 && !(u0.role === 'manager' && !u0.market_id))
      return bad(res, 'บัญชีนี้ยื่นเปิดตลาดไม่ได้ — แอดมินสร้างตลาดจากคอนโซลได้เลย / บัญชีอื่นกรุณาออกจากระบบก่อนสมัคร', 403);
    const isExisting = !!u0;
    let login = '', password = '', display_name = '', phone = '', email = '';
    if (isExisting) {
      display_name = u0.display_name; phone = u0.phone; email = u0.email;
    } else {
      login = cleanStr(b.login, 60).toLowerCase();
      password = String(b.password || '');
      display_name = cleanStr(b.display_name, 120);
      phone = normalizeThaiPhone(b.phone) || cleanStr(b.phone, 32);
      email = cleanStr(b.email, 120);
      if (!display_name) return bad(res, 'กรุณากรอกชื่อผู้จัดการตลาด');
      if (login.length < 3 || !/^[\w.\-@+]+$/.test(login))
        return bad(res, 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร (ภาษาอังกฤษ/ตัวเลข)');
      if (password.length < 4) return bad(res, 'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร');
      if (!phone) return bad(res, 'กรุณากรอกเบอร์โทรติดต่อ');
      const { rows: dup } = await pool.query('SELECT id FROM users WHERE login=$1', [login]);
      if (dup.length) return bad(res, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว');
    }
    /* — ข้อมูลตลาด — */
    const name = cleanStr(m.name, 120);
    const area = cleanStr(m.area, 160);
    if (!name) return bad(res, 'กรุณากรอกชื่อตลาด');
    if (!area) return bad(res, 'กรุณากรอกที่ตั้ง/ย่านของตลาด');
    const market_type = m.market_type === 'day' ? 'day' : 'night';
    const sched = readScheduleBody(m);
    const openDays = sched.open_days !== undefined ? sched.open_days : '0,1,2,3,4,5,6';
    const openTime = sched.open_time !== undefined ? sched.open_time : (market_type === 'day' ? '06:00' : '16:00');
    const closeTime = sched.close_time !== undefined ? sched.close_time : (market_type === 'day' ? '13:00' : '23:00');
    const payload = {
      market_name: name, area, market_type, address: cleanStr(m.address, 300),
      description: cleanStr(m.description, 500), open_days: openDays,
      open_time: openTime, close_time: closeTime,
      contact_name: display_name, phone, email,
    };
    /* — บัญชีผจก. (เดิม หรือ สร้างใหม่) — */
    let u;
    let token = null;
    if (isExisting) {
      u = u0;
      token = String(req.headers.authorization || '').startsWith('Bearer ')
        ? String(req.headers.authorization).slice(7).trim() : null;
    } else {
      const { rows: ur } = await pool.query(
        `INSERT INTO users (login, password_hash, role, display_name, phone, email, last_login_at)
         VALUES ($1,$2,'manager',$3,$4,$5, now()) RETURNING *`,
        [login, hashPassword(password), display_name, phone, email]
      );
      u = ur[0];
    }
    /* — สร้างตลาด (pending) + ผูกกับผจก. — */
    const { rows: max } = await pool.query('SELECT COALESCE(MAX(sort_order),0)::int AS m FROM markets');
    const { rows: mr } = await pool.query(
      `INSERT INTO markets (name, area, description, hours_text, emoji, open_days, open_time, close_time,
                            open_today, sort_order, address, status, market_type, applied_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, FALSE, $9,$10,'pending',$11,$12) RETURNING *`,
      [name, area, payload.description, market_type === 'day' ? `ตลาดกลางวัน ${openTime} – ${closeTime}` : `ตลาดกลางคืน ${openTime} – ${closeTime}`,
       cleanStr(m.emoji, 8) || (market_type === 'day' ? '☀️' : '🌙'),
       openDays, openTime, closeTime, max[0].m + 1, payload.address, market_type, u.id]
    );
    const mk = mr[0];
    await pool.query('UPDATE users SET market_id=$1 WHERE id=$2', [mk.id, u.id]);
    /* — บันทึกใบสมัคร — */
    const { rows: ar } = await pool.query(
      `INSERT INTO applications (kind, user_id, market_id, payload)
       VALUES ('market',$1,$2,$3) RETURNING id`,
      [u.id, mk.id, JSON.stringify(payload)]
    );
    if (!token) token = await startSession(u.id);
    await audit(u, 'apply.market', `ยื่นขอเปิดตลาด "${name}" (${market_type === 'day' ? 'กลางวัน' : 'กลางคืน'}) — รอแอดมินอนุมัติ`, mk.id, name);
    res.status(201).json({
      ok: true, token, user: { ...userPublic(u), market_id: mk.id },
      manager_market: { id: mk.id, name: mk.name, status: 'pending', market_type: mk.market_type },
      application: { id: ar[0].id, kind: 'market', status: 'pending' },
    });
  } catch (err) {
    console.error('[apply market]', err);
    bad(res, 'ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* POST /api/apply/shop — ร้านค้ายื่นเข้าร่วมตลาด (สมัครบัญชีใหม่ หรือร้านเดิมขยายตลาด) */
app.post('/api/apply/shop', async (req, res) => {
  try {
    const b = req.body || {};
    const mid = num(b.market_id);
    if (!mid) return bad(res, 'กรุณาเลือกตลาด');
    const { rows: mk } = await pool.query('SELECT id, name, status FROM markets WHERE id=$1', [mid]);
    if (!mk.length) return bad(res, 'ไม่พบตลาดนี้', 404);
    if (mk[0].status !== 'approved') return bad(res, 'ตลาดนี้ยังไม่เปิดรับร้านค้าใหม่', 403);

    /* — ผู้ยื่น: ล็อกอินอยู่ (ร้านเดิมขยายตลาด) หรือสมัครใหม่ — */
    let u = await currentUser(req);
    let token = null;
    if (u && u.role !== 'vendor')
      return bad(res, 'บัญชีนี้ไม่ใช่บัญชีร้านค้า — กรุณาออกจากระบบแล้วสมัครร้านค้าใหม่', 403);
    if (!u) {
      const login = cleanStr(b.login, 60).toLowerCase();
      const password = String(b.password || '');
      const display_name = cleanStr(b.display_name, 120);
      if (!display_name) return bad(res, 'กรุณากรอกชื่อเจ้าของร้าน');
      if (login.length < 3 || !/^[\w.\-@+]+$/.test(login))
        return bad(res, 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร (ภาษาอังกฤษ/ตัวเลข)');
      if (password.length < 4) return bad(res, 'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร');
      const { rows: dup } = await pool.query('SELECT id FROM users WHERE login=$1', [login]);
      if (dup.length) return bad(res, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว');
      const { rows: ur } = await pool.query(
        `INSERT INTO users (login, password_hash, role, display_name, phone, email, last_login_at)
         VALUES ($1,$2,'vendor',$3,$4,$5, now()) RETURNING *`,
        [login, hashPassword(password), display_name,
         normalizeThaiPhone(b.phone) || cleanStr(b.phone, 32), cleanStr(b.email, 120)]
      );
      u = ur[0];
      token = await startSession(u.id);
    }
    /* — ซ้ำ: มีคำขอ/ร้านในตลาดนี้อยู่แล้ว — */
    const { rows: dupShop } = await pool.query(
      `SELECT id, status FROM shops WHERE market_id=$1 AND (owner_user_id=$2 OR id=$3)
       AND status IN ('pending','approved')`,
      [mid, u.id, u.shop_id || 0]
    );
    if (dupShop.length)
      return bad(res, dupShop[0].status === 'pending'
        ? 'คุณมีคำขอรอพิจารณาอยู่ในตลาดนี้แล้ว'
        : 'คุณมีร้านอยู่ในตลาดนี้อยู่แล้ว', 409);
    /* — ล็อค: ต้องมีจริง + ไม่ถูกจอง — */
    const lot_code = cleanStr(b.lot_code, 10);
    if (lot_code) {
      const { rows: lot } = await pool.query('SELECT code FROM lots WHERE code=$1 AND market_id=$2', [lot_code, mid]);
      if (!lot.length) return bad(res, `ไม่พบล็อค ${lot_code} ในตลาดนี้`, 404);
      const { rows: taken } = await pool.query(
        `SELECT name FROM shops WHERE market_id=$1 AND lot_code=$2 AND status IN ('pending','approved')`,
        [mid, lot_code]
      );
      if (taken.length) return bad(res, `ล็อค ${lot_code} ถูกจองไปแล้ว (${taken[0].name}) — เลือกล็อคว่างอื่นได้ครับ`, 409);
    }
    /* — ข้อมูลร้าน — */
    const name = cleanStr(b.name, 120);
    if (!name) return bad(res, 'กรุณากรอกชื่อร้าน');
    const category = CATEGORIES.includes(b.category) ? b.category : 'food';
    const payload = {
      shop_name: name, category, lot_code, market_name: mk[0].name,
      description: cleanStr(b.description, 500), phone: cleanStr(b.phone, 32) || u.phone,
      email: cleanStr(b.email, 120) || u.email, line_id: cleanStr(b.line_id, 60),
      emoji: cleanStr(b.emoji, 8) || '🍽️',
    };
    const { rows: sr } = await pool.query(
      `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id,
                          whatsapp, facebook, emoji, is_open, status, owner_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'','',$9,TRUE,'pending',$10) RETURNING *`,
      [mid, lot_code, name, category, payload.description, payload.phone, payload.email,
       payload.line_id, payload.emoji, u.id]
    );
    /* shop_id หลัก: ถ้าไม่มี หรือ ร้านหลักเดิมไม่ได้ approved → ชี้ร้านล่าสุดที่ยื่น */
    await pool.query(
      `UPDATE users SET shop_id=$1 WHERE id=$2 AND (shop_id IS NULL OR shop_id NOT IN
        (SELECT id FROM shops WHERE owner_user_id=$2 AND status='approved'))`,
      [sr[0].id, u.id]
    );
    const { rows: ar } = await pool.query(
      `INSERT INTO applications (kind, user_id, market_id, shop_id, payload)
       VALUES ('shop',$1,$2,$3,$4) RETURNING id`,
      [u.id, mid, sr[0].id, JSON.stringify(payload)]
    );
    await audit(u, 'apply.shop', `ยื่นขอเปิดร้าน "${name}" ในตลาด "${mk[0].name}"${lot_code ? ` ล็อค ${lot_code}` : ''} — รอพิจารณา`, mid, name);
    const me = { ...u, shop_id: u.shop_id || sr[0].id };
    res.status(201).json({
      ok: true, token, user: userPublic(me),
      ...(await authExtras(me)),
      shop: shopPublic(sr[0], { market_name: mk[0].name }),
      application: { id: ar[0].id, kind: 'shop', status: 'pending' },
    });
  } catch (err) {
    console.error('[apply shop]', err);
    bad(res, 'ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* — รายการใบสมัคร (join ผู้ยื่น/ตลาด/ร้าน) — */
const APP_SELECT = `
  SELECT a.id, a.kind, a.status, a.payload, a.deny_reason, a.created_at, a.decided_at,
         u.id AS user_id, u.display_name AS applicant, u.login AS applicant_login,
         u.phone AS applicant_phone, u.email AS applicant_email,
         m.id AS market_id, m.name AS market_name, m.status AS market_status,
         m.market_type, m.area AS market_area, m.address AS market_address,
         s.id AS shop_id, s.name AS shop_name, s.lot_code, s.status AS shop_status
  FROM applications a
  JOIN users u ON u.id = a.user_id
  LEFT JOIN markets m ON m.id = a.market_id
  LEFT JOIN shops s ON s.id = a.shop_id
`;

/* GET /api/applications/mine — ใบสมัครของฉัน */
app.get('/api/applications/mine', async (req, res) => {
  const u = await requireUser(req, res);
  if (!u) return;
  const { rows } = await pool.query(
    APP_SELECT + ' WHERE a.user_id=$1 ORDER BY a.created_at DESC LIMIT 50', [u.id]
  );
  res.json({ applications: rows });
});

/* GET /api/admin/applications — ทุกใบสมัคร (แอดมิน) */
app.get('/api/admin/applications', async (req, res) => {
  const u = await requireUser(req, res, ['admin']);
  if (!u) return;
  const { rows } = await pool.query(APP_SELECT + ` ORDER BY (a.status='pending') DESC, a.created_at DESC LIMIT 200`);
  res.json({ applications: rows, pending: rows.filter((r) => r.status === 'pending').length });
});

/* GET /api/manager/applications — ใบสมัครร้านเข้าร่วมตลาดของฉัน (ผจก.) */
app.get('/api/manager/applications', async (req, res) => {
  const u = await requireUser(req, res, ['manager']);
  if (!u) return;
  const { rows } = await pool.query(
    APP_SELECT + ` WHERE a.kind='shop' AND a.market_id=$1 ORDER BY (a.status='pending') DESC, a.created_at DESC LIMIT 100`,
    [u.market_id || 0]
  );
  res.json({ applications: rows, pending: rows.filter((r) => r.status === 'pending').length });
});

/* — พิจารณาใบสมัคร: อนุมัติ/ปฏิเสธ — */
async function decideApplication(req, res, decision) {
  try {
    const u = await requireUser(req, res, ['admin', 'manager']);
    if (!u) return;
    const id = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM applications WHERE id=$1', [id]);
    if (!rows.length) return bad(res, 'ไม่พบใบสมัครนี้', 404);
    const a = rows[0];
    if (a.status !== 'pending') return bad(res, 'ใบสมัครนี้พิจารณาไปแล้ว', 409);
    /* ผจก.พิจารณาได้เฉพาะคำขอร้านในตลาดตัวเอง · ใบสมัครตลาดเป็นของแอดมิน */
    if (u.role === 'manager') {
      if (a.kind !== 'shop') return bad(res, 'เฉพาะแอดมินที่พิจารณาใบสมัครเปิดตลาดได้', 403);
      if (Number(a.market_id) !== Number(u.market_id))
        return bad(res, 'คำขอนี้ไม่ได้อยู่ในตลาดที่คุณดูแล', 403);
    }
    const reason = decision === 'denied' ? cleanStr((req.body || {}).reason, 300) : '';
    if (decision === 'denied' && !reason) return bad(res, 'กรุณาระบุเหตุผลที่ปฏิเสธ (จะแสดงให้ผู้สมัครเห็น)');

    if (a.kind === 'market') {
      const { rows: mk } = await pool.query('SELECT id, name FROM markets WHERE id=$1', [a.market_id]);
      if (!mk.length) return bad(res, 'ตลาดนี้ถูกลบไปแล้ว', 404);
      await pool.query("UPDATE markets SET status=$1, deny_reason=$2 WHERE id=$3", [decision, reason, a.market_id]);
      if (decision === 'denied') {
        /* คืนอิสระให้ผจก.ยื่นใหม่ */
        await pool.query('UPDATE users SET market_id=NULL WHERE id=$1 AND market_id=$2', [a.user_id, a.market_id]);
        await audit(u, 'market.deny', `ปฏิเสธใบสมัครตลาด "${mk[0].name}" เหตุผล: ${reason}`, a.market_id, mk[0].name);
      } else {
        await pool.query("UPDATE markets SET open_today=TRUE WHERE id=$1", [a.market_id]);
        await audit(u, 'market.approve', `อนุมัติตลาด "${mk[0].name}" — เผยแพร่ให้ลูกค้าเห็นแล้ว`, a.market_id, mk[0].name);
      }
    } else {
      const { rows: sh } = await pool.query('SELECT id, name, market_id FROM shops WHERE id=$1', [a.shop_id]);
      if (!sh.length) return bad(res, 'ร้านนี้ถูกลบไปแล้ว', 404);
      await pool.query("UPDATE shops SET status=$1, deny_reason=$2 WHERE id=$3", [decision, reason, a.shop_id]);
      if (decision === 'denied') {
        /* shop_id หลัก: ชี้ไปที่ร้าน approved แรกของเจ้าของ ไม่มีก็ NULL (คำนวณใหม่ทุกครั้ง) */
        await pool.query(
          `UPDATE users SET shop_id = COALESCE((
             SELECT s.id FROM shops s WHERE s.owner_user_id = users.id AND s.status='approved'
             ORDER BY s.created_at LIMIT 1), NULL)
           WHERE id=$1`, [a.user_id]);
        await audit(u, 'shop.deny', `ปฏิเสธร้าน "${sh[0].name}" เหตุผล: ${reason}`, sh[0].market_id, sh[0].name);
      } else {
        await pool.query(
          `UPDATE users SET shop_id=$2 WHERE id=$1 AND (shop_id IS NULL OR shop_id NOT IN
            (SELECT id FROM shops WHERE owner_user_id=$1 AND status='approved'))`, [a.user_id, a.shop_id]);
        await audit(u, 'shop.approve', `อนุมัติร้าน "${sh[0].name}" เข้าร่วมตลาด — เปิดให้ลูกค้าเห็นแล้ว`, sh[0].market_id, sh[0].name);
      }
    }
    await pool.query(
      'UPDATE applications SET status=$1, deny_reason=$2, decided_by=$3, decided_at=now() WHERE id=$4',
      [decision, reason, u.id, id]
    );
    res.json({ ok: true, status: decision });
  } catch (err) {
    console.error('[application decide]', err);
    bad(res, 'พิจารณาใบสมัครไม่สำเร็จ กรุณาลองใหม่', 500);
  }
}
app.post('/api/applications/:id/approve', (req, res) => decideApplication(req, res, 'approved'));
app.post('/api/applications/:id/deny', (req, res) => decideApplication(req, res, 'denied'));

/* POST /api/shops — เปิดร้านใหม่ (ผจก.=ในตลาดตัวเอง / แอดมิน) */
app.post('/api/shops', async (req, res) => {
  try {
    const b = req.body || {};
    const mid = num(b.market_id);
    if (!mid) return bad(res, 'กรุณาเลือกตลาด');
    const u = await requireUser(req, res, ['admin', 'vendor', 'manager']);
    if (!u) return;
    /* v6: ร้านค้าเข้าตลาดผ่าน "ใบสมัคร" แล้วผจก./แอดมินอนุมัติเท่านั้น */
    if (u.role === 'vendor')
      return bad(res, 'ร้านค้าเข้าร่วมตลาดผ่านแบบฟอร์มสมัคร (รอผจก.ตลาดหรือแอดมินอนุมัติ) — เปิดจากหน้า "เลือกตลาด" ได้เลยครับ', 403);
    if (u.role === 'manager' && Number(u.market_id) !== mid)
      return bad(res, 'เปิดร้านได้เฉพาะในตลาดที่คุณดูแล', 403);
    const { rows: mk } = await pool.query('SELECT id FROM markets WHERE id=$1', [mid]);
    if (!mk.length) return bad(res, 'ไม่พบตลาดนี้', 404);
    const name = cleanStr(b.name, 120);
    if (!name) return bad(res, 'กรุณากรอกชื่อร้าน');
    const category = CATEGORIES.includes(b.category) ? b.category : 'food';
    const lot_code = cleanStr(b.lot_code, 10);
    if (lot_code) {
      const { rows: lot } = await pool.query(
        'SELECT code FROM lots WHERE code=$1 AND market_id=$2', [lot_code, mid]
      );
      if (!lot.length) return bad(res, `ไม่พบล็อค ${lot_code} ในตลาดนี้`);
      const { rows: taken } = await pool.query(
        `SELECT name FROM shops WHERE market_id=$1 AND lot_code=$2 AND status IN ('pending','approved')`, [mid, lot_code]);
      if (taken.length) return bad(res, `ล็อค ${lot_code} ถูกใช้/จองอยู่แล้ว (${taken[0].name})`, 409);
    }
    const { rows } = await pool.query(
      `INSERT INTO shops (market_id, lot_code, name, category, description, phone, email, line_id, whatsapp, facebook, emoji, is_open)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [mid, lot_code, name, category, cleanStr(b.description, 500), cleanStr(b.phone, 32),
       cleanStr(b.email, 120), cleanStr(b.line_id, 60), cleanStr(b.whatsapp, 32),
       cleanStr(b.facebook, 120), cleanStr(b.emoji, 8) || '🍽️',
       b.is_open === undefined ? true : Boolean(b.is_open)]
    );
    /* ร้านค้าเปิดร้านครั้งแรก → ผูกร้านกับบัญชี */
    if (u.role === 'vendor' && !u.shop_id) {
      await pool.query('UPDATE users SET shop_id=$1 WHERE id=$2', [rows[0].id, u.id]);
      u.shop_id = rows[0].id;
    }
    await audit(u, 'shop.create', `เปิดร้าน "${name}" (ล็อค ${lot_code || '—'})`, mid, name);
    res.status(201).json({ ok: true, shop: shopPublic(rows[0]) });
  } catch (err) {
    console.error('[shop create]', err);
    bad(res, 'เปิดร้านไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* PUT /api/shops/:id — แก้โปรไฟล์ร้าน */
app.put('/api/shops/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!(await requireShopAccess(req, res, id, { allowManager: true }))) return;
    const { rows: cur } = await pool.query('SELECT * FROM shops WHERE id=$1', [id]);
    if (!cur.length) return bad(res, 'ไม่พบร้านนี้', 404);
    const b = req.body || {};
    const pick = (key, max, fallback) =>
      b[key] !== undefined ? cleanStr(b[key], max) : fallback;
    const name = pick('name', 120, cur[0].name);
    if (!name) return bad(res, 'ชื่อร้านห้ามว่าง');
    const category = CATEGORIES.includes(b.category) ? b.category : cur[0].category;
    const is_open = b.is_open !== undefined ? Boolean(b.is_open) : cur[0].is_open;
    const { rows } = await pool.query(
      `UPDATE shops SET name=$2, category=$3, description=$4, phone=$5, email=$6,
        line_id=$7, whatsapp=$8, facebook=$9, emoji=$10, lot_code=$11, is_open=$12
       WHERE id=$1 RETURNING *`,
      [id, name, category, pick('description', 500, cur[0].description),
       pick('phone', 32, cur[0].phone), pick('email', 120, cur[0].email),
       pick('line_id', 60, cur[0].line_id), pick('whatsapp', 32, cur[0].whatsapp),
       pick('facebook', 120, cur[0].facebook), pick('emoji', 8, cur[0].emoji) || '🍽️',
       pick('lot_code', 10, cur[0].lot_code), is_open]
    );
    const actor3 = await currentUser(req);
    await audit(actor3, 'shop.update', `แก้ข้อมูลร้าน "${name}"${is_open ? '' : ' (ปิดร้านชั่วคราว)'}`, cur[0].market_id, name);
    res.json({ ok: true, shop: shopPublic(rows[0]) });
  } catch (err) {
    console.error('[shop update]', err);
    bad(res, 'อัปเดตข้อมูลร้านไม่สำเร็จ', 500);
  }
});

/* DELETE /api/shops/:id (ผจก.ตลาด / แอดมิน) */
app.delete('/api/shops/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!(await requireShopAccess(req, res, id, { allowManager: true }))) return;
    const { rows: shName } = await pool.query('SELECT name, market_id FROM shops WHERE id=$1', [id]);
    const { rowCount } = await pool.query('DELETE FROM shops WHERE id=$1', [id]);
    if (!rowCount) return bad(res, 'ไม่พบร้านนี้', 404);
    const actor4 = await currentUser(req);
    await audit(actor4, 'shop.delete', `ลบร้าน "${shName[0] ? shName[0].name : id}"`, shName[0] ? shName[0].market_id : null, shName[0] ? shName[0].name : String(id));
    res.json({ ok: true });
  } catch (err) {
    console.error('[shop delete]', err);
    bad(res, 'ลบร้านไม่สำเร็จ', 500);
  }
});

/* ============================================================
   เมนูร้านค้า
   ============================================================ */

/* GET /api/shops/:id/menu */
app.get('/api/shops/:id/menu', async (req, res) => {
  try {
    const sid = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT id, name, price::float8 AS price, available, emoji, image, sort_order, stock, created_at
       FROM menu_items WHERE shop_id=$1 ORDER BY sort_order, id`, [sid]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error('[menu]', err);
    bad(res, 'โหลดเมนูไม่สำเร็จ', 500);
  }
});

/* POST /api/shops/:id/menu — เพิ่มเมนู */
app.post('/api/shops/:id/menu', async (req, res) => {
  try {
    const sid = Number(req.params.id);
    if (!(await requireShopAccess(req, res, sid))) return;
    const { rows: sh } = await pool.query('SELECT id FROM shops WHERE id=$1', [sid]);
    if (!sh.length) return bad(res, 'ไม่พบร้านนี้', 404);
    const b = req.body || {};
    const name = cleanStr(b.name, 120);
    if (!name) return bad(res, 'กรุณากรอกชื่อเมนู');
    const price = num(b.price);
    if (price === null || price < 0 || price > 1_000_000)
      return bad(res, 'ราคาต้องเป็นตัวเลข 0 ถึง 1,000,000');
    const image = typeof b.image === 'string' && b.image.startsWith('data:image/') ? b.image.slice(0, 400_000) : '';
    const emoji = cleanStr(b.emoji, 8) || '🍽️';
    const available = b.available === undefined ? true : Boolean(b.available);
    let stock = null;
    if (b.stock !== undefined && b.stock !== null && b.stock !== '') {
      stock = Number(b.stock);
      if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return bad(res, 'สต็อกต้องเป็นจำนวนเต็ม 0 ขึ้นไป');
    }
    const { rows: max } = await pool.query(
      'SELECT COALESCE(MAX(sort_order),0)::int AS m FROM menu_items WHERE shop_id=$1', [sid]
    );
    const { rows } = await pool.query(
      `INSERT INTO menu_items (shop_id, name, price, available, emoji, image, sort_order, stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, price::float8 AS price, available, emoji, image, sort_order, stock, created_at`,
      [sid, name, price, available && (stock === null || stock > 0), emoji, image, max[0].m + 1, stock]
    );
    const actor0 = await currentUser(req);
    await audit(actor0, 'menu.create', `เพิ่มเมนู "${name}" ราคา ${price} บาท${stock !== null ? ` (สต็อก ${stock})` : ''}`, null, name);
    res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error('[menu add]', err);
    bad(res, 'เพิ่มเมนูไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* PUT /api/menu/:id — แก้เมนู */
app.put('/api/menu/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: cur } = await pool.query('SELECT * FROM menu_items WHERE id=$1', [id]);
    if (!cur.length) return bad(res, 'ไม่พบเมนูนี้', 404);
    if (!(await requireShopAccess(req, res, cur[0].shop_id))) return;
    const b = req.body || {};

    let name = cur[0].name;
    if (b.name !== undefined) {
      name = cleanStr(b.name, 120);
      if (!name) return bad(res, 'ชื่อเมนูห้ามว่าง');
    }
    let price = Number(cur[0].price);
    if (b.price !== undefined) {
      const p = num(b.price);
      if (p === null || p < 0 || p > 1_000_000) return bad(res, 'ราคาต้องเป็นตัวเลข 0 ถึง 1,000,000');
      price = p;
    }
    let available = cur[0].available;
    if (b.available !== undefined) available = Boolean(b.available);
    let emoji = cur[0].emoji;
    if (b.emoji !== undefined) emoji = cleanStr(b.emoji, 8) || '🍽️';
    let image = cur[0].image;
    if (b.image !== undefined)
      image = typeof b.image === 'string' && b.image.startsWith('data:image/') ? b.image.slice(0, 400_000) : '';
    let stock = cur[0].stock;
    if (b.stock !== undefined) {
      if (b.stock === null || b.stock === '') stock = null;
      else {
        const s = Number(b.stock);
        if (!Number.isInteger(s) || s < 0 || s > 100000) return bad(res, 'สต็อกต้องเป็นจำนวนเต็ม 0 ขึ้นไป');
        stock = s;
      }
    }

    const { rows } = await pool.query(
      `UPDATE menu_items SET name=$2, price=$3, available=$4, emoji=$5, image=$6, stock=$7 WHERE id=$1
       RETURNING id, name, price::float8 AS price, available, emoji, image, sort_order, stock, created_at`,
      [id, name, price, available && (stock === null || stock > 0), emoji, image, stock]
    );
    const actor1 = await currentUser(req);
    await audit(actor1, 'menu.update', `แก้เมนู "${name}" ราคา ${price} บาท${stock !== null ? ` สต็อก ${stock}` : ''} ${available ? '' : '(หยุดขาย)'}`, null, name);
    res.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error('[menu update]', err);
    bad(res, 'อัปเดตเมนูไม่สำเร็จ', 500);
  }
});

/* DELETE /api/menu/:id */
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cur = await pool.query('SELECT shop_id FROM menu_items WHERE id=$1', [id]);
    if (cur.rows.length && !(await requireShopAccess(req, res, cur.rows[0].shop_id))) return;
    const { rowCount } = await pool.query('DELETE FROM menu_items WHERE id=$1', [id]);
    if (!rowCount) return bad(res, 'ไม่พบเมนูนี้', 404);
    const actor2 = await currentUser(req);
    await audit(actor2, 'menu.delete', `ลบเมนู "${cur.rows[0].name || id}"`, null, String(cur.rows[0].name || id));
    res.json({ ok: true });
  } catch (err) {
    console.error('[menu delete]', err);
    bad(res, 'ลบเมนูไม่สำเร็จ', 500);
  }
});

/* ============================================================
   ออเดอร์ (Vendor จัดการ / Customer ส่ง+ติดตาม)
   ============================================================ */
function orderJSON(o, items, extra = {}) {
  return {
    id: o.id, shop_id: o.shop_id, customer_id: o.customer_id,
    customer_name: o.customer_name, customer_contact: o.customer_contact,
    is_guest: !!o.is_guest,
    note: o.note, status: o.status, total: Number(o.total),
    created_at: o.created_at, updated_at: o.updated_at, completed_at: o.completed_at,
    items, ...extra,
  };
}

/* helper: ตรวจ + คิดรายการอาหารจากเมนูของร้าน */
async function resolveItems(client, shopId, rawItems, { requireAvailable = true } = {}) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw Object.assign(new Error('กรุณาเลือกอย่างน้อย 1 รายการอาหาร'), { status: 400 });
  }
  const clean = [];
  for (const it of rawItems) {
    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {
      throw Object.assign(new Error('รายการอาหารหรือจำนวนไม่ถูกต้อง'), { status: 400 });
    }
    if (it.menu_item_id == null) {
      const name = cleanStr(it.name, 120);
      const price = num(it.unit_price);
      if (!name || price === null || price < 0) {
        throw Object.assign(new Error('มีรายการอาหารที่ข้อมูลไม่ถูกต้อง'), { status: 400 });
      }
      clean.push({ legacy: { name, price, emoji: cleanStr(it.emoji, 8) || '🍽️' }, qty });
      continue;
    }
    const id = Number(it.menu_item_id);
    if (!Number.isInteger(id) || id <= 0) {
      throw Object.assign(new Error('รายการอาหารหรือจำนวนไม่ถูกต้อง'), { status: 400 });
    }
    clean.push({ id, qty });
  }
  const ids = clean.filter((c) => c.id).map((c) => c.id);
  const byId = new Map();
  if (ids.length) {
    const { rows: menuRows } = await client.query(
      `SELECT id, name, price, available, emoji, shop_id, stock FROM menu_items WHERE id = ANY($1::int[])`,
      [ids]
    );
    for (const m of menuRows) byId.set(m.id, m);
  }
  let total = 0;
  const resolved = [];
  for (const c of clean) {
    if (c.legacy) {
      total += c.legacy.price * c.qty;
      resolved.push({ m: { id: null, name: c.legacy.name, price: c.legacy.price, emoji: c.legacy.emoji }, qty: c.qty });
      continue;
    }
    const m = byId.get(c.id);
    if (!m) throw Object.assign(new Error('มีรายการอาหารที่ไม่มีในเมนูแล้ว กรุณาลองใหม่'), { status: 400 });
    if (m.shop_id !== shopId)
      throw Object.assign(new Error('มีรายการอาหารที่ไม่ได้มาจากร้านนี้'), { status: 400 });
    if (requireAvailable && !m.available) {
      throw Object.assign(new Error(`「${m.name}」 สินค้าหมดแล้ว`), { status: 400 });
    }
    if (requireAvailable && m.stock != null && m.stock < c.qty) {
      throw Object.assign(
        new Error(m.stock <= 0 ? `「${m.name}」 สินค้าหมดแล้ว` : `「${m.name}」 เหลือสต็อก ${m.stock} ชิ้นเท่านั้น`),
        { status: 400 }
      );
    }
    total += Number(m.price) * c.qty;
    resolved.push({ m, qty: c.qty });
  }
  return { resolved, total };
}

/* GET /api/orders?shop_id= (ร้านค้าตัวเอง / ผจก.ตลาด / แอดมิน) */
app.get('/api/orders', async (req, res) => {
  try {
    const shopId = num(req.query.shop_id);
    if (!shopId) return bad(res, 'ระบุ shop_id');
    if (!(await requireShopAccess(req, res, shopId, { allowManager: true }))) return;

    const { rows } = await pool.query(
      `SELECT o.*, s.name AS shop_name, s.emoji AS shop_emoji, s.lot_code AS shop_lot,
              m.name AS market_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'status', e.status, 'text', e.text, 'created_at', e.created_at
                 ) ORDER BY e.id) FROM order_events e WHERE e.order_id = o.id), '[]'
              ) AS events,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'menu_item_id', oi.menu_item_id, 'name', oi.name, 'emoji', oi.emoji,
                   'unit_price', oi.unit_price::float8, 'qty', oi.qty
                 ) ORDER BY oi.id) FROM order_items oi WHERE oi.order_id = o.id), '[]'
              ) AS items
       FROM orders o
       JOIN shops s ON s.id = o.shop_id
       JOIN markets m ON m.id = s.market_id
       WHERE o.shop_id = $1
       ORDER BY o.id DESC`,
      [shopId]
    );
    res.json({
      orders: rows.map((o) => orderJSON(o, o.items, {
        shop_name: o.shop_name, shop_emoji: o.shop_emoji, shop_lot: o.shop_lot,
        market_name: o.market_name, events: o.events,
      })),
    });
  } catch (err) {
    console.error('[orders]', err);
    bad(res, 'โหลดออเดอร์ไม่สำเร็จ', 500);
  }
});

/* GET /api/orders/mine — ออเดอร์ของลูกค้าที่ล็อกอินอยู่ */
app.get('/api/orders/mine', async (req, res) => {
  try {
    const u = await requireUser(req, res, ['customer', 'admin']);
    if (!u) return;
    const { rows } = await pool.query(
      `SELECT o.*, s.name AS shop_name, s.emoji AS shop_emoji, s.lot_code AS shop_lot,
              m.name AS market_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'status', e.status, 'text', e.text, 'created_at', e.created_at
                 ) ORDER BY e.id) FROM order_events e WHERE e.order_id = o.id), '[]'
              ) AS events,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'menu_item_id', oi.menu_item_id, 'name', oi.name, 'emoji', oi.emoji,
                   'unit_price', oi.unit_price::float8, 'qty', oi.qty
                 ) ORDER BY oi.id) FROM order_items oi WHERE oi.order_id = o.id), '[]'
              ) AS items
       FROM orders o
       JOIN shops s ON s.id = o.shop_id
       JOIN markets m ON m.id = s.market_id
       WHERE o.customer_user_id = $1
       ORDER BY o.id DESC`,
      [u.id]
    );
    res.json({
      orders: rows.map((o) => orderJSON(o, o.items, {
        shop_name: o.shop_name, shop_emoji: o.shop_emoji, shop_lot: o.shop_lot,
        market_name: o.market_name, events: o.events,
      })),
    });
  } catch (err) {
    console.error('[orders mine]', err);
    bad(res, 'โหลดออเดอร์ไม่สำเร็จ', 500);
  }
});

/* POST /api/orders — ส่งออเดอร์ (ลูกค้า / ร้านค้า POS หน้าร้าน / แอดมิน) */
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};
    const u = await currentUser(req);
    /* แขกสั่งได้ — แต่ต้องแสดงตัวตนด้วยชื่อ + เบอร์โทรจริง (กันสั่งแล้วหาย) */
    const isGuest = !u;
    let guestPhone = '';
    if (isGuest) {
      guestPhone = normalizeThaiPhone(b.guest_phone);
      const guestName = cleanStr(b.customer_name, 80);
      if (!guestName || guestName.length < 2) {
        await client.query('ROLLBACK');
        return bad(res, 'กรุณากรอกชื่อของคุณ (ร้านใช้เรียกเมื่ออาหารพร้อม)', 400);
      }
      if (!guestPhone) {
        await client.query('ROLLBACK');
        return bad(res, 'กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อยืนยันว่าติดต่อคุณได้จริง', 400);
      }
    }
    if (u && !['customer', 'vendor', 'admin'].includes(u.role)) {
      await client.query('ROLLBACK');
      return bad(res, 'บัญชีของคุณไม่สามารถส่งออเดอร์ได้', 403);
    }
    const shopId = num(b.shop_id);
    if (!shopId) { await client.query('ROLLBACK'); return bad(res, 'กรุณาระบุร้าน'); }
    const { rows: sh } = await client.query(
      'SELECT id, is_open, market_id, status, owner_user_id FROM shops WHERE id=$1', [shopId]
    );
    if (!sh.length) { await client.query('ROLLBACK'); return bad(res, 'ไม่พบร้านนี้', 404); }
    if (u && u.role === 'vendor'
        && Number(sh[0].owner_user_id) !== Number(u.id) && Number(u.shop_id) !== shopId) {
      await client.query('ROLLBACK');
      return bad(res, 'รับออเดอร์ได้เฉพาะร้านของตัวเอง', 403);
    }
    if ((sh[0].status || 'approved') !== 'approved') {
      await client.query('ROLLBACK');
      return bad(res, 'ร้านนี้ยังไม่ได้รับการอนุมัติ ยังไม่เปิดรับออเดอร์');
    }
    if (!sh[0].is_open) { await client.query('ROLLBACK'); return bad(res, 'ร้านนี้ปิดอยู่ในขณะนี้ ไม่รับออเดอร์'); }
    const { rows: mk } = await client.query('SELECT open_today FROM markets WHERE id=$1', [sh[0].market_id]);
    if (mk.length && !mk[0].open_today) { await client.query('ROLLBACK'); return bad(res, 'ตลาดนี้ปิดทำการวันนี้ ไม่รับออเดอร์'); }

    const isAppCustomer = !isGuest && u.role === 'customer';
    const customer_name = cleanStr(b.customer_name, 80)
      || (isAppCustomer ? u.display_name : '')
      || (isGuest ? cleanStr(b.customer_name, 80) : '');
    const customer_contact = cleanStr(b.customer_contact, 60)
      || (isAppCustomer ? (u.phone || u.login) : '')
      || (isGuest ? guestPhone : '');
    const note = cleanStr(b.note, 300);
    const { resolved, total } = await resolveItems(client, shopId, b.items);

    const trackToken = isGuest
      ? Array.from(crypto.randomBytes(6)).map((x) => x.toString(16).padStart(2, '0')).join('')
      : '';
    const { rows: created } = await client.query(
      `INSERT INTO orders (shop_id, customer_user_id, customer_id, customer_name, customer_contact, note, status, total, is_guest, track_token)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9) RETURNING id`,
      [shopId, isAppCustomer ? u.id : null,
       isAppCustomer ? `u:${u.id}` : (isGuest ? `g:${guestPhone}` : ''),
       customer_name, customer_contact, note, total, isGuest, trackToken]
    );
    const orderId = created[0].id;
    for (const { m, qty } of resolved) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, emoji, unit_price, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, m.id, m.name, m.emoji, m.price, qty]
      );
      /* ตัดสต็อก (ถ้าเมนูตั้งจำนวนสต็อกไว้) — ถึง 0 ปิดขายอัตโนมัติ */
      if (m.stock != null) {
        const { rows: st } = await client.query(
          `UPDATE menu_items SET stock = stock - $2, available = (stock - $2 > 0)
           WHERE id=$1 AND stock IS NOT NULL RETURNING stock`,
          [m.id, qty]
        );
        if (st.length && st[0].stock <= 0) {
          await client.query('UPDATE menu_items SET available=FALSE WHERE id=$1', [m.id]);
        }
      }
    }
    await client.query(
      `INSERT INTO order_events (order_id, status, text) VALUES ($1,'pending',$2)`,
      [orderId, isAppCustomer ? 'ลูกค้าส่งออเดอร์ผ่านแอป' : (isGuest ? 'ลูกค้าแขกส่งออเดอร์ผ่านแอป' : 'รับออเดอร์หน้าร้าน')]
    );
    await client.query('COMMIT');
    await audit(
      isGuest ? { id: null, display_name: `${customer_name} (แขก ${guestPhone})`, role: 'guest' } : u,
      'order.create',
      `ออเดอร์ #${orderId} ยอด ${total} บาท (${isGuest ? 'แขก' : u.role === 'customer' ? 'สมาชิก' : 'POS หน้าร้าน'})`,
      sh[0].market_id,
      `#${orderId}`
    );
    res.status(201).json({ ok: true, id: orderId, total, track_token: trackToken });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[order create]', err.message);
    return bad(res, err.status ? err.message : 'ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่', err.status || 500);
  } finally {
    client.release();
  }
});

/* PUT /api/orders/:id — ย้ายสถานะ / แก้ไขรายละเอียด */
app.put('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    await client.query('BEGIN');

    const { rows: cur } = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [id]);
    if (!cur.length) {
      await client.query('ROLLBACK');
      return bad(res, 'ไม่พบออเดอร์นี้', 404);
    }
    const au = await requireUser(req, res, ['admin', 'vendor']);
    if (!au) { await client.query('ROLLBACK'); return; }
    if (au.role === 'vendor' && Number(au.shop_id) !== Number(cur[0].shop_id)) {
      await client.query('ROLLBACK');
      return bad(res, 'แก้ไขได้เฉพาะออเดอร์ของร้านตัวเอง', 403);
    }

    let total = Number(cur[0].total);
    if (b.items !== undefined) {
      const { resolved, total: newTotal } = await resolveItems(client, cur[0].shop_id, b.items);
      total = newTotal;
      await client.query('DELETE FROM order_items WHERE order_id=$1', [id]);
      for (const { m, qty } of resolved) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, emoji, unit_price, qty)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, m.id, m.name, m.emoji, m.price, qty]
        );
      }
    }

    let status = cur[0].status;
    const statusChanged = b.status !== undefined && b.status !== cur[0].status;
    if (b.status !== undefined) {
      if (!ORDER_STATUSES.includes(b.status)) {
        await client.query('ROLLBACK');
        return bad(res, 'สถานะออเดอร์ไม่ถูกต้อง');
      }
      status = b.status;
    }

    const customer_name = b.customer_name !== undefined
      ? cleanStr(b.customer_name, 80) : cur[0].customer_name;
    const customer_contact = b.customer_contact !== undefined
      ? cleanStr(b.customer_contact, 60) : cur[0].customer_contact;
    const note = b.note !== undefined
      ? cleanStr(b.note, 300) : cur[0].note;

    await client.query(
      `UPDATE orders SET status=$2, customer_name=$3, customer_contact=$4, note=$5, total=$6, updated_at=now(),
        completed_at = CASE WHEN $2='completed' THEN COALESCE(completed_at, now()) ELSE NULL END
       WHERE id=$1`,
      [id, status, customer_name, customer_contact, note, total]
    );
    if (statusChanged) {
      await client.query(
        `INSERT INTO order_events (order_id, status, text) VALUES ($1,$2,$3)`,
        [id, status, EVENT_TEXT[status]]
      );
    }
    await client.query('COMMIT');
    if (statusChanged) {
      const actor = await currentUser(req);
      await audit(actor, 'order.status',
        `ออเดอร์ #${id} → ${EVENT_TEXT[status] || status}`, cur[0].shop_id, `#${id}`);
    }
    res.json({ ok: true, id, status, total });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[order update]', err.message);
    bad(res, err.status ? err.message : 'อัปเดตออเดอร์ไม่สำเร็จ', err.status || 500);
  } finally {
    client.release();
  }
});

/* DELETE /api/orders/:id */
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cur = await pool.query('SELECT shop_id FROM orders WHERE id=$1', [id]);
    if (cur.rows.length && !(await requireShopAccess(req, res, cur.rows[0].shop_id))) return;
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id=$1', [id]);
    if (!rowCount) return bad(res, 'ไม่พบออเดอร์นี้', 404);
    const actor = await currentUser(req);
    await audit(actor, 'order.delete', `ลบออเดอร์ #${id}`, cur.rows[0].shop_id, `#${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[order delete]', err);
    bad(res, 'ลบออเดอร์ไม่สำเร็จ', 500);
  }
});

/* GET /api/orders/:id/events — ไทม์ไลน์ */
app.get('/api/orders/:id/events', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cur = await pool.query('SELECT shop_id, customer_user_id FROM orders WHERE id=$1', [id]);
    if (cur.rows.length) {
      const u = await currentUser(req);
      const isOwner = u && cur.rows[0].customer_user_id && u.id === cur.rows[0].customer_user_id;
      if (!isOwner && !(await requireShopAccess(req, res, cur.rows[0].shop_id, { allowManager: true }))) return;
    }
    const { rows } = await pool.query(
      'SELECT status, text, created_at FROM order_events WHERE order_id=$1 ORDER BY id', [id]
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('[events]', err);
    bad(res, 'โหลดไทม์ไลน์ไม่สำเร็จ', 500);
  }
});

/* ============================================================
   คอนโซลแอดมิน (เจ้าของระบบ) — สถิติ + จัดการบัญชี + ข้อมูลลูกค้า
   ============================================================ */

/* GET /api/orders/track/:id?token= — ติดตามออเดอร์โดยไม่ต้องล็อกอิน (แขกใช้ track_token) */
app.get('/api/orders/track/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const token = String(req.query.token || '');
    const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1', [id]);
    if (!rows.length) return bad(res, 'ไม่พบออเดอร์นี้', 404);
    const o = rows[0];
    const authorized = !!(o.track_token && token && o.track_token === token);
    if (!authorized) {
      const u = await currentUser(req);
      const mine = u && (o.customer_user_id === u.id || u.role === 'admin'
        || (u.role === 'vendor' && Number(u.shop_id) === o.shop_id));
      if (!mine) return bad(res, 'รหัสติดตามออเดอร์ไม่ถูกต้อง', 403);
    }
    const { rows: items } = await pool.query(
      'SELECT menu_item_id, name, emoji, unit_price, qty FROM order_items WHERE order_id=$1', [id]
    );
    const { rows: events } = await pool.query(
      'SELECT status, text, created_at FROM order_events WHERE order_id=$1 ORDER BY id', [id]
    );
    const { rows: sh } = await pool.query(
      `SELECT s.name AS shop_name, s.emoji AS shop_emoji, m.name AS market_name
       FROM shops s JOIN markets m ON m.id=s.market_id WHERE s.id=$1`, [o.shop_id]
    );
    res.json({
      order: {
        id: o.id, shop_id: o.shop_id, status: o.status, total: Number(o.total), note: o.note,
        is_guest: o.is_guest, customer_name: o.customer_name, customer_contact: o.customer_contact,
        created_at: o.created_at, updated_at: o.updated_at, completed_at: o.completed_at,
        shop_name: sh[0] ? sh[0].shop_name : '', shop_emoji: sh[0] ? sh[0].shop_emoji : '🍽️',
        market_name: sh[0] ? sh[0].market_name : '',
        items: items.map((i) => ({ menu_item_id: i.menu_item_id, name: i.name, emoji: i.emoji, price: Number(i.unit_price), qty: i.qty })),
      },
      events,
    });
  } catch (err) {
    console.error('[order track]', err);
    bad(res, 'โหลดออเดอร์ไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/stats — ภาพรวมทั้งระบบ */
app.get('/api/admin/stats', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const today = todayStr();

    const [mk, us, sh, oToday, oAll, rToday, rAll] = await Promise.all([
      pool.query(`SELECT m.*,
                    (SELECT display_name FROM users WHERE market_id = m.id AND role='manager' LIMIT 1) AS manager
                  FROM markets m ORDER BY m.sort_order, m.id`),
      pool.query(`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role`),
      pool.query(`SELECT market_id, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE is_open)::int AS open FROM shops GROUP BY market_id`),
      pool.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(total),0)::float8 AS gmv FROM orders WHERE (created_at AT TIME ZONE 'Asia/Bangkok')::date = $1`, [today]),
      pool.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(total),0)::float8 AS gmv FROM orders`),
      pool.query(`SELECT COALESCE(SUM(p.amount),0)::float8 AS total FROM payments p WHERE p.day = $1`, [today]),
      pool.query(`SELECT COALESCE(SUM(p.amount),0)::float8 AS total FROM payments p`),
    ]);

    const byRole = {};
    us.rows.forEach((r) => { byRole[r.role] = r.n; });

    /* ต่อตลาด: ล็อค / มีผู้เช่าวันนี้ / ออเดอร์วันนี้ / ค่าเช่าวันนี้ */
    const perMarket = [];
    for (const m of mk.rows) {
      const [lots, occ, om, gm, rm] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS n FROM lots WHERE market_id=$1', [m.id]),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM lot_day s JOIN lots l ON l.code = s.lot_code AND l.market_id = s.market_id
           WHERE l.market_id=$1 AND s.day=$2 AND s.vendor_name <> ''`, [m.id, today]),
        pool.query(
          `SELECT COUNT(*)::int AS n, COALESCE(SUM(o.total),0)::float8 AS gmv
           FROM orders o JOIN shops s ON s.id = o.shop_id
           WHERE s.market_id=$1 AND (o.created_at AT TIME ZONE 'Asia/Bangkok')::date = $2`, [m.id, today]),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM orders o JOIN shops s ON s.id = o.shop_id
           WHERE s.market_id=$1 AND o.is_guest AND (o.created_at AT TIME ZONE 'Asia/Bangkok')::date = $2`, [m.id, today]),
        pool.query(
          `SELECT COALESCE(SUM(p.amount),0)::float8 AS total FROM payments p JOIN lots l ON l.code = p.lot_code AND l.market_id = p.market_id
           WHERE l.market_id=$1 AND p.day=$2`, [m.id, today]),
      ]);
      const shops = sh.rows.find((x) => x.market_id === m.id);
      perMarket.push({
        id: m.id, name: m.name, emoji: m.emoji,
        area: m.area, address: m.address || '', announcement: m.announcement || '',
        open_today: marketOpenToday(m),
        schedule_text: scheduleText(m),
        open_days: parseOpenDays(m.open_days),
        open_time: m.open_time || '', close_time: m.close_time || '',
        force_open: m.force_open == null ? null : m.force_open,
        manager: m.manager || '— ยังไม่มีผู้จัดการ',
        lots: lots.rows[0].n, occupied: occ.rows[0].n,
        shops: shops ? shops.n : 0, shops_open: shops ? shops.open : 0,
        orders_today: om.rows[0].n, guest_orders_today: gm.rows[0].n, gmv_today: Number(om.rows[0].gmv),
        rent_today: Number(rm.rows[0].total),
      });
    }

    const [rc, ro] = await Promise.all([
      pool.query(
        `SELECT u.display_name, u.login, u.phone, u.created_at,
                (SELECT COUNT(*)::int FROM orders o WHERE o.customer_user_id = u.id) AS orders,
                (SELECT COALESCE(SUM(o.total),0)::float8 FROM orders o WHERE o.customer_user_id = u.id) AS spend
         FROM users u WHERE u.role='customer' ORDER BY u.created_at DESC LIMIT 8`),
      pool.query(
        `SELECT o.id, o.customer_name, o.total::float8 AS total, o.status, o.created_at,
                s.name AS shop_name, s.emoji AS shop_emoji, m.name AS market_name
         FROM orders o JOIN shops s ON s.id = o.shop_id JOIN markets m ON m.id = s.market_id
         ORDER BY o.id DESC LIMIT 8`),
    ]);

    res.json({
      totals: {
        markets: mk.rows.length,
        managers: byRole.manager || 0,
        vendors: byRole.vendor || 0,
        customers: byRole.customer || 0,
        shops: sh.rows.reduce((s, x) => s + x.n, 0),
        orders_today: oToday.rows[0].n,
        gmv_today: Number(oToday.rows[0].gmv),
        guest_orders_today: perMarket.reduce((s, x) => s + (x.guest_orders_today || 0), 0),
        orders_all: oAll.rows[0].n,
        gmv_all: Number(oAll.rows[0].gmv),
        rent_today: Number(rToday.rows[0].total),
        rent_all: Number(rAll.rows[0].total),
      },
      markets: perMarket,
      recent_customers: rc.rows,
      recent_orders: ro.rows.map((o) => ({ ...o, total: Number(o.total) })),
    });
  } catch (err) {
    console.error('[admin stats]', err);
    bad(res, 'โหลดสถิติไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/audit — บันทึกกิจกรรมทุกการกระทำ (แอดมินเท่านั้น)
   ?market_id= &role= &q= &limit= (สูงสุด 500) */
app.get('/api/admin/audit', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const where = [];
    const params = [];
    if (req.query.market_id && Number(req.query.market_id) > 0) {
      params.push(Number(req.query.market_id));
      where.push(`a.market_id = $${params.length}`);
    }
    if (req.query.role && ['admin', 'manager', 'vendor', 'customer', 'guest'].includes(String(req.query.role))) {
      params.push(String(req.query.role));
      where.push(`a.actor_role = $${params.length}`);
    }
    if (req.query.q) {
      params.push(`%${String(req.query.q).slice(0, 100)}%`);
      where.push(`(a.detail ILIKE $${params.length} OR a.actor_name ILIKE $${params.length} OR a.action ILIKE $${params.length} OR a.target ILIKE $${params.length})`);
    }
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT a.id, a.ts, a.actor_name, a.actor_role, a.action, a.detail, a.target, a.market_id,
              m.name AS market_name
       FROM audit_log a LEFT JOIN markets m ON m.id = a.market_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY a.id DESC LIMIT $${params.length}`,
      params
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error('[admin audit]', err);
    bad(res, 'โหลดบันทึกกิจกรรมไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/audit.csv — ส่งออกบันทึกกิจกรรมเป็น CSV */
app.get('/api/admin/audit.csv', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const { rows } = await pool.query(
      `SELECT a.id, to_char(a.ts AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') AS ts,
              a.actor_name, a.actor_role, a.action, a.detail, a.target,
              m.name AS market_name
       FROM audit_log a LEFT JOIN markets m ON m.id = a.market_id
       ORDER BY a.id DESC LIMIT 2000`
    );
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const head = ['เวลา', 'ผู้กระทำ', 'บทบาท', 'การกระทำ', 'รายละเอียด', 'ตลาด', 'อ้างอิง'].map(esc).join(',');
    const lines = rows.map((r) =>
      [r.ts, r.actor_name, r.actor_role, r.action, r.detail, r.market_name || '', r.target].map(esc).join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="talatsuite-activity.csv"');
    res.send('\uFEFF' + [head, ...lines].join('\r\n'));
  } catch (err) {
    console.error('[admin audit csv]', err);
    bad(res, 'ส่งออกบันทึกไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/users — บัญชีทั้งหมด */
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const { rows } = await pool.query(
      `SELECT u.id, u.login, u.role, u.display_name, u.phone, u.email, u.created_at, u.last_login_at,
              u.market_id, mk.name AS market_name, u.shop_id, s.name AS shop_name,
              (u.passcode_hash IS NOT NULL) AS has_passcode
       FROM users u
       LEFT JOIN markets mk ON mk.id = u.market_id
       LEFT JOIN shops s ON s.id = u.shop_id
       ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'manager' THEN 1 WHEN 'vendor' THEN 2 ELSE 3 END, u.id`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('[admin users]', err);
    bad(res, 'โหลดบัญชีไม่สำเร็จ', 500);
  }
});

/* POST /api/admin/users — สร้างบัญชีผจก./ร้านค้า */
app.post('/api/admin/users', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const b = req.body || {};
    const role = ['manager', 'vendor'].includes(b.role) ? b.role : null;
    if (!role) return bad(res, 'ประเภทบัญชีต้องเป็น manager หรือ vendor');
    const login = cleanStr(b.login, 60).toLowerCase();
    const password = String(b.password || '');
    const display_name = cleanStr(b.display_name, 120);
    if (!display_name) return bad(res, 'กรุณากรอกชื่อ');
    if (login.length < 3 || !/^[\w.\-@+]+$/.test(login)) return bad(res, 'ชื่อผู้ใช้ต้องยาว 3 ตัวขึ้นไป (a-z, 0-9)');
    if (password.length < 4) return bad(res, 'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร');
    const { rows: dup } = await pool.query('SELECT id FROM users WHERE login=$1', [login]);
    if (dup.length) return bad(res, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว');

    let market_id = null;
    let shop_id = null;
    if (role === 'manager') {
      market_id = num(b.market_id);
      if (!market_id) return bad(res, 'เลือกตลาดที่ผู้จัดการนี้ดูแล');
      const { rows: mk } = await pool.query('SELECT id FROM markets WHERE id=$1', [market_id]);
      if (!mk.length) return bad(res, 'ไม่พบตลาดนี้', 404);
      const { rows: ex } = await pool.query(`SELECT id FROM users WHERE role='manager' AND market_id=$1`, [market_id]);
      if (ex.length) return bad(res, 'ตลาดนี้มีผู้จัดการอยู่แล้ว');
    }
    if (role === 'vendor' && b.shop_id) {
      shop_id = num(b.shop_id);
      const { rows: sh } = await pool.query('SELECT id FROM shops WHERE id=$1', [shop_id]);
      if (!sh.length) return bad(res, 'ไม่พบร้านนี้', 404);
      const { rows: ex } = await pool.query('SELECT id FROM users WHERE shop_id=$1', [shop_id]);
      if (ex.length) return bad(res, 'ร้านนี้มีบัญชีร้านค้าอยู่แล้ว');
    }

    const { rows } = await pool.query(
      `INSERT INTO users (login, password_hash, role, display_name, phone, email, market_id, shop_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [login, hashPassword(password), role, display_name, cleanStr(b.phone, 32), cleanStr(b.email, 120), market_id, shop_id]
    );
    await audit(rows[0], 'user.create', `สร้างบัญชี ${ROLE_TH_SRV[role]} "${display_name}" (ชื่อผู้ใช้ ${login})`, market_id, login);
    res.status(201).json({ ok: true, user: userPublic(rows[0]) });
  } catch (err) {
    console.error('[admin user create]', err);
    bad(res, 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* PUT /api/admin/users/:id — แก้บัญชี / รีเซ็ตรหัสผ่าน */
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const u = await requireUser(req, res, ['admin']);
    if (!u) return;
    const id = Number(req.params.id);
    const { rows: cur } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    if (!cur.length) return bad(res, 'ไม่พบบัญชีนี้', 404);
    const b = req.body || {};
    const f = {};
    f.display_name = b.display_name !== undefined ? cleanStr(b.display_name, 120) : cur[0].display_name;
    if (!f.display_name) return bad(res, 'ชื่อห้ามว่าง');
    f.phone = b.phone !== undefined ? cleanStr(b.phone, 32) : cur[0].phone;
    f.email = b.email !== undefined ? cleanStr(b.email, 120) : cur[0].email;
    let password_hash = cur[0].password_hash;
    if (b.password !== undefined) {
      if (String(b.password).length < 4) return bad(res, 'รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร');
      password_hash = hashPassword(b.password);
    }
    let market_id = cur[0].market_id;
    let shop_id = cur[0].shop_id;
    if (cur[0].role === 'manager' && b.market_id !== undefined) {
      market_id = num(b.market_id);
      if (!market_id) return bad(res, 'เลือกตลาดที่ผู้จัดการนี้ดูแล');
    }
    if (cur[0].role === 'vendor' && b.shop_id !== undefined) shop_id = num(b.shop_id);

    const { rows } = await pool.query(
      `UPDATE users SET display_name=$2, phone=$3, email=$4, password_hash=$5, market_id=$6, shop_id=$7
       WHERE id=$1 RETURNING *`,
      [id, f.display_name, f.phone, f.email, password_hash, market_id, shop_id]
    );
    if (b.password !== undefined) await pool.query('DELETE FROM sessions WHERE user_id=$1', [id]);
    await audit(u, 'user.update',
      `แก้บัญชี "${f.display_name}"${b.password !== undefined ? ' + รีเซ็ตรหัสผ่าน' : ''}`, market_id, cur[0].login);
    res.json({ ok: true, user: userPublic(rows[0]) });
  } catch (err) {
    console.error('[admin user update]', err);
    bad(res, 'แก้ไขบัญชีไม่สำเร็จ กรุณาลองใหม่', 500);
  }
});

/* DELETE /api/admin/users/:id */
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const u = await requireUser(req, res, ['admin']);
    if (!u) return;
    const id = Number(req.params.id);
    if (id === u.id) return bad(res, 'ลบบัญชีตัวเองไม่ได้');
    const { rows: tgt } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    if (!tgt.length) return bad(res, 'ไม่พบบัญชีนี้', 404);
    if (tgt[0].role === 'admin') {
      const { rows: admins } = await pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role='admin'`);
      if (admins[0].n <= 1) return bad(res, 'ไม่สามารถลบแอดมินคนสุดท้ายของระบบได้');
    }
    const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [id]);
    if (!rowCount) return bad(res, 'ไม่พบบัญชีนี้', 404);
    await audit(u, 'user.delete',
      `ลบบัญชี ${ROLE_TH_SRV[tgt[0].role] || tgt[0].role} "${tgt[0].display_name}" (${tgt[0].login})`,
      tgt[0].market_id, tgt[0].login);
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin user delete]', err);
    bad(res, 'ลบบัญชีไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/customers — ข้อมูลลูกค้าเพื่อการตลาด */
app.get('/api/admin/customers', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const { rows } = await pool.query(
      `SELECT u.id, u.login, u.display_name, u.phone, u.email, u.created_at, u.last_login_at,
              (SELECT COUNT(*)::int FROM orders o WHERE o.customer_user_id = u.id) AS orders,
              (SELECT COALESCE(SUM(o.total),0)::float8 FROM orders o WHERE o.customer_user_id = u.id) AS spend,
              (SELECT COUNT(DISTINCT s.market_id)::int FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.customer_user_id = u.id) AS markets
       FROM users u WHERE u.role='customer'
       ORDER BY spend DESC, u.created_at DESC`
    );
    res.json({ customers: rows.map((c) => ({ ...c, spend: Number(c.spend) })) });
  } catch (err) {
    console.error('[admin customers]', err);
    bad(res, 'โหลดข้อมูลลูกค้าไม่สำเร็จ', 500);
  }
});

/* GET /api/admin/customers.csv — ส่งออกข้อมูลลูกค้า (CSV + BOM สำหรับ Excel) */
app.get('/api/admin/customers.csv', async (req, res) => {
  try {
    if (!(await requireUser(req, res, ['admin']))) return;
    const { rows } = await pool.query(
      `SELECT u.login, u.display_name, u.phone, u.email,
              to_char(u.created_at, 'YYYY-MM-DD HH24:MI') AS joined,
              (SELECT COUNT(*)::int FROM orders o WHERE o.customer_user_id = u.id) AS orders,
              (SELECT COALESCE(SUM(o.total),0)::float8 FROM orders o WHERE o.customer_user_id = u.id) AS spend
       FROM users u WHERE u.role='customer'
       ORDER BY u.created_at DESC`
    );
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const head = ['เบอร์โทร/ผู้ใช้', 'ชื่อ', 'เบอร์ติดต่อ', 'อีเมล', 'สมัครเมื่อ', 'จำนวนออเดอร์', 'ยอดใช้จ่ายรวม (บาท)'].map(esc).join(',');
    const lines = rows.map((r) => [r.login, r.display_name, r.phone, r.email, r.joined, r.orders, r.spend].map(esc).join(','));
    const csv = '\uFEFF' + [head, ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="talatsuite-customers.csv"');
    res.send(csv);
  } catch (err) {
    console.error('[admin customers csv]', err);
    bad(res, 'ส่งออกข้อมูลไม่สำเร็จ', 500);
  }
});

/* ---------- SPA fallback ---------- */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return bad(res, 'ไม่พบ API นี้', 404);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------- error middleware ---------- */
app.use((err, req, res, next) => {
  console.error('[server]', err);
  if (res.headersSent) return next(err);
  bad(res, 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', 500);
});

/* ---------------- boot ---------------- */
(async () => {
  let tries = 0;
  while (true) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (e) {
      tries++;
      if (tries > 20) {
        console.error('เชื่อมต่อ PostgreSQL ไม่สำเร็จ:', e.message);
        process.exit(1);
      }
      console.log(`รอ PostgreSQL ... (${tries})`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  await pool.query(SCHEMA);
  await pool.query(SCHEMA_MIGRATE);
  await seed();
  app.listen(PORT, HOST, () => {
    console.log(`TalatSuite v5.4 พร้อมใช้งาน → http://${HOST}:${PORT}`);
    console.log(`ฐานข้อมูล: ${DATABASE_URL.replace(/\/\/.*@/, '//***@')}`);
  });
})().catch((e) => {
  console.error('เริ่มระบบไม่สำเร็จ:', e);
  process.exit(1);
});
