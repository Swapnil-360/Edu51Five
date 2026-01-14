# Complete Auth System Testing Guide

## Overview
This guide walks through testing all authentication flows:
1. **Sign In** - Existing user login
2. **Sign Up / Registration** - New user account creation
3. **Edit Profile** - Modify existing profile
4. **Sign Out** - Logout and cleanup

## Prerequisites
- Dev server running: `npm run dev` (port 5174)
- Browser DevTools open (F12) to see console logs
- Clear browser cache/localStorage between tests if needed

---

## Test 1: Sign Up (New User Registration)

### Steps:
1. Open home page
2. Click **"Sign Up"** button in header or mobile menu
3. Fill in the form:
   - **Name**: Test User
   - **Section**: 5
   - **Major**: CSE
   - **BUBT Email**: testuser@cse.bubt.edu.bd (must end with @cse.bubt.edu.bd)
   - **Notification Email**: (optional, your gmail/personal email)
   - **Phone**: 01700000000
   - **Password**: testpass123
   - **Confirm Password**: testpass123
   - **Profile Picture**: (optional)

### Expected Results:
✅ Form validates input (shows red errors if invalid)
✅ Modal stays open during submission
✅ Success message appears briefly
✅ Modal closes automatically after ~1.5 seconds
✅ User profile appears in sidebar with name "Test User"
✅ LocalStorage contains profile data (check DevTools > Storage > LocalStorage)
✅ "Sign Out" button appears in mobile menu (replacing Sign In)

### Console Logs to Check:
- `"Profile saved successfully"` - Confirms profile save
- Check for any auth errors in red text

### Potential Issues:
- **Error: "new row violates row-level security policy"** → RLS policy issue (requires SQL fix in Supabase)
- **Error: "BUBT email must end with @cse.bubt.edu.bd"** → Email validation failure (expected if wrong domain)
- **Modal won't close** → State update issue (check console for errors)

---

## Test 2: Sign In (Existing User)

### Prerequisites:
- Complete Test 1 first (or have existing account)
- Close/sign out if currently logged in

### Steps:
1. Click **"Sign In"** button in header or mobile menu
2. Enter credentials:
   - **Email/Phone**: testuser@cse.bubt.edu.bd
   - **Password**: testpass123
3. Click **Sign In** button

### Expected Results:
✅ Modal stays open during submission
✅ After ~500ms delay, modal closes
✅ User profile appears in sidebar
✅ "Sign Out" button visible in mobile menu
✅ isLoggedIn state = true

### Console Logs:
- `"User signed in successfully"` - Confirms sign in
- `"Auth state change: SIGNED_IN"` - Auth listener triggered
- Profile data logged (if profile loaded successfully)

### Potential Issues:
- **Error: "Invalid credentials"** → Wrong email/password
- **Error: "No account found"** → Using localStorage fallback (no Supabase)
- Modal doesn't close → State update timing issue

---

## Test 3: Edit Profile

### Prerequisites:
- User must be signed in (complete Test 2)

### Steps:
1. Click profile icon in sidebar/header → **"Edit Profile"**
2. Modify form:
   - **Name**: Change to "Updated User"
   - **Notification Email**: Add/change email
   - **Phone**: Change phone number
   - **Profile Picture**: Upload new photo
3. Click **Save Changes**

### Expected Results:
✅ Form pre-populates with current values
✅ Changes are validated
✅ Modal closes after ~1.5 seconds
✅ Sidebar shows updated name "Updated User"
✅ Profile changes persist in localStorage

### Console Logs:
- `"Profile saved successfully"` - Confirms save

### Potential Issues:
- Form not pre-populating → initialProfile not passed correctly
- Changes not persisting → localStorage not updating
- Modal stays open → State update issue

---

## Test 4: Sign Out

### Prerequisites:
- User must be signed in (complete Test 2)

### Steps:
1. Open mobile menu (hamburger icon)
2. Scroll to bottom
3. Click **"Sign Out"** button (red button)

### Expected Results:
✅ Mobile menu closes immediately
✅ User profile disappears from sidebar
✅ "Sign In" and "Sign Up" buttons return to header/menu
✅ Page shows default "Welcome Student" text
✅ All localStorage profile data cleared
✅ isLoggedIn state = false

### Console Logs:
- `"Auth state change: SIGNED_OUT"` - Auth listener triggered
- `"User signed out and state cleared"` - Sign out handler ran

### Potential Issues:
- Menu doesn't close → setShowMobileMenu(false) timing
- UI doesn't update after sign out → Auth listener not firing or state not clearing
- localStorage not clearing → Cleanup code not running

---

## Test 5: Complete Flow (All 4 Steps)

### Scenario: Full user journey
1. **Sign Up** → Register new user
2. **Sign In** → Close app, reopen, sign in with same credentials
3. **Edit Profile** → Change name/email
4. **Sign Out** → Logout and return to default state

### Success Criteria:
- All steps complete without errors
- Profile data persists across page refreshes
- UI updates correctly for each state
- No console errors (only info logs)
- localStorage always in sync with UI

---

## Test 6: Offline Mode (No Supabase)

### Scenario: Test with Supabase disabled
1. Open DevTools Network tab
2. Block requests to `supabase.com`
3. Repeat Tests 1-4

### Expected Results:
- App still works with localStorage only
- Sign Up/In/Out use localStorage fallback
- Profile data saved locally
- Error messages shown if Supabase unavailable (graceful degradation)

---

## Test 7: Error Cases

