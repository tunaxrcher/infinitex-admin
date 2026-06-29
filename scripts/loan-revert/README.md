# Loan Revert Scripts

สคริปต์สำหรับ "ย้อนข้อมูล" สินเชื่อที่ถูกชำระงวด/ปิดสินเชื่อผิดพลาด ให้กลับไปสถานะ `ACTIVE` ก่อนทำรายการ

> ⚠️ สคริปต์เหล่านี้ **แก้ไขข้อมูลในฐานข้อมูลโดยตรง** ไม่ใช่ส่วนหนึ่งของแอป
> การ deploy โค้ดขึ้นเซิร์ฟเวอร์ **ไม่ได้** ทำให้ข้อมูล production เปลี่ยน — ต้องรันสคริปต์ชี้ไปที่ DB ที่ต้องการแก้เอง

## ไฟล์

| ไฟล์ | หน้าที่ | แก้ข้อมูลไหม |
| --- | --- | --- |
| `investigate-loans.mjs` | ดูสถานะปัจจุบันของสินเชื่อ + รายการบัญชีที่เกี่ยวข้อง | อ่านอย่างเดียว |
| `revert-loans.mjs` | ย้อนข้อมูล (loan / installment / payment / land account) | **แก้ข้อมูล** (ต้องใส่ `APPLY=1`) |
| `audit-loans.mjs` | ตรวจหลังย้อนว่าครบทุกตาราง ไม่มีค้าง/เพี้ยน | อ่านอย่างเดียว |

## ข้อกำหนด

- Node.js 20.6+ (รองรับ `--env-file`) — เครื่อง/เซิร์ฟเวอร์ที่รันแอปอยู่แล้วใช้ได้เลย
- ติดตั้ง dependencies และ generate Prisma client แล้ว (`npm install` + `npx prisma generate` ซึ่งรวมอยู่ในขั้นตอน build อยู่แล้ว)
- ไฟล์ `.env` ต้องมี `DATABASE_URL` ชี้ไปที่ฐานข้อมูล **ที่ต้องการแก้**

## วิธีรัน (รันจาก root ของโปรเจกต์)

```bash
# 1) ดูสถานะปัจจุบันก่อน
node --env-file=.env scripts/loan-revert/investigate-loans.mjs

# 2) ดูแผนการย้อน (DRY-RUN ยังไม่แก้ข้อมูล)
node --env-file=.env scripts/loan-revert/revert-loans.mjs

# 3) ลงมือแก้จริง (เมื่อแน่ใจแล้ว)
#    Linux / macOS (bash):
APPLY=1 node --env-file=.env scripts/loan-revert/revert-loans.mjs
#    Windows PowerShell:
$env:APPLY=1; node --env-file=.env scripts/loan-revert/revert-loans.mjs

# 4) ตรวจสอบหลังแก้
node --env-file=.env scripts/loan-revert/audit-loans.mjs
```

### ระบุเลขสินเชื่ออื่น (เผื่อเคสในอนาคต)

```bash
LOANS="LOA1111,LOA2222" node --env-file=.env scripts/loan-revert/revert-loans.mjs
```

## หมายเหตุความปลอดภัย

- ควร **backup / dump ฐานข้อมูลก่อน** รันด้วย `APPLY=1` ทุกครั้ง
- `revert-loans.mjs` ทำงานใน transaction เดียว — ถ้าพลาดจะ rollback ทั้งหมด
- รันซ้ำได้อย่างปลอดภัย (idempotent): ถ้าข้อมูลถูกย้อนไปแล้ว การรันอีกครั้งจะไม่หักยอดบัญชีซ้ำ
- สคริปต์จะ **ไม่ลบ** รายการ "เปิดสินเชื่อ" ตอนปล่อยกู้ครั้งแรก (ลบเฉพาะรายการรับชำระ/ปิดที่ผิด)
