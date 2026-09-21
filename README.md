# PayWallet

PayWallet is an enterprise-grade financial wallet application that allows users to manage their funds, perform peer-to-peer (P2P) transfers, and securely top-up their balance.

## Architecture

The application is built using a clean, separated architecture:
- **Backend:** A robust REST API built with Java and Spring Boot, implementing stateless JWT authentication and a layered design (Controllers, Services, Repositories).
- **Frontend:** A modern single-page application (SPA) built with React and Vite, featuring an enterprise-grade UI system and secure client-side routing.
- **Database:** Relational data persistence handled by MySQL, with automated schema migrations via Flyway.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.4, Maven, Spring Security (JWT), Spring Data JPA, Hibernate, Flyway
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router
- **Database:** MySQL 8, HikariCP
- **Integrations:** Razorpay (Payment Gateway), Twilio (SMS / OTP)

## Prerequisites

To run this project locally, ensure you have the following installed:
- Node.js (v20+)
- Java JDK (21+)
- Maven (3.9+)
- Docker & Docker Compose (for containerized deployment)

## Environment Variables

Create a `.env` file in both the `backend/` and `frontend/` directories using their respective `.env.example` templates.

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | Database password (e.g., `Anas786`) |
| `JWT_SECRET` | 256-bit Base64 encoded secret for signing JWTs |
| `JWT_EXPIRATION` | Token validity duration in ms (default: `86400000`) |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number (E.164 format) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_RAZORPAY_KEY_ID`| Razorpay API Key ID (public key for checkout) |

## Local Setup Instructions (Without Docker)

1. **Database Initialization**
   Ensure MySQL is running on port `3306` and create a database named `paywallet`.
   ```sql
   CREATE DATABASE paywallet;
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # Ensure your .env file is populated
   mvn clean compile
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`. Flyway will automatically execute all database migrations.

3. **Frontend Setup**
   ```bash
   cd frontend
   # Ensure your .env file is populated
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`.

## Docker Orchestration

You can spin up the entire stack (MySQL, Backend, Frontend) using Docker Compose.

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

