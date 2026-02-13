# Production Dashboard - Project Plan

## 📋 Overview
Sistem dashboard untuk monitoring data produksi dari berbagai departemen dengan alur: SSO Login → Excel Upload → Data Cleansing → SQL Server → D3.js Visualization.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Cleansing │────▶│  SQL Server │────▶│  D3.js UI   │
│  (Next.js)  │     │  (Next.js)  │     │   Logic     │     │  Database   │     │  Charts     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| UI Library | Tailwind CSS, Shadcn UI |
| Auth | NextAuth.js (SSO simulation) |
| Excel Processing | xlsx, papaparse |
| Database | SQL Server |
| ORM | Prisma |
| Charts | D3.js |
| State Management | Zustand |

---

## 📝 Development Phases

### Phase 1: Setup & Authentication
- [ ] Inisialisasi Next.js project dengan TypeScript
- [ ] Setup Tailwind CSS dan Shadcn UI
- [ ] Konfigurasi NextAuth.js untuk SSO (simulasi)
- [ ] Buat login page dengan 3 level: GM, Manager, Staff
- [ ] Buat layout dan protected routes
- [ ] Setup project structure (folders, configs)

### Phase 2: Database & Prisma
- [ ] Setup SQL Server connection
- [ ] Buat Prisma schema (User, ProductionData, Departments)
- [ ] Run migration
- [ ] Buat seed data untuk testing

### Phase 3: Excel Upload Feature
- [ ] Buat upload page dengan drag & drop
- [ ] Implementasi file parsing (xlsx library)
- [ ] Buat validation untuk format Excel
- [ ] Buat preview data sebelum upload
- [ ] API endpoint untuk upload processing

### Phase 4: Data Cleansing Logic
- [ ] Buat cleansing service dengan fungsi:
  - [ ] Validasi dan fix format tanggal (YYYY-MM-DD, DD/MM/YYYY, etc)
  - [ ] Hapus baris kosong
  - [ ] Validasi numerik (hapus huruf di angka)
  - [ ] Handle missing values
  - [ ] Trim whitespace
- [ ] Buat error reporting (baris mana yang error)
- [ ] API endpoint untuk cleansing + save ke DB

### Phase 5: Dashboard & D3.js Visualization
- [ ] Buat dashboard layout
- [ ] Implementasi D3.js charts:
  - [ ] Bar Chart (production per departemen)
  - [ ] Line Chart (tren produksi per waktu)
  - [ ] Pie Chart (distribution)
  - [ ] KPI Cards
- [ ] Filter dan date range picker
- [ ] Responsive design

### Phase 6: API Integration & Polish
- [ ] Connect frontend ke backend APIs
- [ ] Error handling dan loading states
- [ ] Testing end-to-end
- [ ] Deployment preparation

---

## 📂 Project Structure

```
production-dashboard/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── data/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/           # Shadcn components
│   │   ├── auth/        # Auth components
│   │   ├── dashboard/   # Dashboard components
│   │   └── charts/      # D3.js chart components
│   ├── lib/
│   │   ├── db.ts        # Prisma client
│   │   ├── auth.ts      # NextAuth config
│   │   └── utils.ts
│   ├── services/
│   │   ├── cleansing.ts # Data cleansing logic
│   │   └── excel.ts     # Excel processing
│   └── types/
│       └── index.ts
├── .env
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🔐 User Roles & Permissions

| Role | Login | Upload | View Dashboard | View Analytics |
|------|-------|--------|-----------------|----------------|
| GM | ✓ | ✓ | ✓ | ✓ (Full) |
| Manager | ✓ | ✓ | ✓ | ✓ (Dept only) |
| Staff | ✓ | ✓ | ✓ | ✗ |

---

## 📊 Excel Data Format

Expected columns:
| Column | Type | Validation |
|--------|------|------------|
| tanggal | Date | Format: YYYY-MM-DD |
| departemen | String | Required, max 100 char |
| produk | String | Required |
| jumlah | Integer | > 0 |
| target | Integer | > 0 |
| status | String | enum: ["selesai", "dalam proses", "batal"] |

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signin | Login user |
| POST | /api/auth/signout | Logout |
| GET | /api/auth/session | Get session |
| POST | /api/upload | Upload & cleanse Excel |
| GET | /api/data | Get production data |
| GET | /api/data/stats | Get dashboard stats |

---

## ✅ Definition of Done

Setiap feature считается selesai jika:
1. Code sudah di-commit ke branch feature
2. Tidak ada TypeScript errors
3. Build berhasil
4. Manual testing passed
5. Merge ke main branch

---

## 📌 Catatan Penting

1. **SQL Server**: Gunakan connection string ke SQL Server lokal atau Azure SQL
2. **SSO**: NextAuth menggunakan credentials provider untuk simulasi SSO
3. **Cleansing**: Semua error logging disimpan untuk review user
4. **D3.js**: Charts harus responsive dan interaktif

---

## 👥 Pembagian Job Desk (2 Orang)

### Struktur Team

| Person | Utama | Backups |
|--------|-------|---------|
| **Person A** | Frontend (Next.js UI, D3.js Charts) | Backend API |
| **Person B** | Backend (API, Database, Cleansing) | Frontend Components |

### Detail Pembagian

#### Person A - Frontend Focus
```
Tugas Utama:
├── Setup Next.js project & Tailwind
├── Buat login page & auth UI
├── Buat dashboard layout
├── Implementasi D3.js charts:
│   ├── Bar Chart
│   ├── Line Chart
│   ├── Pie Chart
│   └── KPI Cards
├── Upload page UI
└── Responsive design

