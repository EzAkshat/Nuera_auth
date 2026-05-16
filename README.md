<div align="center">

<br />

# 🔐 Nuera Auth System

**A production-ready authentication backend built with Node.js & Express.**  
Email/OTP registration · Google OAuth 2.0 · JWT sessions · Secure password reset

<br />

<p>
  <img src="https://img.shields.io/badge/Node.js-18+-000?style=flat-square&logo=node.js&logoColor=4ade80&labelColor=111" />
  <img src="https://img.shields.io/badge/Express-5-000?style=flat-square&logo=express&logoColor=fff&labelColor=111" />
  <img src="https://img.shields.io/badge/MongoDB-000?style=flat-square&logo=mongodb&logoColor=4ade80&labelColor=111" />
  <img src="https://img.shields.io/badge/Passport.js-000?style=flat-square&logo=passport&logoColor=34E27A&labelColor=111" />
  <img src="https://img.shields.io/badge/JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=fff&labelColor=111" />
  <img src="https://img.shields.io/badge/License-MIT-000?style=flat-square&labelColor=111" />
</p>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=16&pause=2000&color=6B7280&center=true&vCenter=true&repeat=true&width=480&lines=Email+%2B+OTP+Registration;Google+OAuth+2.0+Sign-In;JWT-based+Stateless+Auth;Secure+Password+Reset+Flow;Structured+Logging+with+Winston" alt="Typing SVG" />


[Features](#-features) · [Tech Stack](#tech-stack) · [Getting Started](#-getting-started) · [API Reference](#api-reference) · [Auth Flow](#authentication-flow) · [Security](#security)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📧 **Email Registration** | Sign up with email + password, verified via OTP |
| ✅ **OTP Verification** | Time-limited code sent to inbox before activation |
| 🔁 **Resend OTP** | Request a fresh code if the previous one expires |
| 🔑 **JWT Auth** | Stateless token issued on every successful login |
| 🌐 **Google OAuth 2.0** | One-click sign-in via Passport.js |
| 🔒 **Forgot Password** | Tokenized reset links delivered by email |
| 🔄 **Token Exchange** | Swap short-lived OAuth codes for full JWTs |
| 🛡️ **Input Validation** | All POST bodies sanitized with `express-validator` |
| 📨 **Transactional Email** | Branded HTML templates via Nodemailer + EJS |
| 📋 **Structured Logging** | JSON logs to console and file via Winston |

---

## Tech Stack

```
Runtime       Node.js 18+
Framework     Express.js v5
Database      MongoDB  ·  Mongoose ODM
Auth          Passport.js  ·  Google OAuth 2.0
Tokens        JSON Web Tokens  (jsonwebtoken)
Passwords     bcryptjs
Email         Nodemailer  ·  EJS templates
Validation    express-validator
Sessions      express-session  ·  cookie-parser
Logging       Winston
Config        dotenv
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- Google Cloud project with OAuth 2.0 credentials
- SMTP email account (Gmail App Password recommended)

**1 — Clone**
```bash
git clone https://github.com/EzAkshat/Nuera_auth
cd Nuera_auth
```

**2 — Install**
```bash
npm install
```

**3 — Configure**
```bash
cp .env.example .env
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

> For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) — not your account password.

**4 — Run**
```bash
npm start
# → http://localhost:3000
```

---

## Folder Structure

```txt
Nuera_auth/
│
├── config/
│   └── passport.js              # Google OAuth Passport configuration
│
├── controllers/
│   └── authController.js        # Core authentication logic
│
├── emails/
│   ├── forgotPasswordEmail.ejs  # Password reset email template
│   └── registrationEmail.ejs    # OTP / registration email template
│
├── models/
│   ├── OTP.js                   # OTP schema with expiry
│   ├── TempCode.js              # Temporary OAuth exchange code
│   ├── UnverifiedUser.js        # Pending user model
│   └── User.js                  # Main user schema
│
├── public/
│   ├── css/
│   │   └── styles.css           # Global styles
│   │
│   ├── img/
│   │   ├── eye-close.svg
│   │   └── eye-open.svg
│   │
│   ├── js/
│   │   ├── forgotPassword.js
│   │   ├── login.js
│   │   ├── notifications.js
│   │   ├── register.js
│   │   ├── resetPassword.js
│   │   └── verifyOtp.js
│   │
│   ├── forgotPassword.html
│   ├── login.html
│   ├── register.html
│   ├── resetPassword.html
│   └── verifyOtp.html
│
├── routes/
│   ├── auth.js                  # Authentication routes
│   └── google.js                # Google OAuth routes
│
├── services/
│   └── emailService.js          # Nodemailer utilities
│
├── utils/
│   └── jwt.js                   # JWT helper functions
│
├── views/
│   └── authComplete.ejs         # OAuth completion page
│
├── .env.example                 # Example environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js                    # App entry point
```

---

## API Reference

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

## Authentication Flow

### Email / Password Registration

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

### Google OAuth 2.0 Flow

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

### Password Reset Flow

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

## Security

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

## Core Modules

| File | Purpose |
|---|---|
| `controllers/authController.js` | All auth logic — registration, OTP, login, reset, OAuth, token exchange |
| `config/passport.js` | Google OAuth 2.0 strategy — user upsert + session serialization |
| `services/emailService.js` | Nodemailer transporter — renders EJS templates and sends mail |
| `utils/jwt.js` | `signToken` / `verifyToken` — JWT logic in one place |
| `models/User.js` | Verified users with hashed passwords and optional Google ID |
| `models/UnverifiedUser.js` | Temporary record — deleted after OTP success |
| `models/OTP.js` | OTP records with TTL index for auto-expiry |
| `models/TempCode.js` | Short-lived code for OAuth → JWT exchange |

---

## Roadmap

- [ ] Rate limiting on `/login`, `/register`, `/resend-otp` (`express-rate-limit`)
- [ ] Refresh token support with rotation
- [ ] Multi-factor authentication (TOTP / Authenticator apps)
- [ ] Role-based access control (RBAC)
- [ ] Redis-backed sessions for horizontal scaling
- [ ] Swagger / OpenAPI documentation
- [ ] Unit + integration test suite (Jest / Supertest)
- [ ] Docker + docker-compose for one-command dev environment

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Author

**Akshat Naik**

<a href="https://github.com/EzAkshat">
  <img src="https://img.shields.io/badge/GitHub-EzAkshat-000?style=flat-square&logo=github&logoColor=white&labelColor=111" />
</a>
&nbsp;
<a href="https://www.linkedin.com/in/naik-akshat">
  <img src="https://img.shields.io/badge/LinkedIn-naik--akshat-0077B5?style=flat-square&logo=linkedin&logoColor=white&labelColor=111" />
</a>

---

<div align="center">
  <sub>⭐ Star this repo if it helped you — it means a lot!</sub>
</div>