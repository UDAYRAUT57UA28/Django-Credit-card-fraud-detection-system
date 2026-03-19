# Credit Card Fraud Detection System

A production-level fraud detection platform built with **Django REST Framework + React + Machine Learning**.

---

## How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

---

### Step 1 — Clone & enter the project

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd "Django Credit"
```

---

### Step 2 — Set up Python virtual environment

```bash
# Create venv (first time only)
python -m venv venv

# Activate it
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux / Mac

# Install dependencies
pip install -r requirements.txt
```

---

### Step 3 — Set up the database

```bash
venv\Scripts\python.exe backend/manage.py migrate
```

---

### Step 4 — Create an admin account (first time only)

```bash
venv\Scripts\python.exe backend/manage.py createsuperuser
```

Or use the default: `admin` / `admin123` (if database already exists).

---

### Step 5 — Train the ML models (first time only)

> Download `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
> and place it in `ml_pipeline/dataset/`

```bash
# Train Random Forest (main model)
venv\Scripts\python.exe ml_pipeline/train_model.py

# Train XGBoost + Isolation Forest (for Model Lab)
venv\Scripts\python.exe ml_pipeline/train_extra_models.py
```

---

### Step 6 — Install frontend packages (first time only)

```bash
cd frontend
npm install
cd ..
```

---

### Step 7 — Start the servers

Open **two separate terminals** in the project root:

**Terminal 1 — Django Backend**
```bash
venv\Scripts\python.exe backend/manage.py runserver
```
Runs at → http://127.0.0.1:8000

**Terminal 2 — React Frontend**
```bash
cd frontend
npm start
```
Runs at → http://localhost:3000 (opens automatically)

---

### Step 8 — Open the app

Go to **http://localhost:3000** and log in.

| Account | Username | Password |
|---------|----------|----------|
| Admin | `admin` | `admin123` |
| Regular user | Register via the app | — |

Admin panel → http://127.0.0.1:8000/admin/

---

## Project Structure

```
Django Credit/
├── backend/                  # Django REST API
│   ├── fraud_project/        # Settings, URLs, Celery config
│   ├── fraud_app/            # Core fraud detection
│   │   ├── ml/               # Trained model .pkl files
│   │   ├── models.py         # Transaction, Card, Alert, Blacklist
│   │   ├── views.py          # API views (per-user isolated)
│   │   ├── services.py       # ML inference + SHAP
│   │   └── rule_engine.py    # Velocity checks, blacklist rules
│   ├── users/                # Registration, profile
│   ├── analytics/            # Per-user dashboard stats
│   └── notifications/        # Email alerts
├── frontend/                 # React app
│   └── src/
│       ├── pages/            # Dashboard, Transactions, DetectFraud,
│       │                     # Cards, Alerts, ModelComparison, Blacklist
│       ├── components/       # Sidebar, StatCard, RiskScore, ShapExplanation
│       ├── context/          # AuthContext (JWT), ThemeContext (dark/light)
│       └── services/         # Axios API client
├── ml_pipeline/              # ML training scripts
│   ├── dataset/              # Place creditcard.csv here
│   ├── preprocessing.py      # SMOTE + StandardScaler
│   ├── train_model.py        # Random Forest
│   ├── train_extra_models.py # XGBoost + Isolation Forest
│   └── evaluate_model.py     # Metrics, ROC-AUC, feature importance
├── docker/                   # Dockerfile + docker-compose
├── requirements.txt          # Python dependencies
└── .gitignore
```

---

## Architecture

```
React Frontend (Port 3000)
        │
        ▼
Django REST API (Port 8000)
        │
   ┌────┴────────────┐
   ▼                 ▼
ML Models         Rule Engine
Random Forest     Velocity checks
XGBoost           Merchant blacklist
Isolation Forest
SHAP Explainer
        │
        ▼
   SQLite DB (backend/db.sqlite3)
```

---

## Features

- JWT authentication — every user has a private isolated account
- Fraud detection with Random Forest (ROC-AUC 0.981)
- SHAP explainability — shows which features drove the decision
- Model Lab — compare RF vs XGBoost vs Isolation Forest vs Rule Engine
- Velocity checks — flags same card used 5x in 10 minutes
- Merchant blacklist — admin can blacklist merchants (auto 100% fraud)
- Dark / Light mode
- Risk score meter (0–100%) with color coding
- Per-user dashboard, transactions, alerts, cards — complete data isolation

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login/` | Get JWT tokens | No |
| POST | `/api/auth/refresh/` | Refresh token | No |
| POST | `/api/users/register/` | Register account | No |
| GET | `/api/users/profile/` | View profile | Yes |
| POST | `/api/detect/` | Detect fraud | Yes |
| POST | `/api/compare/` | Compare all models | Yes |
| GET | `/api/transactions/` | Your transactions | Yes |
| GET | `/api/cards/` | Your cards | Yes |
| POST | `/api/cards/<id>/freeze/` | Freeze a card | Yes |
| GET | `/api/alerts/` | Your open alerts | Yes |
| POST | `/api/alerts/<id>/resolve/` | Resolve alert | Yes |
| GET | `/api/analytics/stats/` | Your stats | Yes |
| GET | `/api/analytics/daily/` | Daily trend | Yes |
| GET | `/api/blacklist/` | Merchant blacklist | Yes |
| POST | `/api/blacklist/` | Add to blacklist | Yes |
| DELETE | `/api/blacklist/<id>/` | Remove from blacklist | Yes |

---

## ML Models

| Model | Purpose | ROC-AUC |
|-------|---------|---------|
| Random Forest | Primary fraud classifier | 0.981 |
| XGBoost | Secondary classifier | 0.974 |
| Isolation Forest | Zero-day anomaly detection | — |
| Rule Engine | Velocity + blacklist checks | — |

Dataset: [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
284,807 transactions — 492 fraud (0.173%)

---

## Docker Deployment

```bash
cd docker
docker-compose up --build
```

---

## Security

- Passwords hashed with PBKDF2 (Django default)
- JWT access tokens (1 hour) + refresh tokens (7 days)
- Card numbers stored as last 4 digits only
- Every API endpoint scoped to the authenticated user
- CORS restricted to localhost:3000
