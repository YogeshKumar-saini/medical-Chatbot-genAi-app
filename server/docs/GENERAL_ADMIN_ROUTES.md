# General Admin Routes Documentation
*Administrative access - Requires SUPER_ADMIN or GEN_ADMIN role*

## Overview
General Admin routes provide administrative functions available to both SUPER_ADMIN and GEN_ADMIN users. These routes focus on system monitoring, user lookup, and account deletion workflows that require elevated permissions but not full system control.

---

## GET /api/v1/admin/logs/system

### Purpose
Retrieve system logs for monitoring and debugging purposes.

### Why This Endpoint Exists
- Enables system health monitoring
- Supports debugging of application issues
- Provides audit trail for system events
- Facilitates performance analysis and optimization

### Input Parameters
- **Query Parameter**: `limit` (integer, optional, default: 50) - Number of log entries to retrieve

### Input Format
```
GET /api/v1/admin/logs/system?limit=100
```

### Output JSON Format
```json
[
  {
    "timestamp": 1640995200.0,
    "level": "INFO",
    "message": "User login successful",
    "user_id": "507f1f77bcf86cd799439011",
    "endpoint": "/api/v1/auth/login",
    "ip_address": "192.168.1.100"
  },
  {
    "timestamp": 1640995300.0,
    "level": "WARNING",
    "message": "Rate limit exceeded for user",
    "user_id": "507f1f77bcf86cd799439012",
    "endpoint": "/api/v1/chat/chat",
    "ip_address": "192.168.1.101"
  },
  {
    "timestamp": 1640995400.0,
    "level": "ERROR",
    "message": "Database connection failed",
    "service": "mongodb",
    "error_code": "ECONNREFUSED"
  }
]
```

### Log Entry Fields
- `timestamp` (float): Unix timestamp of the log entry
- `level` (string): Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `message` (string): Human-readable log message
- `user_id` (string, optional): Associated user ID if applicable
- `endpoint` (string, optional): API endpoint accessed
- `ip_address` (string, optional): Client IP address
- `service` (string, optional): Service/component name
- `error_code` (string, optional): Error code if applicable

### Log Categories
- **Authentication**: Login, logout, token operations
- **API Access**: Endpoint access with user context
- **Errors**: Application errors and exceptions
- **System Events**: Database connections, service health
- **Security**: Rate limiting, suspicious activities

### Access Control
- Only SUPER_ADMIN and GEN_ADMIN can access
- Logs are filtered to prevent sensitive data exposure
- PII (Personally Identifiable Information) is anonymized
- Historical logs retained for configurable period

---

## GET /api/v1/admin/users/lookup

### Purpose
Search for users by email address before performing administrative actions.

### Why This Endpoint Exists
- Enables safe user identification for admin actions
- Prevents accidental operations on wrong users
- Supports user management workflows
- Provides user verification before modifications

### Input Parameters
- **Query Parameter**: `email` (string, required) - Email address to search

### Input Format
```
GET /api/v1/admin/users/lookup?email=user@example.com
```

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "PATIENT",
  "is_active": true,
  "is_verified": true,
  "created_at": 1640995200.0,
  "organization_id": "507f1f77bcf86cd799439012",
  "last_login": 1640995300.0
}
```

### User Information Provided
- Basic account information
- Account status and verification
- Associated organization
- Last activity timestamp
- Account creation date

### Use Cases
- **Before Role Changes**: Verify user identity
- **Account Deletion**: Confirm correct user
- **User Support**: Look up user details for assistance
- **Audit Preparation**: Gather user context

### Privacy Considerations
- Only basic account information exposed
- No sensitive profile data included
- Access logged for audit purposes
- Rate limited to prevent enumeration attacks

---

## GET /api/v1/admin/requests/delete

### Purpose
View pending user account deletion requests.

### Why This Endpoint Exists
- Supports GDPR and privacy regulation compliance
- Enables right-to-be-forgotten processing
- Manages user-initiated account deletion workflow
- Provides oversight of deletion queue

### Output JSON Format
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "user_email": "user@example.com",
    "reason": "No longer need the service",
    "request_date": 1640995200.0,
    "status": "PENDING",
    "data_retention_days": 30,
    "approved_by": null,
    "approved_at": null
  }
]
```

### Request Information
- Unique request identifier
- User account details
- Reason for deletion request
- Request timestamp and status
- Data retention requirements
- Approval tracking

### Deletion Workflow
1. **User Request**: User submits deletion request with reason
2. **Admin Review**: Admin reviews request and user data
3. **Approval**: Admin approves or rejects deletion
4. **Processing**: System processes deletion with retention period
5. **Confirmation**: User receives deletion confirmation

### Legal Compliance
- Supports GDPR Article 17 (right to erasure)
- Maintains deletion audit trail
- Implements configurable data retention
- Provides user consent verification

---

## POST /api/v1/admin/requests/delete/{request_id}/approve

### Purpose
Approve a user account deletion request.

### Why This Endpoint Exists
- Completes the account deletion workflow
- Ensures proper authorization for data deletion
- Maintains compliance with privacy regulations
- Provides controlled deletion process

