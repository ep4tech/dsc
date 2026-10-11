# Search, messages, feedback, readability and backups

- Landing service search searches English and Arabic names across active portals and published portal items. Published items open their service page; services without a published item open their portal.
- `/dashboard/messages` is available to active experts and admins. Messages are private to sender/recipient; only recipients can change the read flag. The sidebar shows unread counts and refreshes automatically. Contacts expose names and IDs, not private expert contact details.
- Case owners can submit and update one rating (1–5) and optional comment (up to 2,000 characters) per case. Admins and assigned experts can read that feedback; unrelated users cannot.
- Reading options are available globally: text size, contrast, spacing, reduced motion and reset. Preferences are stored on the visitor's device. Reduced motion also pauses the automatic expert carousel.
- `/dashboard/admin/backups` creates and downloads PocketBase ZIP backups. Only active admins can access the APIs. Backups include database files and local uploads; externally stored S3 uploads require their own backup policy. Creation uses PocketBase's native backup transaction, not a copy of a live database file. Restore is an operational action outside this page.

## Backend deployment

Apply `1792500000_communication_feedback.js` and `1792500100_feedback_edit.js`, deploy `pb_hooks/communication-backups.pb.js` and `pb_hooks/lib/backup-access.js`, then restart PocketBase. Production schemas must be reconciled with these relation names before migration. No superuser credentials are exposed to the browser.

## Local verification

`node tests/communication-backups.mjs` checks private message access, role-scoped contacts, read updates, feedback ownership/validation, admin-only backups and a downloaded ZIP signature. It creates temporary local records and removes them afterward; it requires the existing local development accounts.