Bisa bantu:
├── API route helpers
└── Type definitions
```

#### Person B - Backend Focus
```
Tugas Utama:
├── Setup Prisma & SQL Server
├── Buat database schema
├── NextAuth configuration
├── API Endpoints:
│   ├── /api/auth
│   ├── /api/upload
│   └── /api/data
├── Data cleansing service:
│   ├── Date validation
│   ├── Numeric validation
│   ├── Empty row removal
│   └── Error logging
└── Excel processing (xlsx)

Bisa bantu:
├── UI components
└── Type definitions
```

---

## 🌿 Git Branch Flow

### Branch Strategy: GitFlow Sederhana

```
main (production-ready)
│
├── develop (integration branch)
│   │
│   ├── feature/auth-login
│   ├── feature/upload-excel
│   ├── feature/data-cleansing
│   ├── feature/dashboard-d3
│   └── fix/...
```

### Aturan Branching

| Branch | Pembuat | Merge Ke | Kapan |
|--------|---------|----------|-------|
| `main` | - | - | Stable, siap deploy |
| `develop` | Person B | main | Setelah semua feature tested |
| `feature/*` | Semua orang | develop | Saat mulai task baru |
| `fix/*` | Semua orang | develop | Saat fix bug |

### Commands untuk Setiap Sesi

```bash
# 1. Mulai hari - sync dengan terbaru
git checkout develop
git pull origin develop

# 2. Buat branch fitur baru
git checkout -b feature/upload-excel

# 3. Kerja rutin
git add .
git commit -m "feat: add upload page UI"

# 4. Push ke remote
git push origin feature/upload-excel

# 5. Setelah selesai - buat PR ke develop
# (Lewat GitHub UI)

# 6. Pull terbaru sebelum mulai fitur lain
git checkout develop
git pull origin develop
```

### Pembagian Branch per Person

#### Person A (Frontend)
- `feature/auth-ui` - Login page & protected routes
- `feature/dashboard-ui` - Dashboard layout
- `feature/charts-d3` - Semua D3.js charts
- `feature/upload-ui` - Upload page UI

#### Person B (Backend)
- `feature/database-setup` - Prisma & SQL Server
- `feature/auth-api` - NextAuth API
- `feature/cleansing-service` - Data cleansing logic
- `feature/upload-api` - Excel processing API

---

## 📅 Timeline Estimation

| Phase | Estimasi | Siapa |
|-------|----------|-------|
| Phase 1: Setup & Auth | 2 hari | A + B |
| Phase 2: Database | 1 hari | B |
| Phase 3: Upload | 2 hari | A + B |
| Phase 4: Cleansing | 2 hari | B |
| Phase 5: Dashboard D3 | 3 hari | A |
| Phase 6: Integration | 2 hari | A + B |

**Total estimasi: ~12 hari kerja**

---

## 📞 Cara Kerja Tim

### Daily Standup (5 menit)
- Apa yang sudah dikerjakan?
- Apa yang akan dikerjakan?
- Ada blocker?

### Ketika Stuck
1. Cek Google/StackOverflow
2. Tanya partner
3. Tanya ke saya (opencode)

### Definition of Done
- [ ] Feature bekerja sesuai spec
- [ ] Tidak ada error saat build
- [ ] Sudah dicoba running secara lokal
- [ ] Di-commit dengan commit message jelas

