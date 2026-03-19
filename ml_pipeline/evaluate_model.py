"""
Evaluate the trained model and show SHAP explainability.
Run: python ml_pipeline/evaluate_model.py
"""
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import load_and_preprocess
from sklearn.model_selection import train_test_split

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "fraud_app", "ml", "fraud_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "fraud_app", "ml", "scaler.pkl")


def evaluate():
    model = joblib.load(MODEL_PATH)
    X, y, _ = load_and_preprocess()
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("=== Confusion Matrix ===")
    print(confusion_matrix(y_test, y_pred))
    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    # Feature importance
    feature_names = X_test.columns.tolist()
    importances = model.feature_importances_
    top_features = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
    print("\n=== Top 10 Important Features ===")
    for feat, imp in top_features:
        print(f"  {feat}: {imp:.4f}")


if __name__ == "__main__":
    evaluate()
