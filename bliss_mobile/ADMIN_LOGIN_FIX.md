# ✅ ADMIN LOGIN 404 FIX GUIDE

## Problem Summary
**Error**: 404 - "Endpoint not found"  
**Location**: Admin login at `/api/admin/login`  
**Root Cause**: Deployed backend on Render is either outdated or misconfigured

---

## ✅ Quick Fix (Choose One)

### Option 1: Use Local Backend for Testing ⭐ RECOMMENDED
Switch `lib/config/api_config.dart` to use your local backend:

```dart
// Change this line:
static const String baseUrl = 'http://localhost:3000';
```

Then run the backend locally:
```bash
cd backend
npm install
node server.js
```

### Option 2: Verify Render Deployment
Check if Render backend is running and up-to-date:

1. **Test the Render backend is alive:**
   ```bash
   curl https://backened-server.onrender.com/
   ```
   Expected response: `{ "success": true, "message": "Bliss Backend Running" }`

2. **Test admin health endpoint:**
   ```bash
   curl https://backened-server.onrender.com/api/admin/health
   ```
   Expected response: `{ "success": true, "message": "Admin routes working ✅" }`

3. **If 404 → The deployment needs update:**
   - Redeploy to Render with latest code
   - Verify `backend/routes/admin.js` is included
   - Check environment variables on Render (MONGO_URI, etc.)

---

## 🧪 Testing Admin Login

### With Local Backend
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"boss","password":"boss123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "...",
  "expiresIn": 3600
}
```

### With Render Backend
```bash
curl -X POST https://backened-server.onrender.com/api/admin/login \
   -H "Content-Type: application/json" \
   -d '{"username":"boss","password":"boss123"}'
```

---

## 🔐 Admin Credentials
- **Username**: `boss`
- **Password**: `boss123`

(Can be overridden with environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`)

---

## 📋 What Was Fixed
✅ Added error handling to backend server.js to properly load admin routes  
✅ Added test endpoint `/api/admin/health` for diagnostics  
✅ Verified admin routes file (`backend/routes/admin.js`) loads correctly  
✅ Updated api_config.dart to support local backend testing  

---

## 🚀 Next Steps

### For Development
1. Switch to local backend in `api_config.dart`
2. Run `node server.js` in the backend directory
3. Run `flutter run -d chrome` in the mobile app
4. Test admin login with credentials: `boss` / `boss123`

### For Production
1. Ensure `backend/routes/admin.js` is included in Render deployment
2. Set environment variables on Render:
   - `MONGO_URI` = Your MongoDB connection string
   - `ADMIN_USERNAME` = `boss`
   - `ADMIN_PASSWORD` = `boss123`
   - `PORT` = 3000 (or Render's assigned port)
3. Redeploy from Git to trigger fresh deployment
4. Verify endpoints with curl commands above

---

## 🐛 Still Getting 404?

### Debugging Steps:
1. Check server logs for import errors
2. Verify all required files exist:
   - `backend/routes/admin.js`
   - `backend/models/User.js`
   - `backend/models/Payment.js`
   - `backend/email.js`
   - `backend/services/notificationservice.js`

3. Test individual endpoint:
   ```bash
   curl http://localhost:3000/api/admin/health
   ```

4. Check for CORS issues:
   - Backend should return headers: `Access-Control-Allow-Origin: *`
   - Frontend should send `Content-Type: application/json`

---

## 📦 Admin Endpoints Available

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/admin/login` | Login with credentials | ❌ |
| POST | `/api/admin/logout` | Logout | ✅ |
| GET | `/api/admin/health` | Health check | ❌ |
| GET | `/api/admin/test` | Test endpoint | ❌ |
| GET | `/api/admin/candidates` | Get all candidates | ✅ |
| GET | `/api/admin/payments/pending` | Get pending payments | ✅ |

---

## 💡 Pro Tips
- Local backend is faster for debugging (instant restarts with nodemon)
- Use `console.log()` statements in admin.js to trace execution
- Keep Render backend updated for production
- Use environment variables for sensitive data (never hardcode credentials)
