# Admin Invite Flow Documentation

## Overview
Super Admin can invite new admins by providing only their **email** and **role**. No username is required. The invited admin receives an email with a link to set their password.

## Page Path
**Admin Management**: `/admin-management`

**File Locations**:
- Page: `/app/admin-management/page.tsx`
- Content: `/src/components/admin/AdminManagementContent.tsx`
- Invite Form: `/src/components/admin/AdminInviteForm.tsx`

---

## Complete Flow

### 1. Super Admin Invites New Admin

```
Super Admin → Admin Management → Click "Invite Admin" button
↓
Dialog opens with form
↓
Enter: Email + Select Role
↓
Click "Send Invitation"
↓
Backend generates unique token
↓
Email sent to new admin
↓
New admin appears in list with "Pending" badge
```

### 2. Invite Form Fields

#### **Email Address** (Required)
- Format: Valid email
- Example: `newadmin@example.com`
- Helper text: "Admin will receive an email with a link to set their password"

#### **Role** (Required)
- Dropdown with available roles:
  - Super Admin
  - Content Manager
  - Blog Editor
  - (Custom roles)
- Shows role description

#### **What Happens Next** (Info Box)
Shows after role is selected:
1. Invitation email sent to the admin
2. Email contains a secure link to set password
3. Admin sets password and can login
4. Link expires in 24 hours

---

## Email Content (To Be Sent by Backend)

### Subject
```
You're Invited to IITian Squad Admin Panel
```

### Body
```
Hi,

You've been invited to join IITian Squad Admin Panel as a [Role Name].

Click the link below to set your password and activate your account:

https://admin.iitian-squad.com/set-password?token=abc123xyz456

This link will expire in 24 hours.

If you didn't expect this invitation, please ignore this email.

Best regards,
IITian Squad Team
```

---

## Admin List Display

### Columns
1. **Name** - Auto-generated from email (before @ symbol)
2. **Email** - Admin's email address
3. **Role** - Badge showing role name
4. **Status** - Shows:
   - 🟢 **Active** - Password set, can login
   - ⚪ **Inactive** - Deactivated by super admin
   - 🟠 **Pending** - Invitation sent, password not set yet
5. **Last Login** - Date/time or "Never"
6. **Created** - Date/time when invited
7. **Actions** - Dropdown menu

### Status Badges
- **Active** (Green) - Admin is active and can login
- **Inactive** (Gray) - Admin is deactivated
- **Pending** (Orange) - Waiting for admin to set password

### Actions Menu
For admins with **Pending** status:
- 📧 **Resend Invitation** - Send new email with fresh link

For all admins:
- ❌ **Deactivate** - Disable admin access (if active)
- ✅ **Activate** - Enable admin access (if inactive)

---

## Backend Integration

### 1. Invite Admin API
**Endpoint**: `POST /api/admin/invite`

**Request**:
```json
{
  "email": "newadmin@example.com",
  "roleId": "role-id-123"
}
```

**Response**:
```json
{
  "success": true,
  "adminId": "admin-456",
  "token": "unique-token-abc123",
  "inviteLink": "https://admin.iitian-squad.com/set-password?token=abc123",
  "expiresAt": "2024-12-03T12:00:00Z"
}
```

**Backend Actions**:
1. Validate email doesn't already exist
2. Create admin record with:
   - email
   - roleId
   - status: 'pending'
   - passwordSet: false
   - isActive: false
3. Generate unique secure token (UUID v4)
4. Store token with expiration (24 hours)
5. Send invitation email with set-password link
6. Return success response

### 2. Resend Invitation API
**Endpoint**: `POST /api/admin/resend-invite`

**Request**:
```json
{
  "adminId": "admin-456",
  "email": "newadmin@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "token": "new-unique-token-xyz789",
  "inviteLink": "https://admin.iitian-squad.com/set-password?token=xyz789",
  "expiresAt": "2024-12-03T14:00:00Z"
}
```

**Backend Actions**:
1. Validate admin exists and status is 'pending'
2. Invalidate old token
3. Generate new unique token
4. Update expiration time (24 hours from now)
5. Send new invitation email
6. Return success response

---

## Database Schema

