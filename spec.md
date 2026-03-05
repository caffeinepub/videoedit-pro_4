# VideoEdit Pro

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication (clients and editors, admin role)
- Video upload by clients (main video + reference video)
- Admin dashboard to assign editing jobs to editors
- Editor workspace to view assigned jobs, download source + reference videos
- Editor uploads final edited video when done
- Notification/status system: job statuses (pending, assigned, in_progress, completed)
- Stripe payment flow: clients pay for editing service before or after upload
- Client dashboard to track job status and download final edited video when ready

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. User roles: client, editor, admin (via authorization component)
2. Job data model: jobId, clientId, editorId, status, createdAt, price
3. Video storage references: sourceVideoId, referenceVideoId, finalVideoId (via blob-storage component)
4. Functions:
   - `submitJob(sourceVideoId, referenceVideoId, notes)` -> creates job record, initiates Stripe payment
   - `getMyJobs()` -> returns jobs for logged-in client
   - `getAllJobs()` -> admin only, returns all jobs
   - `assignJob(jobId, editorId)` -> admin assigns job to editor
   - `getAssignedJobs()` -> returns jobs assigned to logged-in editor
   - `submitFinalVideo(jobId, finalVideoId)` -> editor marks job complete, uploads final video
   - `getJob(jobId)` -> returns job details
   - `listEditors()` -> admin only, list users with editor role
   - `setUserRole(userId, role)` -> admin sets user roles
5. Stripe integration: payment session created on job submission; job activated after payment confirmed

### Frontend
- Landing/home page with service description and CTA
- Auth pages (login/signup via Internet Identity)
- Client portal:
  - Upload page: upload source video + reference video, add notes, proceed to payment
  - My Jobs page: list of submitted jobs with status badges
  - Job detail page: status, download final video when ready
- Admin dashboard:
  - All jobs list with filters by status
  - Assign editor to job
  - Manage user roles (promote to editor)
- Editor workspace:
  - Assigned jobs list
  - Job detail: download source + reference videos, upload final edited video
- Stripe checkout integration for payment
