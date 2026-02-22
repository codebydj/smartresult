## 🚀 SmartResult - Quick Setup & Troubleshooting Guide

### ⚙️ Setup Instructions

#### Option 1: Use Mock Mode (For Testing - NO DATABASE NEEDED)

```powershell
# 1. Edit .env file and set:
MOCK_MODE=true

# 2. Start the server:
npm run dev

# 3. Test the UI:
# - Go to http://localhost:3000
# - Click "📋 Try Test Data" button
# - Enter any PIN - will return mock data
# - Dashboard should display!
```

#### Option 2: Use Real Scraper (Requires Website Access)

```powershell
# 1. Make sure .env has:
MOCK_MODE=false

# 2. Start the server:
npm run dev

# 3. Test with a real PIN:
# - Go to http://localhost:3000
# - Enter a valid PIN (e.g., 248H5A0513)
# - If website is accessible, results will display
```

### 🔑 Admin Login Setup

#### Option 1: Seed Default Admin (If MongoDB is Running)

```powershell
npm run seed
```

This creates:

- **Username:** `admin410`
- **Password:** `sr@admin410`

Then login at `/admin-login.html`

#### Option 2: Manual Admin Setup (Without MongoDB)

Since your MongoDB isn't running, you can use a hardcoded admin:

Create file: `.env.admin`

```
ADMIN_USERNAME=admin410
ADMIN_PASSWORD=sr@admin410
```

Then in `/public/admin-auth.js`, you can add hardcoded credentials for testing:

```javascript
// Hardcoded admin for testing (add this before the fetch call)
const DEMO_USERNAME = "admin410";
const DEMO_PASSWORD = "sr@admin410";

if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
  localStorage.setItem("adminToken", "demo-token");
  showAlert("Login successful! Redirecting...", "success");
  setTimeout(() => {
    window.location.href = "/admin-dashboard.html";
  }, 1500);
  return;
}
```

---

### 🛠️ Troubleshooting

**Problem:** 500 Error when fetching results

- **Solution:** Enable `MOCK_MODE=true` in `.env` to use test data instead

**Problem:** Admin login not working

- **Reason:** No MongoDB connection, so admin account doesn't exist
- **Solution:** Use Method 2 above (hardcoded credentials)

**Problem:** Dashboard not opening after login

- **Check:** Browser console (F12) for errors
- **Solution:** Ensure token is saved in localStorage

---

### 📊 Current Status

✅ Frontend working  
✅ API routes configured  
⚠️ MongoDB optional (use MOCK_MODE)  
⚠️ Admin requires either DB or hardcoded credentials

---

### 🧪 Test Everything With This Checklist

- [ ] Start server: `npm run dev`
- [ ] Visit: `http://localhost:3000`
- [ ] Click "📋 Try Test Data" → Should show sample results
- [ ] Enter PIN: `248H5A0513` → Should attempt real scrape
- [ ] Visit: `http://localhost:3000/admin-login.html`
- [ ] Try admin login with `admin410 / sr@admin410`
- [ ] Check browser console (F12) for detailed errors
