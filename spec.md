# VideoEdit Pro

## Current State

- Full-stack video editing job platform with Stripe payments in INR.
- Three roles: client (uploader), editor, admin.
- Admin section exists at `/admin` protected by `AdminGuard` which checks `isCallerAdmin()` via Internet Identity.
- Admin dashboard has tabs: Jobs, Revenue, Users, Stripe.
- Navbar shows "Admin" link if the user is admin.
- Uploaders (clients) use the same login flow as admins -- there is no separate admin-only passkey/PIN gate.
- No dedicated admin login page or passkey gate -- admin section is reachable by anyone who happens to know the URL and is registered as admin in the backend.

## Requested Changes (Diff)

### Add

- **Admin Passkey Gate**: A separate admin login screen at `/admin-login` that requires a secret passkey (PIN/password) stored in the backend. Only after entering the correct passkey does the user proceed to the admin dashboard.
- **Backend: `setAdminPasskey` and `verifyAdminPasskey`** -- Admin can set the passkey; any caller can verify it (returns bool). Passkey stored as a hashed value in the backend.
- **`AdminLoginPage`** -- A dedicated page at `/admin-login` with a passkey input. On success, stores a session flag (`adminAuthenticated`) in sessionStorage and redirects to `/admin`.
- **Updated `AdminGuard`** -- Also checks for the `adminAuthenticated` sessionStorage flag in addition to `isCallerAdmin()`. If flag is missing, redirects to `/admin-login`.
- **Admin passkey setup in Admin Dashboard** -- New "Security" tab in AdminDashboard where admin can set/change the passkey.
- **Navbar**: Remove the "Admin" link entirely so uploaders cannot see or navigate to admin section. Admin navigates directly via `/admin-login`.

### Modify

- `AdminGuard` in `App.tsx`: add check for `sessionStorage.getItem("adminAuthenticated")` in addition to `isCallerAdmin()`. If not present, show redirect to admin login page.
- `AdminDashboard.tsx`: add "Security" tab with passkey change form.
- `Navbar.tsx`: remove the admin dashboard link so it never appears in navigation for any user.

### Remove

- Nothing removed structurally; the admin nav link is hidden.

## Implementation Plan

1. **Backend**: Add `adminPasskey` storage (hashed text), `setAdminPasskey(passkey: Text)` (admin only), `verifyAdminPasskey(passkey: Text) : Bool` (public query).
2. **Frontend hooks**: Add `useSetAdminPasskey` and `useVerifyAdminPasskey` hooks in `useQueries.ts`.
3. **`AdminLoginPage`**: New page at `/admin-login` -- passkey input, submit button, error state. On success sets `sessionStorage.adminAuthenticated = "true"` and navigates to `/admin`.
4. **Update `AdminGuard`**: Check both `isCallerAdmin()` and `sessionStorage.adminAuthenticated`. If either fails, render redirect to `/admin-login`.
5. **Update `AdminDashboard`**: Add "Security" tab with set/change passkey form.
6. **Update `Navbar`**: Remove admin dashboard link so it is never visible to any user in the navbar.
7. **Update `App.tsx`**: Add `/admin-login` route.
