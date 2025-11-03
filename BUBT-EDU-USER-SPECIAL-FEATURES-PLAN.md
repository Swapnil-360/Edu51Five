# BUBT Edu Mail Special Features Plan

**Objective**: Let ANY user (student/visitor) access the app WITHOUT sign-in for basic features. But if they sign-in with `@cse.bubt.edu.bd` email, they unlock special features that are exclusive to BUBT students.

---

## 1. Current State Analysis

### Authentication System
- **Admin Access**: Password-based (`edu51five2025`)
- **Google OAuth**: Used for admin Drive management (DriveManager component)
- **No current email domain validation**: No special logic for @cse.bubt.edu.bd users
- **Anyone can browse**: No login required to view courses, materials, notices

### User Types Currently
1. **Anonymous Student** (Current) - Browse courses, materials, notices WITHOUT sign-in ✅ Keep this!
2. **Admin Users** - Access admin panel with password
3. **BUBT Students** (NEW) - Sign-in with @cse.bubt.edu.bd to get special features

---

## 2. Proposed Architecture

### 2.1 Key Principle
**EVERYONE can use the app. Sign-in is OPTIONAL.**
- Without sign-in: See all public materials (as today)
- With sign-in (BUBT email): Unlock exclusive student features

### 2.2 User Types (Clarified)
1. **Anonymous User** ← EVERYONE starts here (no barriers!)
   - View all courses
   - View all regular materials
   - View all notices
   - See semester tracker
   - **Can't**: Access exclusive BUBT features
   
2. **BUBT Student** (After sign-in with @cse.bubt.edu.bd) ← NEW! ✨
   - Everything from Anonymous +
   - **Can**: See early access materials
   - **Can**: See priority notices (BUBT-exclusive)
   - **Can**: Access personal dashboard
   - **Can**: Contact admins
   - **Can**: Join study group
   
3. **Admin** (Password-based)
   - Manage courses/materials
   - Upload files
   - Create notices
   - (Separate access path)

### 2.3 Data Structure
```typescript
interface BubtUser {
  email: string;
  name?: string;
  authenticatedAt: number;
  isBubtStudent: boolean;
  features: {
    earlyAccessMaterials: boolean;
    priorityNotices: boolean;
    personalDashboard: boolean;
    messaging: boolean;
    // More features...
  };
}
```

---

## 3. What BUBT Students Get (Special Features)

**These are OPTIONAL add-ons for signed-in BUBT students only!**

### 🎯 Priority Features (Easy to Build)

#### 3.1 **Early Access Materials** ⏰
- Anonymous: See materials after 2-3 days
- **BUBT Student: See materials immediately** ← NEW!
- Admin can mark material as "🔓 BUBT Early Access"
- Badge on material: "🔓 BUBT Student Access"
- Example: New topic uploaded → BUBT students see first → After 48h, everyone sees

#### 3.2 **BUBT Exclusive Notices** 📌
- Anonymous: See general notices
- **BUBT Student: See BUBT-specific notices first** ← NEW!
- Example notices:
  - "Lab assignment due Friday - Section 5 only"
  - "BUBT students: Special study session tomorrow"
  - "Important: Final exam timing for CSE courses"
- Badge: "📌 BUBT Exclusive"
- Pinned at top when logged in

#### 3.3 **Personal Dashboard** 📊
- Anonymous: No dashboard
- **BUBT Student: See personal analytics** ← NEW!
  - Courses progress (30% complete, 70% complete, etc)
  - Materials downloaded count
  - Time spent on each course
  - Deadline reminders
  - Study recommendations

#### 3.4 **Direct Messaging/Contact** 💬
- Anonymous: Can't contact admin
- **BUBT Student: Send messages to admins** ← NEW!
  - Report issues
  - Request materials
  - Ask questions
  - In-app message form (email forwarded to admin)

#### 3.5 **Study Group Finder** 👥
- Anonymous: Can't join
- **BUBT Student: Find study partners** ← NEW!
  - See other BUBT students
  - Join study groups by course
  - Share notes (optional)
  - Coordinate study sessions

### 🌟 Secondary Features (Can add later)

- Digital certificates on course completion
- Personalized recommendations
- Discussion forums (BUBT only)
- Study resources hub
- Performance analytics

---

## 4. Implementation Approach

### Phase 1: Infrastructure (No UI yet)
1. Create `useAuthContext.ts` - Global auth state management
2. Create `types/user.ts` - User types and interfaces
3. Create `lib/userService.ts` - User validation and storage
4. Add localStorage persistence for BUBT users

### Phase 2: Authentication Integration
1. Create `BubtAuthModal.tsx` - Sign-in with email verification
2. Integrate Google OAuth for @cse.bubt.edu.bd validation
3. Add sign-out functionality
4. Store authenticated user in context + localStorage

### Phase 3: UI Components
1. Create `UserProfile.tsx` - Show authenticated user info + sign out
2. Create badges/indicators for exclusive features
3. Add "BUBT Exclusive" sections to UI
4. Create feature unlock messages

### Phase 4: Feature Implementation
**Priority Order**:
1. Early Access Materials (easy, high impact)
2. Priority Notices (easy, high impact)
3. Progress Dashboard (medium complexity)
4. Contact/Messaging (medium complexity)
5. Study Resources Hub (high complexity)
6. Others...

