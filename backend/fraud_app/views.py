from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.utils import timezone
from .models import Card, Transaction, FraudAlert, MerchantBlacklist
from .serializers import (
    CardSerializer, TransactionSerializer,
    FraudDetectionInputSerializer, FraudAlertSerializer,
    MerchantBlacklistSerializer,
)
from .services import detect_fraud, isolation_forest_score, xgboost_predict, rule_based_predict
from .rule_engine import apply_rules


class DetectFraudView(APIView):
    """POST /api/detect/ — Submit a transaction for fraud detection."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FraudDetectionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        card_id = data.get("card_id")

        # --- Rule engine (first line of defense) ---
        rule_results = apply_rules(data, card_id=card_id)

        # --- ML prediction ---
        prediction_int, probability, shap_vals = detect_fraud(data)

        # Rule override: blacklisted merchant → 100% fraud
        if rule_results["rule_override"]:
            probability = rule_results["rule_probability"]
            prediction_int = 1

        # Velocity warning bumps probability
        if rule_results["velocity_triggered"] and probability < 0.8:
            probability = min(probability + 0.2, 0.95)
            prediction_int = 1 if probability >= 0.5 else prediction_int

        result = "Fraud" if prediction_int == 1 else "Legitimate"

        # Resolve card
        card = None
        if card_id:
            try:
                card = Card.objects.get(id=card_id)
            except Card.DoesNotExist:
                pass

        transaction = Transaction.objects.create(
            card=card,
            amount=data["amount"],
            location=data.get("location", "Unknown"),
            merchant=data.get("merchant", "Unknown"),
            prediction=result,
            fraud_probability=probability,
            raw_features={k: float(v) if isinstance(v, (int, float)) else str(v) for k, v in data.items()},
            shap_explanation=shap_vals,
        )

        if prediction_int == 1:
            msg = f"Fraud detected. Amount: ${data['amount']:.2f}. Confidence: {probability:.2%}."
            if rule_results["blacklisted"]:
                msg += f" Merchant blacklisted: {rule_results['blacklist_reason']}"
            if rule_results["velocity_triggered"]:
                msg += f" Velocity alert: {rule_results['velocity_count']} transactions in 10 min."
            FraudAlert.objects.create(transaction=transaction, message=msg)

        return Response({
            "transaction_id": transaction.id,
            "prediction": result,
            "fraud_probability": round(probability, 4),
            "amount": data["amount"],
            "timestamp": transaction.timestamp,
            "shap_explanation": shap_vals,
            "rule_flags": {
                "velocity_triggered": rule_results["velocity_triggered"],
                "velocity_count": rule_results["velocity_count"],
                "blacklisted": rule_results["blacklisted"],
                "blacklist_reason": rule_results["blacklist_reason"],
            },
        }, status=status.HTTP_201_CREATED)


class ModelComparisonView(APIView):
    """POST /api/compare/ — Run same transaction through all models."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FraudDetectionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        import time

        # Random Forest
        t0 = time.perf_counter()
        rf_pred, rf_prob, _ = detect_fraud(data)
        rf_time = round((time.perf_counter() - t0) * 1000, 2)

        # XGBoost
        t0 = time.perf_counter()
        xgb_pred, xgb_prob = xgboost_predict(data)
        xgb_time = round((time.perf_counter() - t0) * 1000, 2)

        # Isolation Forest
        t0 = time.perf_counter()
        iso_anomaly, iso_score = isolation_forest_score(data)
        iso_time = round((time.perf_counter() - t0) * 1000, 2)

        # Rule-based
        t0 = time.perf_counter()
        rule_pred, rule_prob = rule_based_predict(data)
        rule_time = round((time.perf_counter() - t0) * 1000, 2)

        return Response({
            "models": [
                {
                    "name": "Random Forest",
                    "prediction": "Fraud" if rf_pred == 1 else "Legitimate",
                    "probability": round(rf_prob, 4),
                    "inference_ms": rf_time,
                    "available": True,
                },
                {
                    "name": "XGBoost",
                    "prediction": "Fraud" if xgb_pred == 1 else "Legitimate" if xgb_pred is not None else "N/A",
                    "probability": round(xgb_prob, 4) if xgb_prob is not None else None,
                    "inference_ms": xgb_time,
                    "available": xgb_pred is not None,
                },
                {
                    "name": "Isolation Forest",
                    "prediction": "Anomaly" if iso_anomaly else "Normal",
                    "probability": iso_score,
                    "inference_ms": iso_time,
                    "available": iso_score > 0,
                },
                {
                    "name": "Rule Engine",
                    "prediction": "Fraud" if rule_pred == 1 else "Legitimate",
                    "probability": rule_prob,
                    "inference_ms": rule_time,
                    "available": True,
                },
            ]
        })


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.select_related("card__user").all()
        prediction = self.request.query_params.get("prediction")
        if prediction:
            qs = qs.filter(prediction=prediction)
        return qs


class TransactionDetailView(generics.RetrieveAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.all()


class CardListCreateView(generics.ListCreateAPIView):
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Card.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FreezeCardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            card = Card.objects.get(id=pk, user=request.user)
        except Card.DoesNotExist:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        card.status = "FROZEN"
        card.save(update_fields=["status"])
        return Response({"message": f"Card **** {card.card_last4} has been frozen."})


class FraudAlertListView(generics.ListAPIView):
    serializer_class = FraudAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FraudAlert.objects.select_related("transaction__card").filter(resolved=False)


class ResolveAlertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            alert = FraudAlert.objects.get(id=pk)
        except FraudAlert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)
        alert.resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=["resolved", "resolved_at"])
        return Response({"message": "Alert resolved."})


class MerchantBlacklistView(generics.ListCreateAPIView):
    """GET/POST /api/blacklist/ — List or add blacklisted merchants."""
    serializer_class = MerchantBlacklistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantBlacklist.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)


class MerchantBlacklistDetailView(generics.DestroyAPIView):
    """DELETE /api/blacklist/<id>/ — Remove from blacklist."""
    serializer_class = MerchantBlacklistSerializer
    permission_classes = [IsAuthenticated]
    queryset = MerchantBlacklist.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
