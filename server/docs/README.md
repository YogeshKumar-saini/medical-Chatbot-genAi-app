# Medical AI Assistant API Documentation

This directory contains comprehensive documentation for all API endpoints organized by user role and functionality.

## 📋 Documentation Files

### 🔐 Authentication & Common Routes
- **[`AUTHENTICATION_ROUTES.md`](AUTHENTICATION_ROUTES.md)** - User registration, login, email verification
- **[`API_ROUTES_README.md`](API_ROUTES_README.md)** - Complete overview of all endpoints

### 👑 Administrative Routes
- **[`SUPER_ADMIN_ROUTES.md`](SUPER_ADMIN_ROUTES.md)** - System-wide administration (user management, organization verification)
- **[`ORG_ADMIN_ROUTES.md`](ORG_ADMIN_ROUTES.md)** - Organization management (members, approvals, settings)
- **[`GENERAL_ADMIN_ROUTES.md`](GENERAL_ADMIN_ROUTES.md)** - General admin functions (logs, user lookup, deletion requests)

### 👨‍⚕️ Healthcare Professional Routes
- **[`THERAPIST_DOCTOR_ROUTES.md`](THERAPIST_DOCTOR_ROUTES.md)** - Medical practice management (appointments, prescriptions, patient care)

### 👤 Patient Routes
- **[`PATIENT_ROUTES.md`](PATIENT_ROUTES.md)** - Personal healthcare management (appointments, records, doctor connections)

## 🎯 Role-Based Access Control

| Role | Description | Key Capabilities |
|------|-------------|------------------|
| **SUPER_ADMIN** | System administrator | Full system control, user management, organization verification |
| **ORG_ADMIN** | Organization administrator | Manage organization members, approve requests, organization settings |
| **GEN_ADMIN** | General administrator | System monitoring, user lookup, deletion processing |
| **THERAPIST/DOCTOR** | Healthcare provider | Patient care, appointments, prescriptions, medical records |
| **PATIENT** | Healthcare consumer | Personal health management, appointment booking, record access |

## 📖 Documentation Structure

Each documentation file includes:

### ✅ **Purpose & Context**
- Why the endpoint exists
- Business logic and use cases
- Integration points

### ✅ **Technical Details**
- Input JSON formats with field descriptions
- Output JSON formats with response structures
- Error handling and validation

### ✅ **Security & Compliance**
- Authentication requirements
- Rate limiting information
- Privacy and security considerations

### ✅ **Practical Examples**
- cURL command examples
- Parameter combinations
- Real-world usage scenarios

## 🚀 Quick Start

1. **Choose your role** from the table above
2. **Open the corresponding documentation file**
3. **Find the endpoint** you need to implement
4. **Copy the JSON examples** for request/response handling
5. **Test with the provided cURL commands**

## 🔧 Development Setup

### Test Accounts Available
- `superadmin@gmail.com` / `password123` (SUPER_ADMIN)
- `yksaini1090@gmail.com` / `password123` (ORG_ADMIN)
- `ysaini0193@gmail.com` / `password123` (THERAPIST)
- `yksaini0192@gmail.com` / `password123` (PATIENT)

### API Base URL
```
Production: https://api.mymanah.com
Development: http://localhost:8000
```

### Authentication
All protected endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## 📊 API Health & Monitoring

### Health Check Endpoints
- `GET /health` - Basic health status
- `GET /health/detailed` - Comprehensive system status

### System Logs
- Access via admin routes for debugging and monitoring
- Structured logging with user context and timestamps

## 🔒 Security Features

### HIPAA Compliance
- Patient data encryption at rest and in transit
- Role-based access controls
- Audit trails for all data access
- Secure communication channels

### Rate Limiting
- Authentication: 5-10 requests per hour per IP
- Chat/Document processing: 50-100 per hour per user
- Administrative actions: 5-30 per hour per admin

### Data Protection
- JWT tokens with 24-hour expiration
- bcrypt password hashing
- MongoDB encrypted connections
- Input validation and sanitization

## 🏥 Healthcare Workflow

### Patient Journey
1. **Registration** → Account creation and email verification
2. **Profile Setup** → Personal and medical information
3. **Organization Join** → Healthcare facility membership
4. **Doctor Connection** → Find and connect with healthcare providers
5. **Care Management** → Book appointments, access records, receive care

### Provider Journey
1. **Professional Setup** → Credentials and specialization
2. **Organization Membership** → Join healthcare facilities
3. **Patient Connections** → Accept patient relationship requests
4. **Practice Management** → Schedule, appointments, prescriptions
5. **Care Delivery** → Virtual consultations and treatment

### Administrative Oversight
1. **Organization Management** → Approve members and manage facilities
2. **System Administration** → User oversight and system monitoring
3. **Compliance Management** → Privacy requests and data governance

## 📞 Support & Integration

### External Integrations
- **LiveKit**: Video conferencing for telemedicine
- **MongoDB**: Document database for healthcare records
- **Pinecone**: Vector database for AI-powered search
- **Grok**: AI language model for medical queries

### API Versioning
- Current version: v1 (`/api/v1/`)
- Semantic versioning for breaking changes
- Backward compatibility maintained

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

## 📋 Checklist for Implementation

- [ ] Review role-based access requirements
- [ ] Implement authentication flow
- [ ] Set up user onboarding workflows
- [ ] Configure organization management
- [ ] Integrate appointment scheduling
- [ ] Implement medical record access
- [ ] Add prescription management
- [ ] Set up video consultation links
- [ ] Configure notification systems
- [ ] Implement audit logging
- [ ] Test role-based permissions
- [ ] Validate HIPAA compliance
- [ ] Set up monitoring and alerts

## 🤝 Contributing

When adding new endpoints:
1. Update the appropriate role documentation file
2. Include input/output JSON examples
3. Document error responses and validation rules
4. Add security considerations and rate limits
5. Provide cURL examples for testing
6. Update this README with any new documentation files

---

**Last Updated**: December 7, 2025
**API Version**: v1.0.0
**Documentation Version**: 1.0.0
