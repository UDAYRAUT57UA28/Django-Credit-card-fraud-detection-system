"""
Train XGBoost and Isolation Forest models using the same preprocessed data.
Run from project root: venv\Scripts\python.exe ml_pipeline/train_extra_models.py
"""
import os
import sys
import joblib
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "fraud_app", "ml")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def train_xgboost(X_train, y_train):
    from xgboost import XGBClassifier
    print("Training XGBoost...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=len(y_train[y_train == 0]) / max(len(y_train[y_train == 1]), 1),
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    path = os.path.join(OUTPUT_DIR, "xgb_model.pkl")
    joblib.dump(model, path)
    print(f"XGBoost saved to {path}")
    return model


def train_isolation_forest(X_train):
    from sklearn.ensemble import IsolationForest
    print("Training Isolation Forest...")
    model = IsolationForest(
        n_estimators=100,
        contamination=0.002,  # ~0.2% fraud rate in dataset
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train)
    path = os.path.join(OUTPUT_DIR, "isolation_forest.pkl")
    joblib.dump(model, path)
    print(f"Isolation Forest saved to {path}")
    return model


def evaluate(model, X_test, y_test, name):
    from sklearn.metrics import classification_report, roc_auc_score
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print(f"\n--- {name} ---")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")


if __name__ == "__main__":
    from sklearn.model_selection import train_test_split
    from preprocessing import load_and_preprocess, apply_smote
    print("Loading data...")
    X, y, scaler = load_and_preprocess()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    X_train, y_train = apply_smote(X_train, y_train)

    xgb = train_xgboost(X_train, y_train)
    evaluate(xgb, X_test, y_test, "XGBoost")

    iso = train_isolation_forest(X_train)
    # Isolation Forest uses -1/1 labels, convert for eval
    iso_preds = iso.predict(X_test)
    iso_preds_binary = np.where(iso_preds == -1, 1, 0)
    from sklearn.metrics import classification_report
    print("\n--- Isolation Forest ---")
    print(classification_report(y_test, iso_preds_binary, target_names=["Legitimate", "Fraud"]))

    print("\nAll models trained successfully.")
