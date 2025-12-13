<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RasApp - Military Logistics Management System

A comprehensive logistics management application for military operations with multi-user support and mobile device access.

## 🚀 Quick Start

### For Local Development (Single User)
1. Install dependencies: `npm install`
2. Run the app: `npm run dev`
3. Open: http://localhost:3000

### For Multi-User with Mobile Access (Recommended)

**See `QUICK_START.md` for a 5-minute setup guide!**

1. **Set up local PostgreSQL database**
2. **Configure backend server** (see `LOCAL_SETUP.md`)
3. **Expose server to internet** (using ngrok or port forwarding)
4. **Connect mobile devices** to your server URL

## 📚 Documentation

- **`QUICK_START.md`** - Get started in 5 minutes
- **`LOCAL_SETUP.md`** - Detailed setup for local server with mobile access
- **`SETUP_INSTRUCTIONS.md`** - General setup guide
- **`MIGRATION_GUIDE.md`** - Migration and deployment guide
- **`server/README.md`** - Backend API documentation

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL (local or cloud)
- **Authentication:** JWT tokens
- **Mobile Access:** Via ngrok, port forwarding, or cloud tunnel

## 🔐 Default Admin Account

After database setup:
- Personal ID: `8223283`
- Password: `P)O(I*q1w2e3`

## 📱 Mobile Device Setup

The app supports access from Android and iOS devices. Configure your mobile apps to connect to your server's public URL (see `LOCAL_SETUP.md` for details).

## 🛠️ Development

```bash
# Frontend
npm install
npm run dev

# Backend
cd server
npm install
npm run dev
```

## 📄 License

Private project - All rights reserved
