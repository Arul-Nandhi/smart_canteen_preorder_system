# Smart Canteen Staff Panel - Implementation Checklist ✅

## Pre-Flight Check

Before testing, ensure:

### Backend Requirements
- [ ] Django server running: `python manage.py runserver`
- [ ] Database migrated: `python manage.py migrate`
- [ ] No API errors in Django console
- [ ] User has role 'staff' or 'admin' assigned in database

### Frontend Requirements
- [ ] React development server running: `npm start` (in frontend folder)
- [ ] No console errors in browser DevTools (F12)
- [ ] Logged in as staff/admin user
- [ ] API baseURL: `http://localhost:8000/api` (check in api.js)

---

## Component Verification

### ✅ Step 1: Staff Dashboard Access
**Route:** `http://localhost:3000/staff`

- [ ] Page loads without errors
- [ ] See 3 module cards: Operations, Queue, Slots
- [ ] "Live Kitchen Status" banner visible
- [ ] Stats show: Pending, Confirmed, Preparing, Ready counts
- [ ] Each card shows live badge (e.g., "5 Active")

### ✅ Step 2: Order Management
**Route:** `http://localhost:3000/staff/operations`

**Visual Checks:**
- [ ] Page displays list of orders
- [ ] Order cards show: Token, Customer Name, Items, Total, Status
- [ ] Status badges are color-coded (yellow, blue, purple, green)
- [ ] Real-time updates every 5 seconds (check order counts changing)

**Workflow Test:**
```
1. Find an order with status "Pending"
2. Click "Accept Order" button
   - [ ] Status changes to "Confirmed"
   - [ ] Card color changes to blue
3. Click "Start Preparing"
   - [ ] Status changes to "Preparing"
   - [ ] Card color changes to purple
4. Click "Mark Ready"
   - [ ] Status changes to "Ready"
   - [ ] Card color changes to green
5. Click "Mark Delivered"
   - [ ] Billing modal opens
   - [ ] Shows: Total Amount, Items, Customer Name
6. Enter received amount (must be ≥ total)
   - [ ] Change automatically calculated
   - [ ] Confirm button enabled
7. Click "Confirm Payment"
   - [ ] Order marked "Completed"
   - [ ] Modal closes
   - [ ] Dark grey badge appears on card
```

**Filter Test:**
- [ ] Filter by Status dropdown works
- [ ] Filter by Type (Instant/Preorder) works
- [ ] Search by customer name works
- [ ] Filters update display instantly

### ✅ Step 3: Queue Management
**Route:** `http://localhost:3000/staff/queue`

**Visual Checks:**
- [ ] Large rush level indicator visible (with emoji)
- [ ] Shows current rush: Low (🟢), Medium (🟡), or Heavy (🔴)
- [ ] Metrics displayed: Active Orders, Avg Wait Time, Peak Orders, Last Updated
- [ ] Queue position list shows all active orders

**Rush Level Test:**
```
1. Identify current rush level button
2. Click on different rush level
   - [ ] Color changes on indicator
   - [ ] Description updates
   - [ ] Backend returns success toast
3. Refresh page
   - [ ] Rush level persists
   - [ ] Students see updated queue status
```

**Real-time Test:**
- [ ] Place new order in student app (or use test data)
- [ ] Go to /staff/queue
- [ ] Wait 8 seconds (polling interval)
- [ ] New order appears in queue list
- [ ] Active orders count increases

### ✅ Step 4: Slot Management
**Route:** `http://localhost:3000/staff/slots`

**Visual Checks:**
- [ ] 18 slots displayed (3 hours, 10-min intervals)
- [ ] Each slot shows: Time, Capacity bar, Reserved/Available count, Status
- [ ] Statistics at top: Total Capacity, Reserved, Available, Load %
- [ ] Capacity bars color-coded: Green <50%, Yellow 50-80%, Red >80%

**Time Format Check:**
- [ ] Times shown in 24-hour format (not AM/PM)
- [ ] Times in India timezone (IST)
- [ ] Next slot is within ~10 minutes from current time

**Refresh Test:**
- [ ] Auto-refreshes every 10 seconds (watch order counts change)
- [ ] Percentages update in real-time

### ✅ Step 5: Image Display
**Route:** `http://localhost:3000/menu`

**Basic Images:**
- [ ] All menu categories show food images
- [ ] Images load on page load
- [ ] No broken image icons

**Combo Images:**
- [ ] Click on combo meal
- [ ] Modal opens showing combo items
- [ ] Each item in combo shows image
- [ ] Combo items have dietary indicators (Veg/Non-Veg/Egg)
- [ ] Images load from `/assets/food/` directories

**Combo Sync Test:**
```
1. Go to admin → Combo management
2. Find a combo, edit it
3. Add a NEW dish to combo_items
4. Save changes
5. Go to student menu
6. Click on same combo
7. [ ] New dish appears in combo
8. [ ] Image shows for new dish
9. [ ] No manual refresh needed
```

---

## Backend Endpoint Tests