### Test Invalid Email:
- **Sign Up**: Use email not ending with @cse.bubt.edu.bd
- **Expected**: Error shown: "BUBT email must end with @cse.bubt.edu.bd"

### Test Password Mismatch:
- **Sign Up**: Different passwords in password fields
- **Expected**: Error shown: "Passwords do not match"

### Test Short Password:
- **Sign Up**: Password less than 6 characters
- **Expected**: Error shown: "Password must be at least 6 characters"

### Test Missing Fields:
- **Sign Up**: Submit with empty name/section/major
- **Expected**: Error shown for each missing field

### Test Duplicate Email:
- **Sign Up**: Use email from existing account
- **Expected**: Error from Supabase: "User already registered"

---

## Debugging Checklist

### If Sign In/Up Modal Won't Close:
1. Check console for JavaScript errors
2. Verify state updates: `setShowSignUpModal(false)` being called
3. Check setTimeout delays (500ms for sign in, 1500ms for sign up)
4. Verify browser DevTools doesn't show blocked network requests

### If Sign Out Doesn't Work:
1. Check DevTools console for "User signed out and state cleared"
2. Verify Supabase signOut() call succeeded (should see SIGNED_OUT event)
3. Check localStorage is cleared (DevTools > Storage > LocalStorage)
4. Try hard refresh (Ctrl+Shift+R)

### If Profile Data Doesn't Load:
1. Check Supabase profiles table has data
2. Verify RLS policies allow read access
3. Check auth session exists (console.log authSession)
4. Verify email/id matches between auth.users and profiles

### If Modals Are Misaligned:
1. Check modal CSS (max-w-md, centered)
2. Verify parent div has `z-50` and overlay has `fixed inset-0`
3. Check body scroll is locked when modal open

---

## Key Code Locations

### Sign In Flow:
- **Trigger**: [src/App.tsx](src/App.tsx#L2648) - Sign In button
- **Modal**: [src/components/SignInModal.tsx](src/components/SignInModal.tsx#L52) - handleSubmit
- **Callback**: [src/App.tsx](src/App.tsx#L5684) - onSignIn handler

### Sign Up Flow:
- **Trigger**: [src/App.tsx](src/App.tsx#L2656) - Sign Up button
- **Modal**: [src/components/SignUpModal.tsx](src/components/SignUpModal.tsx#L155) - handleSubmit
- **Callback**: [src/App.tsx](src/App.tsx#L5720) - onSave handler

### Edit Profile Flow:
- **Trigger**: [src/App.tsx](src/App.tsx#L2405) - Edit Profile button
- **Modal**: Same as Sign Up (initialProfile passed)
- **Callback**: [src/App.tsx](src/App.tsx#L5720) - onSave handler

### Sign Out Flow:
- **Trigger**: [src/App.tsx](src/App.tsx#L2595) - Sign Out button
- **Handler**: [src/App.tsx](src/App.tsx#L2597) - onClick async handler
- **Listener**: [src/App.tsx](src/App.tsx#L373) - SIGNED_OUT event

---

## State Management Diagram

```
┌─────────────────────┐
│  isLoggedIn: false  │
└─────────────────────┘
         ↓ (Sign In/Up)
┌─────────────────────────────────┐
│  isLoggedIn: true               │
│  authSession: {user, ...}       │
│  userProfile: {name, email,...} │
└─────────────────────────────────┘
         ↓ (Edit Profile)
┌─────────────────────────────────┐
│  userProfile updated            │
│  localStorage synced            │
└─────────────────────────────────┘
         ↓ (Sign Out)
┌─────────────────────┐
│  isLoggedIn: false  │
│  authSession: null  │
│  localStorage clear │
└─────────────────────┘
```

---

## Success Indicators

### All Tests Pass When:
- ✅ No red console errors (only info/log messages)
- ✅ All modals close at expected times
- ✅ Profile data shows in sidebar when logged in
- ✅ Sign In/Out buttons toggle appropriately
- ✅ localStorage matches UI state
- ✅ Page refresh preserves logged-in state
- ✅ Hard refresh (Ctrl+Shift+R) logs user back in automatically

---

## Browser Console Test Commands

```javascript
// Check if user is logged in
console.log('Profile:', JSON.parse(localStorage.getItem('userProfileBubtEmail')));

// Check current auth session
// (In browser console after sign in)
console.log('Session:', authSession);

// Clear all profile data
localStorage.removeItem('userProfileBubtEmail');
localStorage.removeItem('userProfileName');
localStorage.removeItem('userProfileSection');
localStorage.removeItem('userProfileMajor');
localStorage.removeItem('userProfileNotificationEmail');
localStorage.removeItem('userProfilePhone');
localStorage.removeItem('userProfilePic');
localStorage.removeItem('userProfilePassword');
localStorage.removeItem('userProfileAvatarUrl');

// Check all localStorage
Object.keys(localStorage).forEach(key => console.log(key, localStorage.getItem(key)));
```

---

## Next Steps After Testing

1. **If all tests pass**: Code is ready to deploy
2. **If Supabase RLS errors**: Apply SQL from [FIX-SIGNUP-RLS-GUIDE.md](FIX-SIGNUP-RLS-GUIDE.md)
3. **If modal issues**: Check CSS in [src/index.css](src/index.css)
4. **If state issues**: Check React hooks in [src/App.tsx](src/App.tsx)

---

**Last Updated**: January 2025
**Status**: All auth flows implemented and tested
