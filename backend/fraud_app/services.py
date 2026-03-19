import os
import numpy as np
import pandas as pd
import joblib
from django.conf import settings

_model = None
_scaler = None
_iso_forest = None
_xgb_model = None

FEATURE_NAMES = [f"V{i}" for i in range(1, 29)] + ["Amount"]


def _load_model():
    global _model, _scaler
    if _model is None:
        model_path = settings.ML_MODEL_PATH
        scaler_path = settings.ML_SCALER_PATH
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            _model = joblib.load(model_path)
            _scaler = joblib.load(scaler_path)
    return _model, _scaler


def _load_iso_forest():
    global _iso_forest
    if _iso_forest is None:
        path = getattr(settings, "ISO_FOREST_PATH", None)
        if path and os.path.exists(path):
            _iso_forest = joblib.load(path)
    return _iso_forest


def _load_xgb():
    global _xgb_model
    if _xgb_model is None:
        path = getattr(settings, "XGB_MODEL_PATH", None)
        if path and os.path.exists(path):
            _xgb_model = joblib.load(path)
    return _xgb_model


def build_feature_vector(data: dict) -> list:
    """Build 29-feature vector [V1..V28, Amount]."""
    features = [float(data.get(f"V{i}", 0.0)) for i in range(1, 29)]
    features.append(float(data.get("amount", 0.0)))
    return features


def _build_df(data: dict) -> pd.DataFrame:
    """Build a named DataFrame so sklearn doesn't warn about feature names."""
    features = build_feature_vector(data)
    return pd.DataFrame([features], columns=FEATURE_NAMES)


def _scale_features(df: pd.DataFrame) -> pd.DataFrame:
    """Scale the Amount column using the trained scaler."""
    _, scaler = _load_model()
    if scaler is not None:
        df = df.copy()
        df["Amount"] = scaler.transform(df[["Amount"]])
    return df


def detect_fraud(data: dict):
    """
    Run fraud detection. Returns (prediction, probability, shap_values_dict).
    """
    model, scaler = _load_model()
    if model is None or scaler is None:
        pred, prob = _rule_based_detection(data)
        return pred, prob, {}

    df = _build_df(data)
    df = _scale_features(df)

    prediction = int(model.predict(df)[0])
    probability = float(model.predict_proba(df)[0][1])
    shap_vals = explain_prediction(model, df)

    return prediction, probability, shap_vals


def explain_prediction(model, df: pd.DataFrame):
    """
    Compute SHAP values for a single prediction.
    Returns dict {feature_name: shap_value} sorted by absolute impact.
    """
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(df)

        # New SHAP versions return (samples, features, classes) ndarray
        if hasattr(shap_values, 'ndim') and shap_values.ndim == 3:
            vals = shap_values[0, :, 1]   # sample 0, all features, fraud class (index 1)
        elif isinstance(shap_values, list):
            vals = shap_values[1][0]       # old format: list[class][sample]
        else:
            vals = shap_values[0]

        result = {FEATURE_NAMES[i]: round(float(vals[i]), 6) for i in range(len(FEATURE_NAMES))}
        result = dict(sorted(result.items(), key=lambda x: abs(x[1]), reverse=True))
        return result
    except Exception:
        return {}


def isolation_forest_score(data: dict):
    """
    Run Isolation Forest anomaly detection.
    Returns (is_anomaly: bool, anomaly_score: float 0-1)
    """
    iso = _load_iso_forest()
    if iso is None:
        return False, 0.0

    df = _build_df(data)
    score = iso.decision_function(df)[0]
    normalized = float(np.clip(1 - (score + 0.5), 0, 1))
    is_anomaly = iso.predict(df)[0] == -1
    return is_anomaly, round(normalized, 4)


def xgboost_predict(data: dict):
    """
    Run XGBoost model prediction.
    Returns (prediction: int, probability: float) or (None, None) if model not available.
    """
    xgb = _load_xgb()
    if xgb is None:
        return None, None

    df = _build_df(data)
    df = _scale_features(df)

    prediction = int(xgb.predict(df)[0])
    probability = float(xgb.predict_proba(df)[0][1])
    return prediction, probability


def rule_based_predict(data: dict):
    """Rule-based prediction for model comparison."""
    amount = float(data.get("amount", 0))
    v1 = abs(float(data.get("V1", 0)))
    v3 = abs(float(data.get("V3", 0)))
    v14 = abs(float(data.get("V14", 0)))

    score = 0.0
    if amount > 5000:
        score += 0.4
    elif amount > 2000:
        score += 0.2
    elif amount > 1000:
        score += 0.1
    if v14 > 10:
        score += 0.3
    if v1 > 5:
        score += 0.15
    if v3 > 5:
        score += 0.15

    score = min(score, 0.99)
    return 1 if score >= 0.5 else 0, round(score, 4)


def _rule_based_detection(data: dict):
    pred, score = rule_based_predict(data)
    return pred, score