### Test 1: Get Queue Status
```bash
curl -X GET http://localhost:8000/api/queue/status/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected Response:**
```json
{
  "active_orders": 5,
  "estimated_wait_mins": 15,
  "overloaded": false,
  "rush_level": "medium",
  "message": "..."
}
```
- [ ] Endpoint responds with 200 status
- [ ] rush_level matches current UI

### Test 2: Update Rush Level (NEW)
```bash
curl -X POST http://localhost:8000/api/queue/update-rush/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rush_level": "heavy"}'
```
**Expected Response:**
```json
{
  "success": true,
  "rush_level": "heavy",
  "message": "Queue status updated to heavy rush"
}
```
- [ ] Endpoint responds with 200 status
- [ ] Returns success: true
- [ ] Queue page updates immediately

### Test 3: Update Order Status
```bash
curl -X PATCH http://localhost:8000/api/orders/1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_status": "confirmed"}'
```
- [ ] Endpoint responds with 200 status
- [ ] Order status updated in database
- [ ] Reflected on staff dashboard

---

## Role-Based Access Control Tests

### Test 1: Staff User Restrictions
Login as staff user, then:

**Can Access:**
- [ ] /staff (staff dashboard)
- [ ] /staff/operations (orders)
- [ ] /staff/queue (queue)
- [ ] /staff/slots (slots)
- [ ] /menu (read-only)

**Cannot Access (should redirect):**
- [ ] /admin/menu (admin edit)
- [ ] /admin/settings
- [ ] /admin/combo
- [ ] /admin/users

### Test 2: Admin User Full Access
Login as admin, then:
- [ ] Can access ALL /staff routes
- [ ] Can access ALL /admin routes

---

## Performance Tests

### Test 1: Real-time Responsiveness
- [ ] Toggle rush level: Updates instantly
- [ ] Change order status: Updates in <1 second
- [ ] Place new order: Appears in queue within 8 seconds
- [ ] No lag when scrolling order lists

### Test 2: Load Testing
- [ ] 50+ orders displayed: No slow down
- [ ] 18 slots rendered: Smooth interaction
- [ ] Multiple users accessing: No conflicts

### Test 3: Mobile Responsiveness
On mobile/tablet screen:
- [ ] All cards stack vertically
- [ ] Buttons remain clickable
- [ ] Text readable without zoom
- [ ] Images don't overflow

---

## Error Handling Tests

### Test 1: Network Error
- [ ] Unplug internet (simulate offline)
- [ ] Try to update order status
- [ ] [ ] Error toast shows: "Failed to update order"
- [ ] UI doesn't crash
- [ ] Reconnect → Works again

### Test 2: Invalid Input
- [ ] Billing modal: Enter amount < total
- [ ] [ ] "Confirm" button disabled
- [ ] Enter invalid rush level
- [ ] [ ] Backend returns 400 error
- [ ] Toast shows error message

### Test 3: Database Error
- [ ] Stop Django server
- [ ] Try any API call from staff panel
- [ ] [ ] Connection error handled gracefully
- [ ] User sees: "Failed to load data"

---

## Data Persistence Tests

### Test 1: Order State
- [ ] Set order to "Preparing"
- [ ] Refresh page (F5)
- [ ] [ ] Order still shows "Preparing" status
- [ ] Change to "Ready"
- [ ] Refresh again
- [ ] [ ] Status persists

### Test 2: Rush Level Persistence
- [ ] Set rush level to "heavy"
- [ ] Refresh page
- [ ] [ ] Still shows "heavy"
- [ ] Log out and log back in
- [ ] [ ] Still "heavy" (if using database)

---

## Integration Tests

### Test 1: Student → Staff Workflow
```
1. Student places order on /menu
2. Order appears on /staff/operations
3. Staff marks "Preparing"
4. Student sees status update on /orders
5. Staff marks "Ready" → /staff/queue position updates
6. Student sees "Ready" on their queue
7. Staff marks "Delivered" → Complete
8. Student sees order in history
```

### Test 2: Admin → Staff → Student
```
1. Admin edits combo on /admin/combo
2. Staff sees updated combo on /staff/menu (read-only)
3. Student sees new dish in combo modal
4. Images load properly for all parties
```

---

## Success Criteria

- [ ] All routes load without errors
- [ ] Order workflow functions end-to-end
- [ ] Real-time updates work (5-8 second delay)
- [ ] Images load for all menu items & combos
- [ ] Combo sync works automatically
- [ ] Role-based access enforced
- [ ] Mobile responsive
- [ ] Error handling graceful
- [ ] Performance acceptable (<100ms per action)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Page not found" error | Verify imports in App.jsx, restart npm server |
| Images not showing | Check /assets/food/ directory has images, verify imageResolver.js path |
| Orders not updating | Check polling interval (should be 5 sec), verify API working |
| Combo not syncing | Hard refresh browser (Ctrl+Shift+R), clear cache |
| Rush level endpoint error | Verify queue_engine/urls.py has update-rush/ route |
| Token error | Log out and log back in, check JWT token expires |

---

## Final Sign-Off

When all checks pass:

- [ ] **Functionality**: ✅ All features working
- [ ] **UX/Design**: ✅ Professional appearance, responsive
- [ ] **Performance**: ✅ Sub-second response times
- [ ] **Security**: ✅ Role-based access enforced
- [ ] **Integration**: ✅ Works with admin & student sides
- [ ] **Error Handling**: ✅ Graceful degradation
- [ ] **Documentation**: ✅ This checklist complete

**Status: READY FOR PRODUCTION** 🚀

---

**Implementation Date:** 2024  
**Last Updated:** 2024  
**Tested By:** _________________  
**Date:** _________________
