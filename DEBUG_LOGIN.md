# Debug: New Person Cannot Log In

## Quick Diagnosis

### Step 1: Check How They Were Added

**If added through UI:**
- They were added to localStorage (if API mode not enabled)
- They have `password: ''` (empty string)
- Should trigger password setup screen

**If added through API:**
- They're in the database
- They have `passwordHash: null`
- Should trigger password setup screen

### Step 2: Test the Login Flow

Try logging in with the new person's **מספר אישי** (Personal ID):

1. Enter Personal ID
2. Should see password setup screen (if no password)
3. Set password
4. Should log in

### Step 3: Check What Error You See

- **"מספר אישי לא נמצא"** = Person not found in data
- **Nothing happens** = API might not be responding
- **Other error** = Check browser console (F12)

### Step 4: Verify Person Exists

**Check in localStorage (if using local mode):**
1. Open browser console (F12)
2. Run: `JSON.parse(localStorage.getItem('rassapp-data'))`
3. Look for the person in `misgerets[].personnel`

**Check in database (if using API):**
1. Go to: http://localhost:3001/health (should work)
2. Check database using Prisma Studio:
   ```powershell
   cd server
   npm run db:studio
   ```
3. Open `Soldier` table and look for the person

## Common Issues

### Issue 1: Person Not in Database (API Mode)
**Problem:** Added through UI but API mode is enabled
**Solution:** Need to add through API or switch to localStorage mode

### Issue 2: API Not Running
**Problem:** API mode enabled but server not running
**Solution:** Start the server: `cd server && npm run dev`

### Issue 3: Wrong Personal ID
**Problem:** Typo in personal ID
**Solution:** Double-check the personal ID

## Quick Fix

### If Using localStorage Mode:
1. Make sure person is in the data
2. Try logging in with just Personal ID
3. Should see password setup screen

### If Using API Mode:
1. Make sure backend server is running
2. Check person exists in database
3. Try API login directly:
   ```powershell
   curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"personalId\":\"THEIR_PERSONAL_ID\"}"
   ```

## Need More Help?

Please provide:
1. Error message (if any)
2. Whether API mode is enabled
3. How the person was added (UI or API)
4. Browser console errors (F12)

