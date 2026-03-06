# Videro

## Current State
Admin login uses a phone number + OTP flow. After Internet Identity login, admin enters their phone number, receives a system-generated OTP on screen, enters it to verify. The Security tab lets admin set their admin phone number. The passkey stored in the backend is the phone number string; verifyAdminPasskey checks it.

## Requested Changes (Diff)

### Add
- Email input field on admin login page (Step 2)
- Password input field on admin login page
- "Set Admin Email" and "Set Admin Password" fields in Security tab

### Modify
- AdminLoginPage: replace the phone number + OTP flow with a simple email + password form. On submit, concatenate email and password as `email:password` and call verifyAdminPasskey. If passkey is empty (first login / after redeploy) and user is caller admin, let through with a prompt to set credentials.
- SecurityTab: replace the phone number card with an email + password card. On save, store `email:password` via setAdminPasskey.
- Update all text references from "phone number" / "OTP" to "email" / "password".
- Keep fingerprint login unchanged (it still stores its own passkey via setAdminPasskey).

### Remove
- OTP generation and display logic
- Phone number input and OTP input fields
- All OTP-related state variables and handlers
- "or use mobile number" divider text near fingerprint section

## Implementation Plan
1. Update AdminLoginPage.tsx: remove OTP state/handlers, replace with email + password state + handleLogin function that verifies `email:password` against backend.
2. Update SecurityTab in AdminDashboard.tsx: replace phone number fields with email + password fields, store as `email:password` composite string.
3. Update all labels, descriptions, and toast messages to reference email/password instead of phone/OTP.
