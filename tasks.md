# RoomieCart MVP Task Tracker

This file tracks the progress of the RoomieCart MVP features as defined in the project goals.

## 🔐 Auth & Onboarding
- [x] Email/password signup with validation (Trims whitespace)
- [x] Email/password login (Trims whitespace)
- [ ] Google OAuth
- [ ] Apple OAuth
- [ ] Password reset via email
- [x] Auto-trim whitespace on all inputs
- [ ] First-launch onboarding screen (value prop, 2-3 slides)
- [ ] Post-signup profile setup gate (display name required before app access)
- [x] Persistent session (stay logged in)
- [x] Logout

## 👤 Profile
- [x] Set display name
- [x] Edit display name
- [ ] Avatar — initials-based fallback (no upload in MVP)
- [x] View own email (read-only)
- [ ] Account deletion (soft delete)

## 🏠 Room Management
- [x] Create a room (set name)
- [x] Auto-generate unique 6-digit invite code on creation
- [x] Regenerate invite code (invalidates old one)
- [x] Join room via invite code
- [x] Validate invite code (wrong code error, already member error)
- [x] View room name
- [x] View member list (See member display names + joined date)
- [x] Owner badge on room creator
- [x] Leave room (non-owner)
- [x] Delete room (owner only)
- [x] Room designed as single but `room_id` scoped everywhere for future multi-room

## 🛒 Shopping List
### Adding
- [x] Add item with name + quantity + unit (optional)
- [x] Name normalization before insert (`lower + trim`)
- [x] Duplicate detection — query normalized name before insert
- [x] Duplicate found → show merge prompt (increase qty vs add anyway vs cancel)
- [x] Unit selector (pcs, kg, g, L, ml, pack, box, other)

### Viewing
- [x] Real-time list sync (<100ms via Supabase Realtime)
- [x] Show who added each item + timestamp
- [x] Show quantity + unit
- [x] "NEGOTIATING" badge on items with pending requests
- [x] Purchased items visually separated (greyed / archived section)
- [x] Empty state (no items yet)

### Actions
- [x] Toggle item as purchased
- [x] Undo purchased toggle
- [x] Delete item (added by self or room owner)
- [x] Pull to refresh (fallback if realtime drops)

### Sorting / Grouping
- [x] Default: newest first
- [x] Purchased items always sink to bottom

## ⚖️ Quantity Negotiation
- [x] Long-press item → open Request Change bottom sheet
- [x] Show current quantity in sheet
- [x] Input new desired quantity
- [x] Required reason field (min 10 chars)
- [x] Submit request → item gets NEGOTIATING badge
- [x] Only one pending request per item at a time (block duplicate requests)
- [x] Requestor can cancel own pending request

### Negotiation Center Screen
- [x] List all pending requests for the room
- [x] Per request: item name, current qty, requested qty, reason, who requested, when
- [x] All roommates must vote YES → updates item quantity, clears badge, marks request approved
- [x] Any roommate voting NO → clears badge, marks request rejected, quantity unchanged
- [x] Requestor cannot approve/reject their own request
- [x] Empty state (no pending requests)
- [x] Badge count on nav tab (number of pending requests)

### Post-resolution
- [ ] Push notification placeholder (log only in MVP, wire up post-MVP)
- [ ] Request history accessible per item (last 5 resolutions)

## 🔔 Notifications (In-App Only, MVP)
- [ ] In-app toast when a new item is added by someone else
- [ ] In-app toast when your quantity request is approved/rejected
- [ ] In-app toast when a new negotiation request is raised on an item you added
- [ ] No push notifications in MVP

## 🔄 Realtime & Sync
- [x] Supabase Realtime channel per room on `items` table
- [x] Supabase Realtime channel per room on `quantity_requests` table
- [x] Reconnect + re-subscribe on app foreground
- [ ] Optimistic UI on add/toggle/delete (instant local update, rollback on error)
- [x] Conflict-safe: last-write-wins on non-negotiated fields

## 🛡️ Security & Data
- [x] RLS on all tables gated via `room_members` (Fixed recursion)
- [x] Users can only read/write data for rooms they belong to
- [ ] Invite code brute-force protection (rate limit on join attempts)
- [ ] Input sanitization on all text fields
- [ ] Max item name length enforced (client + DB)
- [ ] Max quantity value enforced

## ⚙️ Settings
- [x] View invite code (tap to copy)
- [x] Regenerate invite code
- [x] View + manage members (owner: remove member)
- [x] Leave room
- [x] Delete room (owner)
- [ ] App version display
- [x] Logout

## 🧱 Technical / Non-Functional
- [ ] Offline state banner ("You're offline — list may be outdated")
- [ ] Error boundaries on all major screens
- [ ] Loading skeletons on list fetch
- [x] Empty states on every list screen
- [ ] Form validation with inline errors (no alert popups)
- [ ] Haptic feedback on long-press, approve, reject, purchase toggle
- [x] Keyboard-avoiding views on all input screens
- [x] Dark mode support (system default)
