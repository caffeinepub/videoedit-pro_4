# videru

## Current State
- Two video types: Small (₹500) and Long (₹2,000)
- Submit page uses "job" terminology throughout
- Client dashboard shows "Jobs" section with job-centric labels
- File dropzone shows "up to 2GB" limit
- LandingPage pricing shows 2 cards (Small ₹500, Long ₹2,000)
- Backend `VideoType` has `#small` and `#long` only
- `getVideoPrice` returns 50000 for small and 200000 for long (paise)

## Requested Changes (Diff)

### Add
- Medium video tier (₹500) between small and long
- New pricing: Small = ₹100, Medium = ₹500, Long = ₹2,000
- Third tab on SubmitJobPage for "Medium Video"
- Third pricing card on LandingPage for "Medium Video"

### Modify
- Remove all "job" / "Jobs" language from client-facing UI (ClientDashboard, SubmitJobPage, LandingPage CTA, NavBar if applicable) — replace with "video", "uploads", "my videos", "submit a video", "New Upload", etc.
- Update file size hint in Dropzone from "up to 2GB" to "up to 100 GB"
- Update backend `VideoType` to add `#medium` variant
- Update `getVideoPrice` for: small=10000 (₹100), medium=50000 (₹500), long=200000 (₹2,000)
- Update `backend.d.ts` VideoType enum to include `medium`
- Update `VIDEO_TYPES` config in SubmitJobPage to include medium entry (₹100 small, ₹500 medium, ₹2,000 long)
- Update LandingPage hero text "Starting at just ₹500" → "Starting at just ₹100"
- Update LandingPage pricing section to 3 cards
- Update StatusBadge / job list items to use video language

### Remove
- "Job" wording from all client-facing pages (not admin — admin can keep job language)

## Implementation Plan
1. Update backend `main.mo`: add `#medium` to `VideoType`, update `getVideoPrice` (small=10000, medium=50000, long=200000)
2. Update `backend.d.ts`: add `medium` to `VideoType` enum
3. Update `SubmitJobPage.tsx`: add medium tab + VIDEO_TYPES entry, rename "job" to "video" in labels/buttons/headings, update dropzone size hint to "up to 100 GB"
4. Update `ClientDashboard.tsx`: rename "Jobs" → "My Videos", "New Job" → "New Upload", etc.
5. Update `LandingPage.tsx`: add third pricing card for Medium (₹500), update Small to ₹100, update hero starting price to ₹100, update CTA copy
6. Update `useQueries.ts` if needed for new video type mapping
7. Check admin pages — keep job language there, just update VideoType badge for "Medium"
