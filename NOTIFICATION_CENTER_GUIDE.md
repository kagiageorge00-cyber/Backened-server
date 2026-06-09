# Admin Notification Center - Implementation Guide

## Overview
The Admin Notification Center provides real-time notifications for critical events in the Bliss platform. Admins can view, filter, search, and manage notifications from a modern, responsive drawer interface.

## Features

### ✅ Implemented
1. **Notification Model** - Enhanced with full metadata support
   - Category (payment, interview, deployment, etc.)
   - Entity tracking (type, ID)
   - Candidate and employer names
   - Payment amounts and currency
   - Read/unread status with timestamps

2. **Admin Notification Endpoints**
   - `GET /api/admin/notifications` - List all notifications with filters
   - `GET /api/admin/notifications/:notificationId` - Get single notification
   - `GET /api/admin/notifications/unread/count` - Get unread count
   - `PATCH /api/admin/notifications/:notificationId/read` - Mark as read
   - `PATCH /api/admin/notifications/read-all` - Mark all as read
   - `DELETE /api/admin/notifications/:notificationId` - Delete notification
   - `DELETE /api/admin/notifications` - Delete all notifications
   - `GET /api/admin/notifications/search/query` - Search notifications

3. **Notification Bell Icon**
   - Real-time unread count badge
   - Pulsing animation
   - Clickable to open drawer

4. **Notification Drawer**
   - Modern, responsive design
   - Fixed position panel
   - Smooth animations
   - Dark overlay when open

5. **Notification List**
   - Newest first (descending order)
   - Visual distinction for unread items
   - Color-coded categories
   - Full details display:
     - Title and message
     - Candidate name
     - Employer name
     - Payment amount (if applicable)
     - Timestamp
     - Category badge

6. **Categories**
   - 💳 Payment - Payment submissions and approvals
   - 📅 Interview - Interview requests and scheduling
   - 🚀 Deployment - Deployment creation and completion
   - 📄 Contract - Contract uploads and signatures
   - 🆘 Support - Support tickets
   - Message/Visa/Ticket categories also available

7. **Filtering & Search**
   - Filter by category (All, Payment, Interview, etc.)
   - Real-time search by title, message, candidate, employer
   - Combined filters

8. **Actions**
   - Mark individual notifications as read
   - Mark all as read (bulk action)
   - Delete individual notifications
   - Delete all notifications
   - Click to view details (opens related record)

9. **Real-time Updates**
   - Auto-refresh every 30 seconds
   - Unread badge updates automatically

## Backend Architecture

### Notification Model
```javascript
{
  notificationId: String (unique),
  userId: String ('admin'),
  userType: String ('admin'),
  title: String,
  message: String,
  category: String (enum),
  entityType: String,
  entityId: String,
  candidateName: String,
  employerName: String,
  amount: Number,
  currency: String,
  actionUrl: String,
  isRead: Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Admin Notification Helpers
File: `utils/adminNotificationHelper.js`

Key functions:
- `createAdminNotification()` - Base notification creation
- `notifyPaymentApproved()` - Payment approval
- `notifyPaymentRejected()` - Payment rejection
- `notifyPaymentSubmitted()` - Payment submission
- `notifyInterviewRequested()` - Interview request
- `notifyInterviewAccepted()` - Interview acceptance
- `notifyDeploymentCreated()` - Deployment creation
- `notifyDeploymentCompleted()` - Deployment completion
- `notifyContractUploaded()` - Contract upload
- `notifyVisaUploaded()` - Visa document upload
- `notifyMessageReceived()` - New message
- `notifySupportTicketCreated()` - Support ticket

### Integration Points

#### Payment Approval
```javascript
// In /api/admin/payments/:paymentId/approve
await notifyPaymentApproved({
  candidateName,
  amount,
  currency,
  paymentId
});
```

#### Payment Rejection
```javascript
// In /api/admin/payments/:paymentId/reject
await notifyPaymentRejected({
  candidateName,
  amount,
  currency,
  paymentId,
  reason
});
```

## Frontend Implementation

### HTML Components
File: `admin_notification_center.html`

#### Top Navigation
- Notification bell icon with unread badge
- Pulsing animation when unread notifications exist

#### Notification Drawer
- Responsive panel (400px on desktop, 90vw on mobile)
- Smooth slide-in animation
- Modal overlay when open

#### Notification List
- Scrollable container
- Unread items highlighted
- Each item shows full details

#### Filter Tabs
- Quick category filtering
- Active state styling
- Horizontal scroll on mobile

#### Search Box
- Real-time search
- Works across title, message, candidate, employer names

#### Actions
- Mark as read buttons
- Delete buttons
- View details links

### JavaScript Features

#### API Integration
```javascript
// Load notifications
GET /api/admin/notifications?limit=50

// Mark as read
PATCH /api/admin/notifications/:id/read

// Mark all as read
PATCH /api/admin/notifications/read-all

// Delete
DELETE /api/admin/notifications/:id

// Delete all
DELETE /api/admin/notifications

