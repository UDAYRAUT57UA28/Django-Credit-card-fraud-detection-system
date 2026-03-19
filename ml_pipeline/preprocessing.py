"""
Preprocessing pipeline for the Kaggle Credit Card Fraud dataset.
Dataset: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
Place creditcard.csv in ml_pipeline/dataset/
"""
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE


def load_and_preprocess(csv_path: str = None):
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), "dataset", "creditcard.csv")
    """Load dataset, scale Amount, drop Time, handle class imbalance with SMOTE."""
    df = pd.read_csv(csv_path)

    print(f"Dataset shape: {df.shape}")
    print(f"Fraud cases: {df['Class'].sum()} ({df['Class'].mean()*100:.3f}%)")

    # Scale Amount (Time is dropped as it's not predictive)
    scaler = StandardScaler()
    df["Amount"] = scaler.fit_transform(df[["Amount"]])
    df = df.drop(columns=["Time"])

    X = df.drop("Class", axis=1)
    y = df["Class"]

    return X, y, scaler


def apply_smote(X_train, y_train, random_state: int = 42):
    """Apply SMOTE to balance the training set."""
    smote = SMOTE(random_state=random_state)
    X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE — Fraud: {y_resampled.sum()}, Legit: {(y_resampled == 0).sum()}")
    return X_resampled, y_resampled
