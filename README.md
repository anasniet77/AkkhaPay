# PayWallet

A full-stack financial wallet application enabling user registration, secure JWT authentication, P2P fund transfers, and Razorpay-powered deposits.

## Architecture

```
PayWallet/
├── backend/          # Spring Boot REST API
├── frontend/         # React SPA (Vite + TypeScript)
├── docker-compose.yml
└── render.yaml       # Render.com Blueprint
```

- **Backend:** Layered Spring Boot API — Controllers → Services → Repositories → Entities
- **Frontend:** React SPA with protected routing, Axios interceptors, and Razorpay Checkout
- **Database:** MySQL with Flyway-managed schema migrations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.4, Maven, Spring Security (JWT), Spring Data JPA, Hibernate, Flyway |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7 |
| Database | MySQL 8, HikariCP |
| Integrations | Razorpay (Payments), Twilio (SMS/OTP), Gmail SMTP |

## Prerequisites

- Java JDK 21+
- Maven 3.9+
- Node.js 20+
- MySQL 8
- Docker & Docker Compose (optional, for containerized deployment)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | JDBC connection URL | `jdbc:mysql://localhost:3306/banking_wallet` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | — |
| `JWT_SECRET` | Base64-encoded JWT signing key | dev placeholder |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | — |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret | — |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | — |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | — |
| `TWILIO_PHONE_NUMBER` | Twilio sending number (E.164) | — |
| `MAIL_USERNAME` | Gmail address for SMTP | — |
| `MAIL_PASSWORD` | Gmail App Password | — |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key for Checkout | — |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080/api/v1` |

## Local Setup

### 1. Database

```sql
CREATE DATABASE banking_wallet;
```

### 2. Backend

```bash
cd backend
# Copy and fill your env file
cp .env.example .env

# Build and run (Maven passes env vars from shell)
mvn clean compile
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. Flyway runs migrations automatically.

### 3. Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register a new user |
| POST | `/api/v1/auth/login` | Public | Login and receive JWT |
| POST | `/api/v1/auth/send-otp` | Public | Send OTP via Twilio |
| GET | `/api/v1/wallets/user/{id}` | JWT | Get wallet details |
| POST | `/api/v1/transactions/transfer` | JWT | P2P fund transfer |
| GET | `/api/v1/transactions/user/{id}` | JWT | Transaction history |
| POST | `/api/v1/payments/create-order` | JWT | Create Razorpay order |
| POST | `/api/v1/payments/verify` | JWT | Verify payment & credit wallet |

## Docker

```bash
docker-compose up --build -d
```

| Service | Port |
|---------|------|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| MySQL | `localhost:3306` |
