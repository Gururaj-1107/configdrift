# ConfigDrift — Environment Configuration Validator

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/MongoDB-Local%20%7C%20Atlas-47a248.svg)](https://www.mongodb.com/)

> **ConfigDrift** is a full-stack developer productivity platform designed to detect, highlight, and validate configuration divergence across **Development**, **Testing**, and **Production** environments before inconsistent values, missing keys, or exposed credentials cause runtime outages.

---

## Table of Contents
- [1. Overview & Problem Statement](#1-overview--problem-statement)
- [2. Key Features](#2-key-features)
- [3. Architecture & System Design](#3-architecture--system-design)
- [4. Technology Stack](#4-technology-stack)
- [5. Getting Started Locally](#5-getting-started-locally)
- [6. Database Setup, Diagnostics & Seeding](#6-database-setup-diagnostics--seeding)
- [7. Environment Variables](#7-environment-variables)
- [8. API Reference](#8-api-reference)
- [9. Running Tests](#9-running-tests)
- [10. Security & Secret Protection](#10-security--secret-protection)

---

## 1. Overview & Problem Statement

Modern software architectures depend on dozens of environment variables across distributed services. Discrepancies between environments frequently trigger deployment regressions:
- A developer configures `API_TIMEOUT=5000` locally, but production runs with an uncalibrated default or missing key.
- Development-only flags (e.g., `DEBUG=true`, `BYPASS_AUTH=true`) are inadvertently deployed to production.
- Private credentials, tokens, and database passwords are exposed in plain text.
- Variable data types (strings vs numbers vs booleans) diverge silently.

**ConfigDrift** provides deterministic comparison algorithms, type and range validation rules, automatic secret detection, and exportable drift audit reports to maintain configuration parity across all deployment stages.

---

## 2. Key Features

- **Multi-Environment Snapshots**: Capture and version configuration states for **Development**, **Testing**, and **Production**.
- **Flexible Ingestion**: Ingest configurations via `.env` file syntax, structured JSON, or direct key-value inputs.
- **Deterministic Comparison**: Side-by-side differential engine identifying matching keys, value discrepancies, missing keys, and unexpected variables without external AI dependencies.
- **Configurable Validation Rules**: Enforce required keys, numeric range bounds, URL/email formats, and environment-specific constraints.
- **Automated Secret Masking**: Proactively detects and redacts tokens, credentials, and private keys in both the user interface and export files.
- **Drift Reports & Export**: Categorize findings by severity (`Error`, `Warning`, `Info`) and export reports as JSON or CSV.
- **Audit History**: Preserve snapshot versions and historical comparison audits over time.

---

## 3. Architecture & System Design

```text
configdrift/
├── client/                     # React 18+ (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Modals, Badges, Tables, Inputs)
│   │   ├── contexts/           # State providers (AuthContext, etc.)
│   │   ├── pages/              # Application views (Dashboard, Workspace, Login)
│   │   ├── services/           # Axios API services
│   │   ├── App.jsx             # Root application and routing
│   │   ├── index.css           # Tailwind styling directives
│   │   └── main.jsx            # Entry point
│   ├── tailwind.config.js      # Design tokens and theme settings
│   ├── vite.config.js          # Build configuration with backend proxy
│   └── package.json
├── server/                     # Node.js + Express.js Backend
│   ├── src/
│   │   ├── config/             # Database connection and environment config
│   │   ├── controllers/        # Request handlers (auth, project, snapshot, compare)
│   │   ├── middleware/         # Security guards, JWT validation, error handling
│   │   ├── models/             # Mongoose schemas (User, Project, Snapshot, Rule, Report)
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── services/           # Comparison engine, rule evaluator, env parser
│   │   ├── utils/              # Token generators, secret detectors
│   │   ├── app.js              # Express app setup and middleware pipeline
│   │   └── server.js           # HTTP listener
│   ├── tests/                  # Jest & Supertest automated test suites
│   ├── .env.example
│   └── package.json
├── docs/                       # Specifications and diagrams
├── .env.example                # Root environment variable documentation
├── .gitignore                  # Git ignore rules for node_modules, .env, build output
├── package.json                # Root orchestration for running client & server concurrently
└── README.md
```

---

## 4. Technology Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose (Local `mongodb://127.0.0.1:27017/configdrift` or MongoDB Atlas)
- **API Communication**: RESTful JSON APIs
- **Testing**: Jest and Supertest
- **Security**: Helmet, CORS, bcryptjs, JSON Web Tokens (JWT)

---

## 5. Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### 1. Clone the Repository
```bash
git clone https://github.com/Gururaj-1107/configdrift.git
cd configdrift
```

### 2. Install Dependencies
Install all root, server, and client dependencies:
```bash
npm run install:all
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the `server` directory:
```bash
cp server/.env.example server/.env
```
Ensure `MONGODB_URI` points to your MongoDB instance:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/configdrift
JWT_SECRET=super_secret_jwt_key_for_development_configdrift
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. Run the Application
Run both client and server concurrently from the root directory:
```bash
npm run dev
```

Alternatively, run in separate terminals:
- **Server**: `npm run dev:server` (runs on `http://localhost:5000`)
- **Client**: `npm run dev:client` (runs on `http://localhost:5173`)

Access the web interface at [http://localhost:5173](http://localhost:5173).

---

## 6. Database Setup, Diagnostics & Seeding

ConfigDrift requires a MongoDB database to persist users, projects, snapshots, validation rules, and audit reports. You can connect using either **MongoDB Atlas (free cloud, zero installation required)** or a **local MongoDB instance**.

### Database Architecture & Models
The application defines 5 relational Mongoose schemas:
1. **User** (`users`): Authentication, encrypted password hashes, and profile metadata.
2. **Project** (`projects`): Workspace boundary owned by a user, with compound indexes.
3. **Snapshot** (`snapshots`): Versioned environment captures (`development`, `testing`, `production`) with parsed typed variables and secret flags.
4. **ValidationRule** (`validationrules`): Deterministic constraints (`range`, `type`, `forbidden_in_env`, `regex`, `required`).
5. **DriftReport** (`driftreports`): Historical comparison findings, status categorizations, and severity summaries.

### Connecting to MongoDB

#### Option A: MongoDB Atlas (Cloud — Recommended, 2-Minute Free Setup)
1. Navigate to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create an **M0 Free Tier Cluster** in your preferred region.
3. Under **Security → Quickstart**:
   - Create a database user with username and password (e.g., `configdrift_admin`).
   - Under **Network Access**, select **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current IP address.
4. Click **Connect → Drivers (Node.js)** and copy your connection string.
5. Paste into `server/.env`:
   ```ini
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/configdrift?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB (Windows Community Server)
1. Download MongoDB Community Server from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Install as a "Network Service".
3. Keep default URI in `server/.env`:
   ```ini
   MONGODB_URI=mongodb://127.0.0.1:27017/configdrift
   ```

#### Option C: Local Docker Container
Run an isolated MongoDB container on port 27017:
```bash
docker run -d --name configdrift-mongo -p 27017:27017 mongo:latest
```

### Database Verification & Health Check
Test and verify your database connection string and collection status at any time:
```bash
npm run db:check
```

### Seeding Demo Data
Populate the database with realistic demonstration data:
```bash
npm run seed
```
This automatically initializes:
- **Demo User Account**: `demo@configdrift.com` / `Password123!`
- **Demo Project**: FinTech Core Platform
- **3 Multi-Environment Snapshots**: Development (v1), Testing (v1), Production (v1) with intentional drift (timeout divergence, type mismatches, missing flags, secrets)
- **5 Validation Rules**: Out-of-range bounds, production forbidden flags, mandatory secret checks
- **Historical Drift Report**: Pre-computed comparison and severity audit trail

---

## 7. Environment Variables

| Variable | Description | Default (Development) |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string (Local or Atlas) | `mongodb://127.0.0.1:27017/configdrift` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `super_secret_jwt_key...` |
| `JWT_EXPIRES_IN`| Token expiration timeframe | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

---

## 8. API Reference

### System
- `GET /api/health` — Service health and database connection status.
- `GET /` — API welcome message.

### Authentication
- `POST /api/auth/register` — Register a new user account.
- `POST /api/auth/login` — Authenticate and receive a JWT token.
- `GET /api/auth/me` — Retrieve the authenticated user's profile.

### Projects
- `GET /api/projects` — List all projects owned by the authenticated user.
- `POST /api/projects` — Create a new project workspace.
- `GET /api/projects/:id` — Get project details by ID.
- `PUT /api/projects/:id` — Update project name or description.
- `DELETE /api/projects/:id` — Delete a project and cascade-delete child snapshots, rules, and reports.

### Environment Snapshots
- `GET /api/projects/:projectId/snapshots` — List snapshots for a project (filterable by `?environment=`).
- `GET /api/projects/:projectId/snapshots/latest` — Fetch the latest snapshot for each environment.
- `POST /api/projects/:projectId/snapshots` — Create a new snapshot from `.env`, JSON, or key-value entries.
- `GET /api/projects/:projectId/snapshots/:id` — Retrieve snapshot details by ID.
- `DELETE /api/projects/:projectId/snapshots/:id` — Delete a snapshot.

### Comparison & Validation
- `POST /api/projects/:projectId/compare` — Compare two environment snapshots side-by-side.
- `GET /api/projects/:projectId/rules` — List validation rules configured for a project.
- `POST /api/projects/:projectId/rules` — Create a validation rule.
- `DELETE /api/projects/:projectId/rules/:id` — Remove a validation rule.

### Drift Reports
- `GET /api/projects/:projectId/reports` — List past comparison reports.
- `POST /api/projects/:projectId/reports` — Save a comparison as an audit report.
- `GET /api/projects/:projectId/reports/:id` — Get full details of a saved drift report.
- `DELETE /api/projects/:projectId/reports/:id` — Delete a drift report.
- `GET /api/projects/:projectId/reports/:id/export` — Export a report in JSON or CSV format.

---

## 9. Running Tests

Execute backend API and integration test suites:
```bash
npm run test:server
```
or from the root directory:
```bash
npm test
```

---

## 10. Security & Secret Protection

- Sensitive keys containing keywords such as `SECRET`, `TOKEN`, `PASSWORD`, `KEY`, or `PRIVATE` are automatically flagged.
- Secret values are masked in the UI by default and can only be temporarily toggled by authenticated owners.
- Unmasked secrets are never included in exported drift reports without explicit confirmation.
- Passwords are encrypted using bcrypt with salt rounds $\ge 10$.
- All project and snapshot operations enforce user authorization checks.
