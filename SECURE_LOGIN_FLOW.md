# Secure Login Flow for New Soldiers

## Overview

The system is now configured to securely handle soldiers without passwords. When a new soldier is created, they have no password, and they must set one on first login.

## How It Works

### 1. Creating a Soldier Without Password

When you add a soldier via the API:
```javascript
POST /api/misgerets/:misgeretId/personnel
{
  "name": "שם החייל",
  "personalId": "1234567",
  "role": "soldier"
}
```

The soldier is created with:
- ✅ Name
- ✅ Personal ID
- ✅ Role
- ❌ No password (passwordHash = null)

### 2. First Login Flow

**Step 1: Soldier enters Personal ID**
```
POST /api/auth/login
{
  "personalId": "1234567"
}
```

**Response (if no password):**
```json
{
  "needsPassword": true,
  "personalId": "1234567",
  "userId": "soldier-id",
  "user": {
    "id": "soldier-id",
    "name": "שם החייל",
    "role": "soldier"
  }
}
```

**Step 2: Soldier sets password**
```
POST /api/auth/set-password
{
  "personalId": "1234567",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "soldier-id",
    "name": "שם החייל",
    "personalId": "1234567",
    "role": "soldier",
    "misgeretId": "misgeret-id"
  }
}
```

### 3. Subsequent Logins

After password is set, normal login:
```
POST /api/auth/login
{
  "personalId": "1234567",
  "password": "SecurePassword123!"
}
```

## Security Features

✅ **Password Hashing**: All passwords are hashed using bcrypt (10 rounds)
✅ **JWT Tokens**: Secure token-based authentication
✅ **Password Validation**: Minimum 8 characters required
✅ **No Plain Text**: Passwords never stored in plain text
✅ **Secure API**: All endpoints require authentication except `/auth/login` and `/auth/set-password`

## Frontend Integration

The frontend now:
1. ✅ Checks API when soldier enters Personal ID
2. ✅ Detects if password needs to be set
3. ✅ Shows password setup screen for first-time users
4. ✅ Uses API to set password securely
5. ✅ Stores JWT token for authenticated requests
6. ✅ Automatically reloads data after login

## Testing

### Test New Soldier Login

1. **Create a soldier** (via admin interface or API)
2. **Try to login** with just Personal ID
3. **Should see password setup screen**
4. **Set password** (min 8 chars, must include uppercase, lowercase, number, special char)
5. **Login succeeds** and soldier is authenticated

### Test via API

```powershell
# Step 1: Try login (should return needsPassword)
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"personalId\":\"1234567\"}'

# Step 2: Set password
curl -X POST http://localhost:3001/api/auth/set-password `
  -H "Content-Type: application/json" `
  -d '{\"personalId\":\"1234567\",\"password\":\"Password123!\"}'

# Step 3: Login normally
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"personalId\":\"1234567\",\"password\":\"Password123!\"}'
```

## Summary

✅ **Backend**: Fully secure - passwords hashed, API endpoints protected
✅ **Frontend**: Integrated with API - handles first-time password setup
✅ **Flow**: Seamless - soldier sets password on first login automatically
✅ **Security**: No plain text passwords, JWT authentication, secure API

The system is now fully configured for secure password management!

