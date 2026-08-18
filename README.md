# Gurukul - Complete Project

## Structure

```
Gurukul/
├── backend/    → Next.js web app (API server + web UI)
└── mobile/     → React Native Expo app (mobile frontend)
```

## Quick Start

### 1. Backend (must run first)

```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Set API URL in Mobile App

Open `mobile/app.json` and find:

```json
"extra": {
  "apiUrl": "http://YOUR_LOCAL_IP:3000"
}
```

Replace `YOUR_LOCAL_IP` with your computer’s local IP.

**Find your IP:**
- Linux/Mac: `hostname -I` (first result)
- Windows: `ipconfig` → look for “IPv4 Address” under WiFi

Example: `"apiUrl": "http://192.168.1.5:3000"`

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

- Scan the QR code with **Expo Go** app on your phone
- Or press `a` for Android emulator, `i` for iOS simulator

### Requirements
- Node.js 18+
- PostgreSQL database running
- `.env` file in `backend/` with DATABASE_URL and AUTH_SECRET
- Phone and computer on the **same WiFi network**

### Important
- Backend must be running before opening the mobile app
- If mobile app can’t connect, double-check your IP address hasn’t changed
