# 💳 Credit Card Fraud Detection System

A production-level fraud detection platform built with **Django REST Framework + React + Machine Learning**.

## 🏗️ Architecture

```
React Frontend (Port 3000)
        │
        ▼
Django REST API (Port 8000)
        │
   ┌────┴────┐
   ▼         ▼
ML Model   Celery Worker
(sklearn)  (async tasks)
   │         │
   ▼         ▼
SQLite/    Redis
PostgreSQL (broker)
```

## 📁 Project Structure

```
fraud-detection-system/
├── backend/                  # Django backend
│   ├── fraud_project/        # Project config, celery
│   ├── fraud_app/            # Core fraud detection app
│   │   └── ml/               # Trained model files (.pkl)
│   ├── users/                # Auth & user management
│   ├── analytics/            # Dashboard analytics API
│   └── notifications/        # Email alert service
├── frontend/                 # React frontend
│   └── src/
│       ├── pages/            # Dashboard, Transactions, DetectFraud, Cards, Alerts
│       ├── components/       # Sidebar, StatCard
│       ├── services/         # Axios API client
│       └── context/          # Auth context (JWT)
├── ml_pipeline/              # ML training scripts
│   ├── dataset/              # Place creditcard.csv here
│   ├── preprocessing.py      # SMOTE + scaling
│   ├── train_model.py        # Train & save model
│   └── evaluate_model.py     # Metrics & feature importance
└── docker/                   # Docker + docker-compose
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Activate virtual environment
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
cd backend
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 3. Train the ML Model (optional — rule-based fallback works without it)

```bash
# Download dataset from Kaggle:
# https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
# Place creditcard.csv in ml_pipeline/dataset/

python ml_pipeline/train_model.py
```

### 4. Start Celery Worker (requires Redis)

```bash
cd backend
celery -A fraud_project worker --loglevel=info
```

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login/` | Get JWT tokens | No |
| POST | `/api/users/register/` | Register user | No |
| POST | `/api/detect/` | Detect fraud | No |
| GET | `/api/transactions/` | List transactions | Yes |
| GET | `/api/cards/` | List cards | Yes |
| POST | `/api/cards/<id>/freeze/` | Freeze card | Yes |
| GET | `/api/alerts/` | Open fraud alerts | Yes |
| POST | `/api/alerts/<id>/resolve/` | Resolve alert | Yes |
| GET | `/api/analytics/stats/` | Fraud statistics | Yes |
| GET | `/api/analytics/daily/` | Daily trend | Yes |

## 🧠 ML Model

- Algorithm: **Random Forest Classifier** (200 trees, depth 12)
- Dataset: [Kaggle Credit Card Fraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- Imbalance handling: **SMOTE** oversampling
- Features: Time, V1–V28 (PCA), Amount
- Fallback: Rule-based detection when model not trained

## 🔐 Security

- JWT Authentication (access + refresh tokens)
- Card numbers stored as last 4 digits only
- CORS configured for frontend origin
- Password validation enforced

## 🐳 Docker Deployment

```bash
cd docker
docker-compose up --build
```

## 📊 Admin Dashboard

Visit `http://localhost:8000/admin/` — login: `admin` / `admin123`

## 🎓 Default Credentials (dev only)

- Admin: `admin` / `admin123`
- API: Register via `/api/users/register/` or React UI
