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
- [2. Mandatory Tech Stack](#2-mandatory-tech-stack)
- [3. 6-Phase Implementation Roadmap](#3-6-phase-implementation-roadmap)
- [4. Project Architecture](#4-project-architecture)
- [5. Getting Started Locally](#5-getting-started-locally)
- [6. Environment Variables](#6-environment-variables)
- [7. API Endpoints](#7-api-endpoints)
- [8. Running Tests](#8-running-tests)
- [9. Two-Person GitHub Collaboration Workflow](#9-two-person-github-collaboration-workflow)

---

## 1. Overview & Problem Statement

Modern web applications depend on dozens of environment variables spanning API base URLs, feature flags, secret keys, timeouts, and port configurations.

When configurations between environments drift silently:
- Local development works smoothly, but staging or production encounters fatal startup errors.
- Critical timeouts differ without record (e.g. `API_TIMEOUT=5000` in dev vs `30000` in prod).
- Development-only flags (like `DEBUG=true` or mock authentication) are accidentally deployed to production.
- Sensitive API keys or credentials risk exposure in plain text.

**ConfigDrift** eliminates these issues through deterministic comparison algorithms, type and range validation rules, secret masking, and exportable drift audit reports.

---

## 2. Mandatory Tech Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose (Local `mongodb://127.0.0.1:27017/configdrift` or MongoDB Atlas)
- **API Communication**: RESTful JSON APIs
- **Testing**: Jest and Supertest
- **Version Control**: Git & GitHub with feature-branch PR workflow

---

## 3. 6-Phase Implementation Roadmap

The project alternates sequentially between **Primary Developer** and **Teammate**:

| Phase | Developer | Branch Name | Scope / Deliverable |
| :---: | :--- | :--- | :--- |
| **Phase 1** | **Primary (You)** | `main` | **Project Foundation**: Monorepo scaffold, Express server, React + Tailwind client, health check API, Git repo initialization. |
| **Phase 2** | **Teammate** | `feature/user-auth` | **Authentication & Project Workspace**: User registration, login, JWT token middleware, protected routes, Project CRUD dashboard & empty states. |
| **Phase 3** | **Primary (You)** | `feature/env-snapshots` | **Environment Snapshots & Parsers**: Dev, Test, Prod snapshot models, key-value editor, `.env` and JSON parsers, and secret auto-detection. |
| **Phase 4** | **Teammate** | `feature/comparison-engine` | **Deterministic Comparison Engine**: Side-by-side diff matrix, missing/extra/mismatch indicators, unit tests, comparison API & UI. |
| **Phase 5** | **Primary (You)** | `feature/validation-rules` | **Validation Rules Engine & Guardrails**: Configurable rules (numeric ranges, regex patterns, forbidden prod flags), severity classification. |
| **Phase 6** | **Teammate** | `feature/drift-reports` | **Drift Reports, Masking, Audit & Export**: Historical timeline, secret unmasking toggle, JSON and CSV exportable drift reports. |

---

## 4. Project Architecture

```text
configdrift/
├── client/                     # React 18+ (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Buttons, Badges, Modals)
│   │   ├── layouts/            # Dashboard & Auth layouts
│   │   ├── pages/              # Application views
│   │   ├── services/           # Axios API service layer (api.js)
│   │   ├── App.jsx             # Main router & root application component
│   │   ├── index.css           # Tailwind CSS directives
│   │   └── main.jsx            # React DOM entry point
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── vite.config.js          # Vite config with /api proxy to localhost:5000
│   └── package.json
├── server/                     # Node.js + Express.js Backend
│   ├── src/
│   │   ├── config/             # Database connection (db.js)
│   │   ├── middleware/         # Error handling, Auth guards, Rate limiting
│   │   ├── models/             # Mongoose schemas (User, Project, Snapshot, Rule, Report)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Comparison engine, validation rule evaluator, parsers
│   │   ├── app.js              # Express app setup, CORS, Helmet, routes mounting
│   │   └── server.js           # HTTP listener entry point
│   ├── tests/                  # Jest & Supertest test suites
│   ├── .env.example
│   └── package.json
├── docs/                       # Architectural diagrams & specifications
├── .env.example                # Root environment variable documentation
├── .gitignore                  # Git ignore rules for node_modules, .env, build output
├── package.json                # Root package for running client & server concurrently
└── README.md
```

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
*(Or install individually: `npm install`, `cd server && npm install`, `cd client && npm install`)*

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the `server` directory:
```bash
cp server/.env.example server/.env
```
Ensure `MONGODB_URI` points to your local MongoDB:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/configdrift
JWT_SECRET=super_secret_jwt_key_for_development_configdrift
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. Run the Application
You can run both client and server concurrently from the root directory:
```bash
npm run dev
```

Alternatively, run in separate terminals:
- **Server**: `npm run dev:server` (runs on `http://localhost:5000`)
- **Client**: `npm run dev:client` (runs on `http://localhost:5173`)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Environment Variables

| Variable | Description | Default (Development) |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/configdrift` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `super_secret_jwt_key...` |
| `JWT_EXPIRES_IN`| Token expiration timeframe | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

---

## 7. API Endpoints

### System & Diagnostics
- `GET /api/health` — Verifies backend uptime and MongoDB connection status.
- `GET /` — API welcome message.

### Authentication (Phase 2)
- `POST /api/auth/register` — Register user.
- `POST /api/auth/login` — Login user and receive token.
- `GET /api/auth/me` — Current user profile.

### Projects & Snapshots (Phases 2 & 3)
- `GET /api/projects` — List user's projects.
- `POST /api/projects` — Create project.
- `GET /api/projects/:id` — Get project details.
- `POST /api/projects/:projectId/snapshots` — Upload or save environment snapshot.

### Comparison & Validation (Phases 4 & 5)
- `POST /api/projects/:projectId/compare` — Compare two environment snapshots side-by-side.
- `GET /api/projects/:projectId/rules` — List validation rules.
- `POST /api/projects/:projectId/rules` — Create validation rule.

### Drift Reports & History (Phase 6)
- `GET /api/projects/:projectId/reports` — Historical comparison reports.
- `GET /api/projects/:projectId/reports/:id/export` — Export report (JSON/CSV).

---

## 8. Running Tests

Execute backend API and integration test suites:
```bash
npm run test:server
```
or from the root:
```bash
npm test
```

---

## 9. Two-Person GitHub Collaboration Workflow

1. The default branch is **`main`**.
2. Work is developed on isolated feature branches (e.g. `feature/user-auth`, `feature/env-snapshots`).
3. After completing and testing a phase locally, push the branch to GitHub:
   ```bash
   git checkout -b feature/your-feature-name
   # Implement and test
   git add .
   git commit -m "feat: description of changes"
   git push -u origin feature/your-feature-name
   ```
4. Open a Pull Request targeting `main`.
5. The other teammate reviews and merges the PR.
6. The next developer pulls the updated `main` branch before starting their assigned phase:
   ```bash
   git checkout main
   git pull origin main
   ```
