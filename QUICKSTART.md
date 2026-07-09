# DemandPilot Quick Start (Frontend + Backend + ML)

This guide starts everything needed to run the app locally:

- Frontend (Vite + React) on port `5173`
- Backend API (Express) on port `4000`
- ML service (FastAPI) on port `8000`
- PostgreSQL database (`demandpilot`)

## 1. Prerequisites

Install these first:

- Node.js 18+ (Node 20 recommended)
- Python 3.10 to 3.12 (3.11 recommended)
- PostgreSQL 14+
- Git

Windows note (PowerShell script policy):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

## 2. Clone and Install Dependencies

From a PowerShell terminal:

```powershell
git clone https://github.com/MohammedAshikM3003/demand-pilot.git
cd demand-pilot

# Frontend/root deps
npm install

# Backend deps
cd backend-api
npm install
cd ..

# ML deps (virtual env + requirements)
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..
```

## 3. Configure Environment Files

Create these files (copy from examples):

```powershell
Copy-Item backend-api\.env.example backend-api\.env
Copy-Item ml-service\.env.example ml-service\.env
```

Minimum required values (already in examples):

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demandpilot`
- `WORKFLOW_API_KEY=change-me-demo-key`
- `ML_SERVICE_URL=http://localhost:8000` (backend env)

Update username/password/host/port in `DATABASE_URL` if your local PostgreSQL is different.

## 4. Create the Database

If the database does not exist yet:

```sql
CREATE DATABASE demandpilot;
```

You can create it using pgAdmin or `psql`.

## 5. Initialize and Seed DB Schema

From project root:

```powershell
cd backend-api
npm run db:init
npm run db:seed
cd ..
```

## 6. Start Services (Manual, 3 Terminals)

### Terminal A: Backend API

```powershell
cd d:\demand-pilot\backend-api
npm run dev
```

Expected: backend running on `http://localhost:4000`

### Terminal B: ML Service

```powershell
cd d:\demand-pilot\ml-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Expected: ML service running on `http://localhost:8000`

### Terminal C: Frontend

```powershell
cd d:\demand-pilot
npm run dev
```

Expected: frontend running on `http://localhost:5173`

## 7. Health Checks

Open these in browser/Postman:

- Backend: `http://localhost:4000/api/health`
- ML: `http://localhost:8000/health`

Both should return status `ok`.

## 8. One-Command Demo Start (Optional)

If you want auto bootstrapping of backend + ml + validation:

```powershell
cd d:\demand-pilot
npm run demo:start
```

This script:

1. Runs DB init/seed
2. Starts backend and ML service in new PowerShell windows
3. Runs demo validation

You still start frontend with:

```powershell
npm run dev
```

## 9. Build Check

```powershell
cd d:\demand-pilot
npm run build
```

If build succeeds, frontend integration is healthy.

## 10. Common Issues

### `npm.ps1 cannot be loaded`

Run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

### Backend cannot connect to DB

- Verify PostgreSQL is running
- Verify `DATABASE_URL` in `backend-api/.env`
- Ensure database `demandpilot` exists

### ML service fails to start

- Reinstall requirements in `ml-service/.venv`
- Ensure you activated the correct venv

### Prophet fallback message appears

This is expected on Windows by default. App will fall back to `moving_average` unless you explicitly enable Prophet.

