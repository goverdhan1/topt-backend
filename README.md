# OTP Google Drive Authentication System

A secure admin-controlled user onboarding system with Twilio Verify and Google Drive integration.

## 📊 **CURRENT STATUS**

**✅ BACKEND COMPLETE** - All server-side functionality is implemented and ready for testing

**❌ FRONTEND MISSING** - React application needs to be created

**❌ TESTING MISSING** - No tests implemented yet

## 🚀 **Features**

### Admin Portal
- ✅ Demo login with hardcoded credentials
- ✅ User management (add, verify, delete users)
- ✅ Document management (CRUD operations for Google Drive links)
- ✅ User verification via Twilio Caller ID API
- ✅ Comprehensive audit logging
- ✅ Rate limiting and security middleware

### User Portal
- ✅ OTP-based authentication via Twilio Verify
- ✅ Access to shared Google Drive documents
- ✅ Session-based authentication with JWT
- ✅ Profile management
- ✅ Document search functionality

### Security Features
- ✅ HTTPS enforcement
- ✅ Role-based access control (Admin vs User)
- ✅ Secure credential storage via environment variables
- ✅ GDPR-compliant user data handling
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Audit logging for all actions

## 🛠 **Technical Stack**

- **Backend**: Node.js/Express
- **Frontend**: React (to be implemented)
- **Database**: SQLite (for demo), PostgreSQL/MySQL (production)
- **Authentication**: JWT with session management
- **External APIs**: Twilio Verify, Twilio Caller ID, Google Drive API
- **Security**: Helmet, Rate Limiting, Input Validation

## 📋 **Quick Start**

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` in the backend directory and configure:
```bash
cp backend/.env.example backend/.env
```

Required environment variables:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here

# Google Drive API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/admin/google/callback

# Application Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Admin Credentials (for demo purposes)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=demo123

# Server Configuration
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=./database.sqlite
```

### 3. Initialize Database
```bash
npm run db:init
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 🧪 **Testing the Backend**

### Health Check
```bash
curl http://localhost:3001/health
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}'
```

### Add User (Triggers Twilio Verification)
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"mobile": "+1234567890"}'
```

### Request OTP for User Login
```bash
curl -X POST http://localhost:3001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+1234567890"}'
```

### Verify OTP and Login
```bash
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+1234567890", "otp": "123456"}'
```

### Get User Documents
```bash
curl -X GET http://localhost:3001/api/user/documents \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## 📚 **API Documentation**

### Admin Endpoints (`/api/admin/*`)

#### Authentication
- `POST /login` - Admin login
- `POST /logout` - Admin logout
- `GET /profile` - Get admin profile

#### User Management
- `POST /users` - Add user and trigger Twilio verification
- `GET /users` - List all users with pagination
- `GET /users/:id` - Get user details
- `PUT /users/:id/verify` - Manually verify user
- `DELETE /users/:id` - Delete user

#### Document Management
- `GET /documents` - List documents with pagination
- `POST /documents` - Create document link
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document

### Auth Endpoints (`/api/auth/*`)

#### User Authentication
- `POST /request-otp` - Request OTP for login
- `POST /verify-otp` - Verify OTP and authenticate
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `POST /refresh` - Refresh JWT token
- `GET /status` - Check authentication status

### User Endpoints (`/api/user/*`)

#### Document Access
- `GET /documents` - List available documents
- `GET /documents/:id` - Get document details
- `GET /documents/search?q=query` - Search documents

#### Profile Management
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Twilio Endpoints (`/api/twilio/*`)

#### Callbacks
- `POST /caller-id-callback` - Handle Twilio caller ID verification
- `POST /sms-callback` - Handle SMS status callbacks
- `POST /verify-callback` - Handle OTP verification callbacks

#### Status
- `GET /status` - Get Twilio service status

## 🗄 **Database Schema**

The system uses SQLite with the following main tables:
- `admins` - Admin user accounts
- `users` - User accounts with phone verification
- `documents` - Google Drive document links
- `user_sessions` - JWT session management
- `admin_sessions` - Admin session management
- `audit_logs` - Comprehensive audit trail

## 🔐 **Security Features**

### Authentication & Authorization
- JWT tokens with configurable expiration
- Session-based authentication
- Role-based access control
- Secure password hashing with bcrypt

### Input Validation & Sanitization
- Express-validator for request validation
- Input sanitization to prevent XSS
- SQL injection protection via parameterized queries

### Rate Limiting
- General API rate limiting (100 requests/15min)
- Strict auth rate limiting (5 requests/15min)
- OTP rate limiting (3 requests/5min)

### Security Headers
- Helmet.js security headers
- Content Security Policy (CSP)
- CORS configuration
- HTTPS enforcement

### Audit & Monitoring
- Comprehensive audit logging
- Request/response logging
- Error tracking and monitoring
- Session cleanup automation

## 🚀 **Deployment**

### Separate Backend/Frontend Deployment
This project is configured for separate backend and frontend deployment:

**Backend Deployment:**
- Backend has its own `package.json` and dependencies
- Environment variables are in `backend/.env`
- Deploy the `backend/` folder as a separate Node.js application
- Procfile points to `backend/index.js`

**Frontend Deployment:**
- Frontend has its own `package.json` in `frontend/` folder
- Deploy the `frontend/` folder as a separate React application

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures
- [ ] Security audit completed

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
DATABASE_URL=your_production_database_url
CORS_ORIGIN=https://topt-frontend.vercel.app/
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite file exists and has proper permissions
   - Check `DATABASE_URL` environment variable

2. **Twilio API Errors**
   - Verify Twilio credentials in environment variables
   - Check Twilio account balance and status
   - Ensure phone numbers are in E.164 format

3. **Google Drive API Errors**
   - Verify Google API credentials
   - Check OAuth redirect URI configuration
   - Ensure proper API scopes are enabled

4. **JWT Authentication Errors**
   - Check `JWT_SECRET` environment variable
   - Verify token expiration settings
   - Ensure proper token format in Authorization header

### Debug Mode
Set `NODE_ENV=development` to get detailed error messages and stack traces.

## 📝 **Development Notes**

### Project Structure
```
├── backend/               # Backend API
│   ├── config/            # Database and configuration
│   ├── middleware/        # Authentication and security
│   ├── routes/           # API endpoints
│   ├── services/         # External API integrations
│   ├── scripts/          # Database and utility scripts
│   ├── .env              # Environment variables (for separate deployment)
│   ├── .env.example      # Environment variables template
│   ├── package.json      # Backend dependencies
│   └── index.js          # Main server file
├── frontend/             # React frontend application
│   └── package.json      # Frontend dependencies
├── TODO.md              # Implementation status
├── package.json         # Main project dependencies and scripts
└── Procfile             # Deployment configuration
```

### Next Steps
1. **Frontend Development** - Create React application
2. **Testing Suite** - Implement comprehensive tests
3. **Documentation** - Add API documentation
4. **Production Deployment** - Set up production environment

## 📄 **License**

This project is for demonstration purposes. Please ensure compliance with Twilio and Google API terms of service.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

**Status**: Backend API Complete | Frontend: In Development | Testing: Pending