// Search
GET /api/admin/notifications/search/query?q=xxx&category=payment
```

#### Real-time Updates
- Auto-refresh every 30 seconds
- Manual refresh on mark as read
- Unread badge updates automatically

#### Time Formatting
- "Just now" for < 1 minute
- "Xm ago" for minutes
- "Xh ago" for hours
- Date format for older notifications

## Usage

### For Admin Dashboard Integration

1. **Add Bell Icon to Top Nav**
   ```html
   <div class="notification-bell" id="notificationBell">
     🔔
     <div class="notification-badge" id="notificationBadge">0</div>
   </div>
   ```

2. **Include Notification Drawer HTML**
   ```html
   <!-- Copy notification drawer section from admin_notification_center.html -->
   ```

3. **Include CSS**
   ```html
   <link rel="stylesheet" href="/path/to/notification-styles.css">
   ```

4. **Include JavaScript**
   ```html
   <script src="/path/to/notification-script.js"></script>
   ```

### Creating Notifications Programmatically

```javascript
const { notifyPaymentApproved } = require('./utils/adminNotificationHelper');

// When payment is approved
await notifyPaymentApproved({
  candidateName: 'John Doe',
  amount: 1300,
  currency: 'KES',
  paymentId: payment._id
});
```

## API Endpoints

### Get All Notifications
```
GET /api/admin/notifications
Headers: { Authorization: 'Bearer <token>' }
Query:
  - limit: 50 (default)
  - skip: 0 (default)
  - category: 'payment' | 'interview' | 'all' (optional)
  - isRead: 'true' | 'false' (optional)

Response:
{
  success: true,
  data: [Notification[]],
  total: number,
  unread: number,
  count: number
}
```

### Get Single Notification
```
GET /api/admin/notifications/:notificationId
Response:
{
  success: true,
  data: Notification
}
```

### Get Unread Count
```
GET /api/admin/notifications/unread/count
Response:
{
  success: true,
  unread: number
}
```

### Mark as Read
```
PATCH /api/admin/notifications/:notificationId/read
Response:
{
  success: true,
  data: Notification
}
```

### Mark All as Read
```
PATCH /api/admin/notifications/read-all
Response:
{
  success: true,
  modifiedCount: number
}
```

### Delete Notification
```
DELETE /api/admin/notifications/:notificationId
Response:
{
  success: true,
  message: 'Notification deleted'
}
```

### Delete All Notifications
```
DELETE /api/admin/notifications
Response:
{
  success: true,
  deletedCount: number
}
```

### Search Notifications
```
GET /api/admin/notifications/search/query
Query:
  - q: 'search term' (optional)
  - category: 'payment' (optional)

Response:
{
  success: true,
  data: [Notification[]],
  count: number
}
```

## Testing

### Manual Testing Checklist
- [ ] Bell icon displays correctly in top nav
- [ ] Unread badge shows correct count
- [ ] Click bell opens notification drawer
- [ ] Click overlay closes drawer
- [ ] Click X button closes drawer
- [ ] Notifications display in newest-first order
- [ ] Unread notifications are highlighted
- [ ] Category badges display correct colors
- [ ] Search filters notifications correctly
- [ ] Category tabs filter correctly
- [ ] Mark as read button works
- [ ] Mark all as read button works
- [ ] Delete button removes notification
- [ ] Delete all button removes all
- [ ] View details link navigates correctly
- [ ] Auto-refresh updates notification list
- [ ] Responsive on mobile devices

### Automated Testing
Tests can be added to `tests/` directory:
- `adminNotifications.test.js` - Endpoint tests
- `notificationCenter.test.js` - UI component tests

## File Structure

```
backend/
├── models/
│   └── Notification.js (enhanced)
├── routes/
│   └── admin.js (updated with new endpoints)
├── utils/
│   ├── notificationHelper.js (updated)
│   └── adminNotificationHelper.js (new)
└── admin_notification_center.html (new)
```

## Future Enhancements

1. **WebSocket Support** - Real-time push notifications
2. **Email Notifications** - Send critical alerts to admin email
3. **Notification Templates** - Customizable notification messages
4. **Notification History** - Archive old notifications
5. **Notification Rules** - Auto-delete old notifications
6. **Export** - Export notifications to CSV/PDF
7. **Batch Actions** - Select multiple notifications for bulk actions
8. **Advanced Filters** - Date range, status, amount filters
9. **Notification Scheduling** - Quiet hours, digest mode
10. **Integration** - Slack, Teams, Discord integration

## Troubleshooting

### Notifications Not Showing
1. Check admin is logged in with valid token
2. Verify notifications exist in database
3. Check browser console for JavaScript errors
4. Verify API endpoints are accessible

### Badge Not Updating
1. Check unread count endpoint returns correct value
2. Verify refresh interval (30 seconds default)
3. Clear browser cache and reload

### Drawer Not Opening
1. Check `notificationDrawer` element exists
2. Verify CSS is loaded correctly
3. Check JavaScript is loaded
4. Check browser console for errors

### Search Not Working
1. Verify search input is getting values
2. Check search API endpoint returns results
3. Verify field names match database schema

## Support
For issues or feature requests, contact the development team.
