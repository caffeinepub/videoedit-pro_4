# Videro

## Current State
The app is a video editing platform where uploaders can submit source + reference videos for professional editing, pay via Stripe/Google Pay/PhonePe, and receive the edited video back. Three video tiers exist: Small (₹100), Medium (₹500), Long (₹2,000). Admins manage jobs via a protected admin section.

## Requested Changes (Diff)

### Add
- A new "Photo to Video" service tier with a price of ₹50 per image
- A new tab on the SubmitJobPage for "Photo to Video (₹50)" — the first/starting tab
- A new `photo_to_video` VideoType in the backend
- Image upload dropzone (accepts image files: JPG, PNG, WEBP, etc.) instead of video for the source upload
- Reference: uploader can optionally upload a reference video to show the style they want
- Notes field for describing the desired animation/effect
- Payment step works the same: Google Pay / PhonePe / Stripe for ₹50
- A new pricing card on the LandingPage for "Photo to Video" at ₹50, shown first/highlighted
- Landing page hero updated to mention "Starting from ₹50"
- Client dashboard shows Photo to Video jobs with a distinct badge

### Modify
- Backend `VideoType` enum: add `#photo_to_video` variant
- Backend `getVideoPrice`: add case for `#photo_to_video` returning 5000 (₹50 in paise)
- `JobStatus` compare function: no change needed
- SubmitJobPage: add `photo_to_video` tab as the first tab; its source upload accepts images not videos
- LandingPage pricing section: add Photo to Video card as the first card
- Landing page hero: update "Starting at ₹100" → "Starting at ₹50"

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo` to add `#photo_to_video` VideoType and price (5000 = ₹50)
2. Regenerate Motoko backend so `backend.d.ts` reflects the new enum value
3. On SubmitJobPage: add `photo_to_video` as a new first tab; swap source dropzone to image-only when photo_to_video is selected; adjust pricing display
4. On LandingPage: add Photo to Video pricing card (first/featured), update hero starting price
5. On ClientDashboard/JobDetailPage: add badge for `photo_to_video` jobs
