
System design blueprint based on your notes.

Product assumption: shared household shopping / grocery coordination app.

Stack:

* Frontend: React Native
* Backend: Supabase
* Hosting for auxiliary services: Railway
* Auth: Supabase Auth
* DB: PostgreSQL via Supabase
* Realtime: Supabase Realtime
* Storage: Supabase Storage
* Push notifications: Expo Notifications / Firebase Cloud Messaging
* Background jobs / APIs: Railway microservices

Product name placeholder: `RoomCart`

Core product goals:

* Shared shopping list for households / roommates
* Collaborative editing
* Quantity negotiation
* Duplicate prevention
* Ownership / permissions
* Scheduling
* Export / sharing
* Optional nutrition + translation

---

# 1. Feature breakdown

## MVP (build first)

From your notes:

1. Room creation
2. Join room
3. Owner/admin settings
4. Shared item list
5. Add/remove/edit items
6. Realtime updates
7. Duplicate detection
8. Quantity discussion workflow
9. Notifications
10. Leave room / delete room
11. Export list

Ignore initially:

* nutrition calculator
* translation
* shopping scheduling calendar
* advanced analytics

Those are v2.

---

# 2. System architecture

High level:

```text
React Native App
    |
    v
Supabase Auth
Supabase Postgres
Supabase Realtime
Supabase Storage
    |
    +---- Edge Functions
    |
    +---- Railway Services
            |
            +--- Translation service
            +--- Nutrition service
            +--- Notification scheduler
```

Flow:

```text
User action
 -> React Native UI
 -> Supabase client SDK
 -> Postgres mutation
 -> Realtime event
 -> all roommates receive updates
```

Example:
User adds "Milk"

```text
Insert into items table
 -> DB trigger
 -> realtime broadcast
 -> all connected users see update instantly
 -> push notification sent
```

---

# 3. User roles

Need role clarity.

## Owner

Can:

* create room
* edit room settings
* promote admins
* delete room
* remove members

## Admin

Can:

* manage items
* resolve discussions
* schedule shopping

Optional for MVP.

## Member

Can:

* join room
* add items
* suggest quantity changes
* vote / discuss
* leave room

---

# 4. Core entities (database design)

Proper schema.

---

## users

Supabase auth already manages auth.

Extra profile table:

```sql
profiles
--------
id (uuid, pk, auth.users.id)
name
email
avatar_url
preferred_language
created_at
```

---

## rooms

One person can create multiple rooms.

```sql
rooms
-----
id (uuid)
name
invite_code
owner_id
max_members
settings_json
created_at
updated_at
```

settings_json:

```json
{
  "allow_member_item_delete": true,
  "duplicate_detection": true,
  "discussion_required_for_quantity_change": true
}
```

---

## room_members

Many-to-many.

```sql
room_members
------------
id
room_id
user_id
role
joined_at
status
```

status:

* active
* left
* removed

role:

* owner
* admin
* member

---

## shopping_items

Main shared list.

```sql
shopping_items
--------------
id
room_id
name
normalized_name
quantity
unit
added_by
status
created_at
updated_at
```

status:

* active
* purchased
* archived
* discussion_pending

normalized_name used for duplicate detection.

Example:
"Milk"
"milk"
"MILK"

all normalize to:

```text
milk
```

---

## item_change_requests

For quantity disputes.

```sql
item_change_requests
--------------------
id
item_id
requested_by
old_quantity
new_quantity
reason
status
created_at
resolved_by
resolved_at
```

status:

* pending
* approved
* rejected

---

## discussions

Threaded conversations.

```sql
discussions
-----------
id
room_id
item_id
created_by
created_at
```

---

## discussion_messages

```sql
discussion_messages
-------------------
id
discussion_id
sender_id
message
created_at
```

---

## notifications

App notification history.

```sql
notifications
-------------
id
user_id
type
title
body
is_read
metadata_json
created_at
```

types:

* item_added
* item_removed
* quantity_request
* room_invite
* schedule_created

---

## schedules

Shopping planning.

```sql
schedules
---------
id
room_id
created_by
title
scheduled_at
notes
status
```

status:

* upcoming
* completed
* cancelled

---

## exports

Track generated exports.

```sql
exports
-------
id
room_id
format
generated_by
file_url
created_at
```

formats:

* pdf
* csv
* txt

---

# 5. API design

Even with Supabase, think in service boundaries.

---

## Auth service

Supabase handles:

* signup
* login
* logout
* session refresh

Endpoints:
built in.

---

## Room service

Operations:

```text
createRoom()
joinRoom(inviteCode)
leaveRoom(roomId)
deleteRoom(roomId)
updateRoomSettings(roomId)
getRoomMembers(roomId)
```

---

## Item service

```text
addItem(roomId, item)
updateItem(itemId)
removeItem(itemId)
markPurchased(itemId)
searchDuplicate(roomId, itemName)
```

---

## Discussion service

```text
createQuantityRequest()
approveRequest()
rejectRequest()
sendDiscussionMessage()
```

