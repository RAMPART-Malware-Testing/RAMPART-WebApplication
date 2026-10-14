# RAMPART WebApplication — Setup Guide (AI Agent Runbook)

คู่มือนี้สำหรับ AI agent อ่านแล้ว setup โปรเจกต์จน build ผ่านและรันได้
**ห้ามใช้ Docker** และ **ห้าม mock/สุ่ม/แต่งค่า key เองทุกกรณี** — key ทั้งหมดต้องมาจากแพลตฟอร์มจริงผ่าน MCP browser เท่านั้น

## ⛔ กติกาบังคับก่อนเริ่ม (อ่านให้ครบก่อนทำอย่างอื่น)

1. **ห้ามแต่งค่า env เอง** — `GOOGLE_*`, `GITHUB_*`, `RECAPTCHA_*` ห้ามสุ่ม ห้ามใส่ placeholder ห้าม mock ต้องได้มาจาก console จริงเท่านั้น
2. **ใช้ MCP browser เป็นขั้นตอนบังคับ** — agent ต้องเปิด MCP browser เอง ไปยัง console แต่ละแหล่งตามขั้นตอนในหัวข้อ 4 แล้วดึง key จริงมาใส่
3. **เจอหน้า login ให้หยุดรายงานผู้ใช้ทันที** — ถ้า browser ไปถึง console แล้วแต่ยังไม่ได้ login ด้วย Google/GitHub **ห้ามข้าม ห้ามปลอมข้อมูล** ให้รายงานผู้ใช้ทันทีว่า:
   - ตอนนี้ไปถึงขั้นไหนแล้ว (เช่น "เปิด Google Cloud Console แล้ว แต่ยังไม่ได้ login")
   - เหลืออะไรอีก
   - ผู้ใช้ต้องทำอะไรต่อ (เช่น "รบกวน login Google ในหน้า browser ที่เปิดค้างไว้ แล้ว agent จะทำต่อเอง")
   - รอผู้ใช้ login เสร็จแล้วทำงานต่อจากเดิมได้เลย
4. ทำขั้นตอนตามลำดับ 1→6 และทำ checkpoint (✓) ท้ายแต่ละหัวข้อให้ครบก่อนไปต่อ

## 1. เตรียมเครื่อง

- Node.js 20+ (LTS)
- pnpm — repo fix ไว้ที่ `pnpm@10.30.3` (ถ้ายังไม่มี: `corepack enable`)

```bash
node -v && pnpm -v
```

## 2. ติดตั้ง dependency

```bash
pnpm i
```

✓ checkpoint: `pnpm i` จบโดยไม่ error

## 3. โครงไฟล์ `.env`

สร้าง `.env` ที่ root เทียบจาก `.env.example` โดย **เติมแค่ 4 ค่านี้ก่อน** ที่เหลือรอดึงจากหัวข้อ 4:

| Variable | ค่า |
|---|---|
| `SERVER_URL` | `http://localhost:8006` |
| `APP_URL` | `http://localhost:3000` |
| `JWT_SECRET` | random 64 hex — `openssl rand -hex 32` (ตัวเดียวในไฟล์นี้ที่สุ่มได้) |
| `OAUTH_BRIDGE_SECRET` | random 64 hex — `openssl rand -hex 32` (ต้องต่างจาก JWT_SECRET) |

ค่าที่ **ห้ามใส่เอง** และต้องรอดึงจาก browser: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

ห้ามตั้ง `NODE_ENV` ใน `.env`

## 4. ดึง key จริงด้วย MCP browser (บังคับ)

เปิด MCP browser แล้วทำตามลำดับนี้ ทีละแหล่ง **ถ้าเจอหน้า login/sign-in ให้ทำตามกติกาข้อ 3 ทันที (รายงานผู้ใช้ → รอ → ทำต่อ) ทุกครั้ง**

### 4.1 Google OAuth
1. เปิด `https://console.cloud.google.com/apis/credentials`
2. ถ้ามี OAuth 2.0 Client ID (type: Web application) อยู่แล้ว → เปิดดู คัดลอก **Client ID** กับ **Client Secret**
3. ถ้าไม่มี → สร้างใหม่ (Create Credentials → OAuth client ID → Web application) โดยตั้ง Authorized redirect URI เป็น `http://localhost:3000/api/auth/google/callback`
4. ใส่ค่าลง `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 4.2 GitHub OAuth
1. เปิด `https://github.com/settings/developers`
2. ถ้ามี OAuth App อยู่แล้ว → คัดลอก **Client ID** กด Generate new client secret แล้วคัดลอก **Client Secret**
3. ถ้าไม่มี → New OAuth App โดยตั้ง Authorization callback URL เป็น `http://localhost:3000/api/auth/github/callback`
4. ใส่ค่าลง `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

### 4.3 reCAPTCHA
1. เปิด `https://www.google.com/recaptcha/admin` (v2)
2. ใช้ site ที่มีอยู่ (หรือสร้างใหม่ v2) คัดลอก **Site key** กับ **Secret key**
3. ใส่ค่าลง `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY`

✓ checkpoint: ทุกค่าใน `.env` ต้องเป็นค่าจริงจาก console (จะสังเกตได้จากรูปแบบ: Google ID ลงท้าย `apps.googleusercontent.com`, secret ขึ้นต้น `GOCSPX-`, GitHub secret เป็น hex 40 ตัว, reCAPTCHA key ขึ้นต้น `6L`) — **ถ้าค่าไหนไม่ตรงรูปแบบนี้แปลว่ายังเป็นค่าแต่ง ให้กลับไปดึงใหม่ ห้ามไปต่อ**

## 5. Build

```bash
pnpm exec tsc --noEmit
pnpm run build
```

✓ checkpoint: สองคำสั่งนี้ผ่านทั้งคู่

## 6. รันและตรวจ

```bash
pnpm start
```

- เปิด `http://localhost:3000` ได้
- หน้า `/login` มีปุ่ม Google/GitHub และ reCAPTCHA แสดง (key จริงจะ render ถูกต้อง)

## 7. สรุปสถานะให้ผู้ใช้เมื่อจบ

รายงานสั้นๆ: ติดตั้ง ✓ / env ครบ ✓ / build ✓ / รัน ✓ และถ้ามีขั้นตอนไหนที่ค้างเพราะรอผู้ใช้ login ให้ระบุชัดว่าค้างที่แหล่งไหน ผู้ใช้ต้อง login ด้วยบัญชีอะไร

## หมายเหตุ

- `SERVER_URL` ถูก expose ไป browser (ดู `next.config.ts`) เพราะหน้า `/scan` ยิงไฟล์ตรงไป backend — ตอน deploy จริงต้องเป็น public origin ของ API
- Backend จริง (`RAMPART-API-SERVERv1`) รัน port 8006 — โปรเจกต์นี้เป็น frontend คุยผ่าน `src/proxy.ts`
- ห้าม commit `.env` ลง git
