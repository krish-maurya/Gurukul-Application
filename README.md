# Gurukul Application

A full-stack school operations project:

- `backend/` — Next.js + Prisma + PostgreSQL web application and API.
- `mobile/` — Expo Router / React Native mobile companion for Expo SDK 54.

## Mobile requirements

- Node.js 20 LTS or newer
- Expo Go installed on a physical Android/iOS device, or Android Studio / Xcode emulator
- The phone and development machine on the same Wi-Fi for LAN development
- A running backend and PostgreSQL database

The mobile package is already aligned to **Expo SDK 54**:

```json
"expo": "~54.0.0",
"react-native": "0.81.5",
"react": "19.1.0"
```

## 1. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gurukul?schema=public"
AUTH_SECRET="replace-with-a-long-random-value"
```

Generate Prisma and prepare the database:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The web/API server starts on port `3000`.

## 2. Configure the mobile API URL

Do **not** use `localhost` when testing in Expo Go on a phone. On a phone, `localhost` means the phone itself.

Find your computer LAN IPv4 address:

```bash
ipconfig
```

Look for `IPv4 Address` under your Wi-Fi network, for example `192.168.1.25`.

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Use your own LAN IP. Ensure that the backend, phone, and computer are connected to the same network. Your firewall must allow connections to port `3000`.

For an Android emulator use:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

For an iOS simulator use:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Restart Expo whenever `.env` changes.

## 3. Run the mobile app

```bash
cd mobile
npm install
npx expo start --clear
```

- Scan the QR code in **Expo Go** for a physical device.
- Press `a` for Android emulator.
- Press `i` for iOS simulator on macOS.
- Press `w` for a browser preview.

## Mobile workflows

- Secure sign-in through the backend JWT API; the token is stored with Expo Secure Store.
- Teacher sign-in opens the focused welcome choice: **Take Attendance** or **My Timetable**.
- Attendance reads live grades, students, saved records, and submits to the same backend API as the web app.
- Students, timetable, notifications, documents, communications, and staff screens consume backend endpoints.

## Troubleshooting

### `Network request failed`

1. Confirm `npm run dev` is running in `backend/`.
2. Open `http://YOUR_LAN_IP:3000` from the phone browser.
3. Confirm `EXPO_PUBLIC_API_URL` is the correct LAN address, not `localhost`.
4. Check the Windows Firewall inbound rule for Node.js / port 3000.
5. Restart Expo with `npx expo start --clear`.

### Login succeeds but a feature returns 401

The mobile app sends the JWT as a Bearer token. Log out and log in again after changing the backend `AUTH_SECRET`.

### Database errors

Run from `backend/`:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```
