# TalatSuite

ชุดเครื่องมือจัดการตลาดครบวงจร — ระบบจัดการตลาด (Market Management) + POS ร้านค้าอาหาร (Vendor) + สั่งอาหารลูกค้า (Customer) ในระบบเดียว

Market management platform: market managers run lots, rent and attendance; food vendors run a POS with a live order queue; customers browse markets, order food and track every status step. Bilingual Thai/English, built mobile-first.

## สถาปัตยกรรม · Architecture

- **Server:** Node.js + Express, PostgreSQL (`server.js`)
- **Client:** single-page app, no build step (`public/`)
- **Auth:** sessions + roles (admin / manager / vendor / customer)
- **Orders:** full lifecycle `pending → preparing → ready → completed` with event timeline and browser notifications
- Self-creating schema and demo seed on first boot

## รันในเครื่อง · Run locally

```bash
npm install
DATABASE_URL=postgres://user:pass@host:5432/dbname node server.js
# open http://localhost:3000
```

## Deploy (Render + Neon)

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment:** `DATABASE_URL` = Neon pooled connection string ending in `?sslmode=require`
- **Health check:** `/api/health`

The database schema and a demo dataset are created automatically on first boot.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | local postgres | PostgreSQL connection string (Neon pooled string with `?sslmode=require` in production) |
| `PORT` / `HOST` | 3000 / 0.0.0.0 | HTTP bind |
| `SEED_DEMO` | `true` | `false` = clean production mode: no demo data or demo accounts, only the admin account below |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password in `SEED_DEMO=false` mode (change it in-app after first login) |

Production (Render): `SEED_DEMO=false` + `ADMIN_PASSWORD=***` — the owner then creates markets, shops and users entirely through the UI. Local development keeps the demo dataset for testing.

## License

© David Whitaker — Bangkok, Thailand · david8whitaker@gmail.com
