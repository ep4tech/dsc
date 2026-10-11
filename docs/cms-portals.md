# CMS portal management

The CMS **Portals** screen (`/cms/portals`) manages bilingual titles and descriptions, icon or uploaded image, color, display order and the registration account type used by guest journey buttons.

Apply `pb_migrations/1792400000_cms_portals.js` through PocketBase's normal migration process. It creates the `portals` collection and seeds the four existing portal configurations, preserving their route keys (`1`, `2`, `4`, `5`), services and detailed hero/philosophy content. It does not rewrite existing `info_pages` or cases. Review against the real database before applying in production; never apply the local-only baseline migrations there.

Active administrators can create/edit portals and mark them removed. Removed portals are omitted from public views and selectors; Restore makes the same route available again. Removal is reversible and does not delete associated CMS service pages or case history. Public users can read only portals that are not removed. Physical deletion is locked through API rules.

Files accept JPEG, PNG, WebP and GIF up to 5 MB. The uploaded picture appears on the discovery card and portal hero. Without a picture, existing portals retain their original hero banner and the card uses its selected icon. New portal heroes use their bilingual title and description initially; services can be added through **Info Pages**.

All portal consumers load persisted records; an empty collection or all-removed collection stays empty rather than reviving static defaults. Public portal routes query current records on every request. Signed-in journey links continue to target that account's cases/projects; guest links use the configured account type.

Verify with `node tests/portal-management.test.cjs` and `npx tsc --noEmit`. Local reviewer testing should cover create/edit/image, bilingual display, removal/restoration and registration routing.