---

## Notification service

```text
sendPushNotification()
markNotificationRead()
fetchNotifications()
```

Push via Railway worker.

---

## Export service

```text
exportAsCSV()
exportAsPDF()
copyAsText()
```

Heavy PDF generation belongs on Railway.

---

## Translation service (v2)

```text
translateItem(itemName, language)
```

Railway microservice.

Possible APIs:

* LibreTranslate
* Google Translate API

---

## Nutrition service (v2)

```text
calculateNutrition(item, quantity)
```

Possible APIs:

* USDA FoodData Central
* Edamam

---

# 6. Realtime architecture

Critical feature.

Use Supabase Realtime subscriptions.

Subscribe to:

```text
rooms
shopping_items
discussions
notifications
```

Example:

```javascript
supabase
.channel('room-items')
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'shopping_items',
    filter: `room_id=eq.${roomId}`
  },
  callback
)
.subscribe()
```

Events:

* insert
* update
* delete

---

# 7. Notification architecture

Problem:
Realtime only works while app open.

Need push notifications.

Flow:

```text
DB insert
 -> trigger
 -> edge function
 -> Railway notification worker
 -> FCM / Expo push
 -> user device
```

Examples:

* item added
* quantity change request
* schedule created

---

# 8. Duplicate detection logic

Your note #8.

When user types:

```text
tomato
```

Backend:

Normalize:

* lowercase
* trim spaces
* singularization optional

Compare:

```sql
SELECT * FROM shopping_items
WHERE room_id = ?
AND normalized_name = 'tomato'
```

If exists:

Frontend popup:

```text
"Tomato already exists with quantity 2 kg.
Add more quantity instead?"
```

Actions:

* merge quantity
* create duplicate anyway

---

# 9. Security model

Must not skip this.

Supabase Row Level Security.

Rules:

Users can only:

* access rooms they belong to
* edit items in their rooms
* view discussions in their rooms
* leave their own memberships

Owner only:

* delete room
* modify room settings

Example:

```sql
auth.uid() IN (
  SELECT user_id
  FROM room_members
  WHERE room_id = shopping_items.room_id
)
```

Without RLS this app is broken.

---

# 10. Mobile app screen architecture

React Native navigation.

---

## Auth

```text
Splash
Login
Signup
Forgot Password
```

---

## Main

Tabs:

```text
Home
Notifications
Profile
```

---

## Home stack

```text
Room List
Room Details
Add Item
Item Details
Discussion
Schedule
Export
```

---

## Room Details UI

Sections:

```text
Room header
Member avatars
Shopping list
Discussion alerts
Upcoming schedule
Quick add button
```

Item card:

```text
Milk
Qty: 2 L
Added by Alex
Status: Active
```

Actions:

* edit
* remove
* mark purchased
* request quantity change

---

# 11. State management

Need predictable shared state.

Use:

* Zustand

Why:
lighter than Redux.

Stores:

```text
authStore
roomStore
itemStore
notificationStore
discussionStore
```

---

# 12. File export architecture

CSV:
frontend possible.

PDF:
backend better.

Flow:

```text
user taps export
 -> API request
 -> Railway generates file
 -> upload to Supabase Storage
 -> return signed URL
```

---

# 13. Suggested folder structure

React Native:

```text
src/
  api/
  components/
  screens/
  navigation/
  hooks/
  store/
  services/
  utils/
  constants/
  types/
```

Backend workers:

```text
railway-services/
  notifications/
  exports/
  nutrition/
  translation/
```

---

# 14. Build phases

Real sequence.

## Phase 1

Foundation
2 weeks

Build:

* auth
* profile
* room create/join
* room membership
* invite code

---

## Phase 2

Core collaboration
2 to 3 weeks

Build:

* shared shopping list
* add/edit/remove items
* realtime sync
* duplicate detection

This is actual MVP.

---

## Phase 3

Collaboration intelligence
2 weeks

Build:

* quantity requests
* discussions
* push notifications

---

## Phase 4

Utility
1 to 2 weeks

Build:

* export csv/pdf
* schedules

---

## Phase 5

Enhancements

Build:

* translation
* nutrition
* analytics
* purchase history

---

# 15. Tech decisions

Use:

React Native:

```text
Expo
React Navigation
Zustand
React Query
Supabase JS SDK
```

Backend:

```text
Supabase
Postgres
Realtime
Edge Functions
Storage
```

Railway:

```text
Node.js microservices
BullMQ if queue needed
Redis optional
```

---

# Biggest design risk

Quantity discussion workflow.

Your note says:
everyone can change quantity, but discussion required.

That creates race conditions.

Example:
3 users edit quantity simultaneously.

Fix:
Never directly overwrite if discussion mode enabled.

Instead:
create request record.

Only approved request mutates item.

---

Recommended MVP scope:

Ship only:

```text
auth
rooms
shared items
duplicate detection
realtime sync
push notifications
basic discussion
```

Ignore nutrition + translation initially.

Those are feature bait, not core product value.
