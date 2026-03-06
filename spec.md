# videru

## Current State
- Admin Dashboard has tabs: Jobs, Revenue, Users, Stripe, Security.
- Jobs tab shows all jobs in a flat table with assign-editor functionality.
- AdminJobDetail page shows per-job: source video download, reference video download, and upload/resend edited video.
- No section that groups jobs by individual uploader (clientId) for a quick per-uploader view.

## Requested Changes (Diff)

### Add
- New "Uploaders" tab in Admin Dashboard (between Jobs and Revenue).
- The Uploaders tab shows each unique uploader as a separate card/section, identified by their clientId (truncated principal).
- Each uploader card lists all their submitted jobs.
- For each job inside an uploader card:
  - Download button for Source Video (original video).
  - Download button for Reference Video.
  - A "Resend Edited Video" inline upload section (or link to AdminJobDetail) that lets admin upload/resend the final edited video directly.
- Uploader cards are collapsible or expanded by default.
- Show uploader job count and total payment amount on the card header.

### Modify
- AdminDashboard: add a new "Uploaders" tab with the UploaderSection component.

### Remove
- Nothing removed.

## Implementation Plan
1. Create a new `UploaderJobRow` component inside AdminDashboard.tsx that shows source video download, reference video download, and a mini resend-video section for a single job.
2. Create a `UploadersTab` component that groups allJobs by clientId, renders one collapsible card per uploader, listing their jobs using `UploaderJobRow`.
3. Add the "Uploaders" tab trigger and TabsContent for the new `UploadersTab` in the AdminDashboard tabs.
4. Reuse `useAdminSubmitFinalVideo` hook for the inline resend functionality per job.