### Admins Table
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role_id UUID REFERENCES roles(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive
  password_set BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_email ON admins(email);
CREATE INDEX idx_admin_status ON admins(status);
```

### Invite Tokens Table
```sql
CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  invalidated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invite_token ON invite_tokens(token);
CREATE INDEX idx_invite_admin ON invite_tokens(admin_id);
CREATE INDEX idx_invite_expires ON invite_tokens(expires_at);
```

---

## Security Considerations

### Token Generation
- Use cryptographically secure random tokens
- UUID v4 or similar (128-bit entropy)
- Never use predictable patterns

### Token Storage
- Store hashed tokens in database (optional but recommended)
- Include expiration timestamp
- Mark as used after password is set

### Email Security
- Always use HTTPS links
- Include token expiration time in email
- Add "ignore if not you" message
- Rate limit invitation sends

### Validation
- Validate email format
- Check for duplicate emails
- Verify role exists
- Ensure super admin permissions

---

## UI Features

### Invite Dialog
- ✅ Clean, simple form
- ✅ Only email and role required
- ✅ Real-time validation
- ✅ Role descriptions shown
- ✅ Clear "what happens next" info
- ✅ Yellow submit button (brand color)

### Admin List
- ✅ Search by name or email
- ✅ Color-coded status badges
- ✅ Pending badge for uninvited admins
- ✅ Resend option for pending admins
- ✅ Activate/Deactivate options
- ✅ Formatted dates

### Success Messages
- ✅ Alert after sending invitation
- ✅ Shows email address
- ✅ Confirms email was sent
- ✅ Alert after resending invitation

---

## Testing Scenarios

### Test 1: Invite New Admin
1. Login as Super Admin
2. Go to Admin Management
3. Click "Invite Admin"
4. Enter email: `test@example.com`
5. Select role: "Content Manager"
6. Click "Send Invitation"
7. **Expected**: 
   - Success alert shown
   - New admin appears in list
   - Status shows "Pending"
   - Email sent (check backend logs)

### Test 2: Resend Invitation
1. Find admin with "Pending" status
2. Click actions menu (three dots)
3. Click "Resend Invitation"
4. **Expected**:
   - Success alert shown
   - New email sent with fresh link
   - Old link invalidated

### Test 3: Admin Sets Password
1. Admin receives email
2. Clicks set-password link
3. Sets password
4. **Expected**:
   - Password saved
   - Status changes to "Active"
   - "Pending" badge removed
   - Admin can now login

### Test 4: Expired Link
1. Wait 24+ hours after invitation
2. Try to use set-password link
3. **Expected**:
   - Error: "Link expired"
   - Admin must request resend

### Test 5: Duplicate Email
1. Try to invite admin with existing email
2. **Expected**:
   - Error: "Email already exists"
   - No invitation sent

---

## Error Handling

### Client-Side Errors
1. **Invalid Email**
   - Message: "Invalid email address"
   - Field: email

2. **No Role Selected**
   - Message: "Role is required"
   - Field: roleId

3. **Network Error**
   - Alert: "Failed to send invitation. Please try again."

### Backend Errors (To Implement)
1. **Duplicate Email**
   - Status: 400
   - Message: "An admin with this email already exists"

2. **Invalid Role**
   - Status: 400
   - Message: "Invalid role selected"

3. **Permission Denied**
   - Status: 403
   - Message: "Only super admins can invite new admins"

4. **Email Send Failed**
   - Status: 500
   - Message: "Failed to send invitation email"

---

## Environment Variables

```env
# App URL
NEXT_PUBLIC_APP_URL=https://admin.iitian-squad.com

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@iitian-squad.com
SMTP_PASS=your-app-password

# Token Settings
INVITE_TOKEN_EXPIRY_HOURS=24

# Rate Limiting
MAX_INVITES_PER_HOUR=10
```

---

## Email Service Integration

### Using Nodemailer
```typescript
import nodemailer from 'nodemailer';

async function sendInvitationEmail(email: string, roleName: string, token: string) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const setPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${token}`;

  await transporter.sendMail({
    from: '"IITian Squad" <noreply@iitian-squad.com>',
    to: email,
    subject: "You're Invited to IITian Squad Admin Panel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: #ffd700; border-radius: 50%; 
                      display: inline-flex; align-items: center; justify-content: center;">
            ⚡
          </div>
        </div>
        
        <h2 style="color: #333; text-align: center;">Welcome to IITian Squad</h2>
        
        <p style="color: #666; line-height: 1.6;">
          You've been invited to join IITian Squad Admin Panel as a <strong>${roleName}</strong>.
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          Click the button below to set your password and activate your account:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setPasswordUrl}" 
             style="display: inline-block; padding: 14px 28px; background: #ffd700; 
                    color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Set Your Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Or copy this link:<br/>
          <a href="${setPasswordUrl}" style="color: #ffd700;">${setPasswordUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This link will expire in 24 hours.<br/>
            If you didn't expect this invitation, please ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}
```

---

## Summary

### ✅ What's Working (UI)
- Email + Role form (no username needed)
- Invite dialog with clear instructions
- Admin list with status badges
- Resend invitation option
- Success/error messages
- Clean, professional design

### ⏳ Backend Needs to Implement
1. **POST /api/admin/invite** - Create admin and send email
2. **POST /api/admin/resend-invite** - Resend invitation email
3. **Email service** - Send invitation emails
4. **Token generation** - Secure random tokens
5. **Token validation** - Check expiration and usage
6. **Database operations** - Store admins and tokens

### 🔗 Related Flows
- **Set Password**: `/set-password?token={token}` (documented in SET_PASSWORD_FLOW.md)
- **Login**: `/login` (documented in LOGIN_UI_SUMMARY.md)
- **Admin Management**: `/admin-management` (this document)

---

**The invite admin page is ready! Super Admin can now invite admins with just email + role. Backend needs to implement the API endpoints and email sending.** 🎉
