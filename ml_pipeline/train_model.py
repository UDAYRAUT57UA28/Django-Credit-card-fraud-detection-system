"""
Train the fraud detection model and save to backend/fraud_app/ml/
Run: python ml_pipeline/train_model.py
Requires: ml_pipeline/dataset/creditcard.csv
"""
import os
import sys
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

# Allow imports from ml_pipeline/
sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import load_and_preprocess, apply_smote

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "fraud_app", "ml")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def train():
    print("Loading and preprocessing data...")
    X, y, scaler = load_and_preprocess()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Applying SMOTE to training set...")
    X_train_res, y_train_res = apply_smote(X_train, y_train)

    print("Training RandomForest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        n_jobs=-1,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_res, y_train_res)

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print("\n--- Evaluation Report ---")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

    # Save model and scaler
    model_path = os.path.join(OUTPUT_DIR, "fraud_model.pkl")
    scaler_path = os.path.join(OUTPUT_DIR, "scaler.pkl")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")


if __name__ == "__main__":
    train()
