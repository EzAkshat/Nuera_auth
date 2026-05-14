<div align="center">

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Passport.js-34E27A?style=for-the-badge&logo=passport&logoColor=white" />
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
<img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" />

<br /><br />

# 🔐 Nuera Auth System

**A production-ready, full-featured authentication backend built with Node.js & Express.**  
Supports email/password registration with OTP verification, Google OAuth 2.0, JWT-based sessions, and secure password reset flows — all wired to MongoDB.

<br />

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Auth Flow](#-authentication-flow) · [Folder Structure](#-folder-structure) 

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📧 **Email Registration** | Users register with email + password and receive an OTP for verification |
| ✅ **OTP Verification** | Time-sensitive one-time passwords sent via email before account activation |
| 🔁 **Resend OTP** | Users can request a fresh OTP if the previous one expires |
| 🔑 **JWT Authentication** | Stateless token-based auth returned on successful login |
| 🌐 **Google OAuth 2.0** | One-click sign-in via Google with Passport.js |
| 🔒 **Forgot Password** | Secure email-based password reset with tokenized links |
| 🔄 **Token Exchange** | Temporary code-to-JWT exchange endpoint for OAuth flows |
| 🛡️ **Input Validation** | All incoming requests validated with `express-validator` |
| 📨 **Transactional Emails** | Branded HTML emails via Nodemailer (registration & password reset) |
| 📋 **Winston Logging** | Structured JSON logs to console and file for observability |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Database** | MongoDB via Mongoose |
| **Auth Strategy** | Passport.js + Google OAuth 2.0 |
| **Token** | JSON Web Tokens (jsonwebtoken) |
| **Password Hashing** | bcryptjs |
| **Email** | Nodemailer |
| **Validation** | express-validator |
| **Templating** | EJS (email templates & OAuth completion view) |
| **Logging** | Winston |
| **Config** | dotenv |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- A Google Cloud project with OAuth 2.0 credentials
- An SMTP email account (e.g. Gmail App Password)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nuera-auth-system.git
cd nuera-auth-system/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp ../.env .env
```

```env
MONGO_URI=mongodb://localhost:27017/Nuera
PORT=3000
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
ABSTRACT_API_KEY=your_abstract_api_key
```

> **Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) rather than your account password.

### 4. Start the server

```bash
npm start
```

The server will be live at **`http://localhost:3000`**

---

## 📁 Folder Structure

```
backend/
├── config/
│   └── passport.js              # Google OAuth 2.0 Passport strategy
├── controllers/
│   └── authController.js        # Core business logic for all auth flows
├── emails/
│   ├── registrationEmail.ejs    # Branded welcome / OTP email template
│   └── forgotPasswordEmail.ejs  # Password reset email template
├── models/
│   ├── User.js                  # Verified user schema
│   ├── UnverifiedUser.js        # Temporary user pending OTP
│   ├── OTP.js                   # OTP record with expiry
│   └── TempCode.js              # Short-lived token for OAuth exchange
├── public/
│   ├── login.html
│   ├── register.html
│   ├── verifyOtp.html
│   ├── forgotPassword.html
│   ├── resetPassword.html
│   ├── css/styles.css
│   ├── js/                      # Client-side JS per page
│   └── img/                     # UI assets
├── routes/
│   ├── auth.js                  # All authentication endpoints
│   └── google.js                # Google OAuth routes
├── services/
│   └── emailService.js          # Nodemailer transporter & send helpers
├── utils/
│   └── jwt.js                   # JWT sign / verify utilities
├── views/
│   └── authComplete.ejs         # OAuth completion handshake view
├── .env
├── server.js                    # Application entry point
└── package.json
```

---

## 🔌 API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/login` | Serve login page |
| `GET` | `/register` | Serve registration page |
| `GET` | `/verify-otp` | Serve OTP verification page |
| `GET` | `/forgot-password` | Serve forgot password page |
| `GET` | `/reset-password` | Serve reset password page |
| `POST` | `/register` | Create unverified user + send OTP email |
| `POST` | `/verify-otp` | Verify OTP and activate account |
| `POST` | `/resend-otp` | Resend a fresh OTP to user's email |
| `POST` | `/login` | Authenticate user + return JWT |
| `POST` | `/forgot-password` | Send password reset email |
| `POST` | `/reset-password` | Reset password using tokenized link |
| `POST` | `/token` | Exchange temp code for JWT (OAuth) |

### Google OAuth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/web` | Initiate Google OAuth (web client flag) |
| `GET` | `/auth/google/callback` | OAuth callback + session / token generation |

---

## 🔄 Authentication Flow

### 📋 Email / Password Registration

```
User fills register form
        │
        ▼
POST /register ──► Validate input ──► Hash password
        │
        ▼
Save to UnverifiedUser collection
        │
        ▼
Generate OTP ──► Save to OTP collection ──► Send email
        │
        ▼
POST /verify-otp ──► Match OTP + check expiry
        │
        ▼
Move user to User collection ──► Issue JWT
```

### 🌐 Google OAuth 2.0 Flow

```
User clicks "Sign in with Google"
        │
        ▼
GET /auth/google ──► Redirect to Google consent screen
        │
        ▼
GET /auth/google/callback ──► Passport verifies token
        │
        ▼
Upsert user in DB ──► Generate temp code
        │
        ▼
POST /token ──► Exchange temp code for JWT
```

### 🔒 Password Reset Flow

```
POST /forgot-password ──► Validate email exists
        │
        ▼
Generate signed reset token ──► Send email with link
        │
        ▼
User clicks link ──► POST /reset-password
        │
        ▼
Validate token + expiry ──► Hash new password ──► Update DB
```

---

## 🛡️ Security

| Practice | Implementation |
|---|---|
| **Password Hashing** | `bcryptjs` with salt rounds |
| **JWT Secrets** | Stored in `.env`, never hardcoded |
| **OTP Expiry** | OTPs are time-limited and single-use |
| **Input Validation** | All POST bodies validated via `express-validator` |
| **Session Security** | `express-session` with `saveUninitialized: false` |
| **HTTPS Ready** | Cookie `secure` flag configurable for production |
| **Temp Code Cleanup** | TempCode records expire after OAuth token exchange |
| **Structured Logging** | Errors captured by Winston, never exposed to client |

> ⚠️ **Before deploying to production:** set `cookie.secure = true`, enforce HTTPS, and rotate all secrets in `.env`.

---

## 🗺️ Core Modules

### `controllers/authController.js`
The heart of the system. Handles all authentication logic: registration, OTP verification, login, password reset, Google OAuth callback, and token exchange. All route handlers delegate here.

### `config/passport.js`
Configures the `passport-google-oauth20` strategy. Handles user lookup or upsert on first-time Google sign-in, and serializes the user for the session.

### `services/emailService.js`
Wraps Nodemailer with a configured transporter. Provides helpers to send OTP and password-reset emails using EJS templates rendered to HTML strings.

### `utils/jwt.js`
Thin utility layer around `jsonwebtoken` — exposes `signToken` and `verifyToken` to keep JWT logic centralized and easy to test.

### `models/`

| Model | Purpose |
|---|---|
| `User.js` | Verified, active users with hashed passwords and optional Google ID |
| `UnverifiedUser.js` | Temporary record created at registration, deleted after OTP success |
| `OTP.js` | Stores OTPs with TTL index for automatic expiration |
| `TempCode.js` | Short-lived code issued after Google OAuth for secure client token exchange |

---

## 🔮 Future Improvements

- [ ] Rate limiting on `/login`, `/register`, and `/resend-otp` (`express-rate-limit`)
- [ ] Refresh token support with rotation
- [ ] Multi-factor authentication (TOTP / Authenticator apps)
- [ ] Role-based access control (RBAC)
- [ ] Redis-backed sessions for horizontal scaling
- [ ] Swagger / OpenAPI documentation
- [ ] Unit + integration test suite (Jest / Supertest)
- [ ] Docker + docker-compose for one-command dev environment

---

## 👤 Author

Built with ❤️ by **[Akshat](https://github.com/EzAkshat)**

<a href="https://github.com/EzAkshat">
  <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
</a>
<a href="https://www.linkedin.com/in/naik-akshat">
  <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>

---


<div align="center">
  <sub>⭐ Star this repo if it helped you — it means a lot!</sub>
</div>