### Input Parameters
- **URL Parameter**: `request_id` (string, required) - Deletion request ID

### Input Format
```
POST /api/v1/admin/requests/delete/507f1f77bcf86cd799439011/approve
```

### Approval Process
1. Validate admin permissions
2. Verify request exists and is pending
3. Update request status to approved
4. Log approval with admin ID and timestamp
5. Queue deletion job for processing
6. Notify user of approval

### Output JSON Format
```json
{
  "message": "Deletion request approved",
  "request_id": "507f1f77bcf86cd799439011",
  "approved_by": "507f1f77bcf86cd799439012",
  "approved_at": 1640995200.0,
  "processing_eta": "2024-01-15T10:00:00Z"
}
```

### Deletion Processing
- **Immediate**: Request marked as approved
- **Queued**: Background job processes actual deletion
- **Retention**: Data retained for specified period
- **Notification**: User notified of approval and timeline

---

## POST /api/v1/admin/requests/delete/{request_id}/reject

### Purpose
Reject a user account deletion request.

### Why This Endpoint Exists
- Handles cases where deletion cannot be processed
- Provides feedback to users on rejection reasons
- Maintains account continuity when appropriate
- Supports alternative resolution options

### Input Parameters
- **URL Parameter**: `request_id` (string, required) - Deletion request ID

### Input Format
```
POST /api/v1/admin/requests/delete/507f1f77bcf86cd799439011/reject
```

### Rejection Process
1. Validate admin permissions
2. Update request status to rejected
3. Log rejection with admin ID and timestamp
4. Optionally provide rejection reason
5. Notify user of rejection with next steps

### Output JSON Format
```json
{
  "message": "Deletion request rejected",
  "request_id": "507f1f77bcf86cd799439011",
  "rejected_by": "507f1f77bcf86cd799439012",
  "rejected_at": 1640995200.0,
  "reason": "Account has active appointments"
}
```

### Rejection Reasons
- **Active Appointments**: Cannot delete while appointments exist
- **Legal Holds**: Account under legal retention
- **Administrative Review**: Requires further investigation
- **User Error**: Request submitted in error

---

## Administrative Dashboard Features

### System Monitoring
- **Log Analysis**: Track system events and errors
- **User Lookup**: Quick user identification
- **Deletion Queue**: Manage privacy requests
- **Audit Trails**: Maintain administrative action logs

### User Management
- **Account Verification**: Confirm user identities
- **Deletion Processing**: Handle privacy requests
- **Activity Monitoring**: Track user engagement
- **Support Assistance**: Aid customer service operations

### Compliance Support
- **GDPR Compliance**: Support right to erasure
- **Data Retention**: Configurable retention policies
- **Audit Logging**: Complete administrative action trail
- **Access Controls**: Role-based permission management

---

## Security and Access Control

### Role-Based Permissions
- **SUPER_ADMIN**: Full system access including user deletion
- **GEN_ADMIN**: General admin functions, limited deletion rights
- **ORG_ADMIN**: Organization-specific management only
- **THERAPIST/DOCTOR**: Healthcare provider functions only
- **PATIENT**: Personal healthcare management only

### Audit and Logging
- All administrative actions are logged
- Log entries include admin ID, timestamp, and action details
- Logs retained for compliance and security purposes
- Log access itself is audited

### Data Protection
- User lookup results exclude sensitive information
- Deletion requests anonymized in logs
- Admin actions tracked for accountability
- Access to logs restricted to authorized personnel

---

## Error Handling

### Common Error Responses
- `403 Forbidden`: Insufficient admin privileges
- `404 Not Found`: User, request, or log entry not found
- `400 Bad Request`: Invalid parameters or malformed request
- `429 Too Many Requests`: Rate limited access

### Validation Errors
- Email format validation for user lookup
- Request ID format validation
- Permission checks for all operations
- Data consistency validation

### Rate Limiting
- User lookup: 30 requests per minute
- Log access: 10 requests per minute
- Deletion actions: 5 requests per minute

---

## Integration and Automation

### Background Processing
- Deletion requests processed asynchronously
- Email notifications sent via background jobs
- Audit logs written to separate logging service
- Data retention managed by cleanup jobs

### Notification Systems
- User notifications for request status changes
- Admin alerts for high-priority requests
- System alerts for failed operations
- Compliance reporting notifications

### External Systems
- Integration with email service providers
- Connection to logging and monitoring systems
- Linkage with compliance reporting tools
- API connections to data retention systems

---

## Best Practices

### Administrative Operations
1. **Verify Identity**: Always use user lookup before actions
2. **Document Reasons**: Log reasons for approvals/rejections
3. **Secure Access**: Use secure channels for admin operations
4. **Regular Audits**: Review admin actions periodically

### Privacy Compliance
1. **Data Minimization**: Only access necessary user information
2. **Retention Limits**: Adhere to data retention policies
3. **User Consent**: Verify user consent for operations
4. **Audit Trails**: Maintain complete action history

### System Maintenance
1. **Log Rotation**: Implement log rotation policies
2. **Performance Monitoring**: Monitor admin operation performance
3. **Security Updates**: Keep admin tools updated
4. **Training**: Ensure admin training on procedures