---

## 5. Technical Stack

### Context API for State
- Store authenticated user
- Store user preferences
- Share across app

### localStorage for Persistence
- Save user email
- Save features list
- Save preferences

### New Components/Hooks
- `useBubtUser()` - Check if user is BUBT authenticated
- `useBubtFeature(featureName)` - Check if feature unlocked
- `BubtUserContext` - Global user state

### Data Flow
```
Google OAuth → Email Validation → localStorage → Context → UI Components
```

---

## 6. UI/UX Mockup Locations

### Header/Top Bar
- Add "👤 Sign In (BUBT)" button
- Show logged-in user name + "Sign Out"
- Show BUBT badge when authenticated

### Course Materials Section
- Add "🔓 Early Access Materials" collapsible section at top
- Regular materials below
- Badge on each early access item

### Notices Section
- "📌 BUBT Exclusive Notices" pinned at top
- Regular notices below

### Sidebar (if added)
- "Profile" button
- "Dashboard" button (new)
- "My Materials" button
- "Messages" button

### New Dedicated Pages
- `/profile` - User profile & settings
- `/dashboard` - Progress analytics
- `/messages` - BUBT-exclusive messaging
- `/resources` - Study resources hub

---

## 7. Security Considerations

### ✅ Safe Approach
- Email validation: Only `@cse.bubt.edu.bd` domain
- OAuth with Google: Let Google verify email
- localStorage: Non-sensitive data only
- No backend validation needed initially

### ⚠️ Future Security
- Consider server-side validation
- Rate limiting for sign-in attempts
- Email verification (send OTP)
- Role-based access control (RBAC)

---

## 8. Feature Flags (Easy Toggling)

```typescript
const BUBT_FEATURES = {
  earlyAccessMaterials: true,
  priorityNotices: true,
  progressDashboard: true,
  directContact: false, // Coming soon
  studyHub: false,      // Coming soon
  forum: false,         // Coming soon
};
```

Can be toggled without code changes by modifying constant or using admin panel.

---

## 9. Development Checklist

### Pre-implementation
- [ ] Finalize which features to implement first
- [ ] Decide on messaging/contact system (in-app vs email)
- [ ] Plan data structure for "early access" materials
- [ ] Design new pages/sections wireframes

### Core Infrastructure
- [ ] Create `types/user.ts` with interfaces
- [ ] Create `useAuthContext` hook
- [ ] Create `BubtAuthModal` component
- [ ] Add user state to App.tsx

### Features (Order TBD)
- [ ] Early Access Materials
- [ ] Priority Notices  
- [ ] Progress Dashboard
- [ ] Contact/Messaging
- [ ] Study Resources
- [ ] Forum/Discussions
- [ ] Analytics
- [ ] Certificates

### Testing
- [ ] Test sign-in flow
- [ ] Test email validation
- [ ] Test localStorage persistence
- [ ] Test feature access
- [ ] Test sign-out
- [ ] Test cross-device sync

---

## 10. Questions to Answer Before Building

1. **What's the "early access" timeline?** (48 hours? 24 hours? Manual admin flag?)
2. **How to mark materials as "early access"?** (Admin panel checkbox? Auto by date?)
3. **Should messages be in-app or email?** (Start with in-app modal)
4. **Progress dashboard: Real-time or scheduled updates?** (Real-time from localStorage)
5. **Should BUBT students see each other's profiles?** (No, privacy first)
6. **Expiration of features?** (Per semester? Always active?)
7. **Can regular students see that features are locked?** (Yes, encourage sign-in)
8. **Admin ability to toggle BUBT features?** (Future nice-to-have)

---

## 11. Example UI Flow

### Student First Visits App
```
Home Page
  → Sees "Sign In (BUBT)" button in top right
  → Regular course list below
```

### Student Clicks "Sign In (BUBT)"
```
BubtAuthModal Opens
  → "Enter your BUBT email (@cse.bubt.edu.bd)"
  → Click "Sign In with Google"
  → Google OAuth flow
  → Email validated
  → Logged in ✅
```

### After Sign In
```
Home Page (Updated)
  → Header shows: "👤 Raj Patel (BUBT) | Sign Out"
  → New section: "🔓 Early Access Materials (2 new)"
  → New badge on courses: "⭐ You have 3 exclusive materials"
  → Notices section has pinned BUBT notice at top
  → New "Dashboard" button in sidebar
```

---

## 12. Estimated Timeline

| Phase | Complexity | Time |
|-------|-----------|------|
| Infrastructure | Low | 2-3 hours |
| Auth Integration | Medium | 3-4 hours |
| Early Access Feature | Low | 2-3 hours |
| Priority Notices | Low | 2-3 hours |
| Progress Dashboard | High | 4-5 hours |
| Polish & Testing | Medium | 2-3 hours |
| **TOTAL** | **Medium** | **15-21 hours** |

---

## Next Steps

1. **Review this plan** with user
2. **Confirm which features** to implement first
3. **Decide on authentication method** (Google OAuth vs Email verification)
4. **Start with Phase 1**: Create infrastructure
5. **Then Phase 2**: Authentication
6. **Then Phase 3**: Early access + priority notices
7. **Then Phase 4**: Dashboard and other features

---

**Status**: Planning Phase ⏳ (Not building yet)
**Ready to proceed?** 🚀
