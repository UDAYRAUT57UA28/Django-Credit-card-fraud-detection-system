from rest_framework import serializers
from .models import Card, Transaction, FraudAlert, MerchantBlacklist


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "card_last4", "holder_name", "expiry", "card_type", "status", "created_at"]
        read_only_fields = ["id", "created_at"]


class TransactionSerializer(serializers.ModelSerializer):
    card_info = CardSerializer(source="card", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "card", "card_info", "amount", "location", "merchant",
            "timestamp", "prediction", "fraud_probability", "alert_sent",
        ]
        read_only_fields = ["id", "timestamp", "prediction", "fraud_probability", "alert_sent"]


class FraudDetectionInputSerializer(serializers.Serializer):
    """Input serializer for fraud detection API."""
    amount = serializers.FloatField(min_value=0.01)
    location = serializers.CharField(max_length=200, required=False, default="Unknown")
    merchant = serializers.CharField(max_length=200, required=False, default="Unknown")
    card_id = serializers.IntegerField(required=False)
    # V1-V28 PCA features (optional — used when real dataset features are available)
    V1 = serializers.FloatField(required=False, default=0.0)
    V2 = serializers.FloatField(required=False, default=0.0)
    V3 = serializers.FloatField(required=False, default=0.0)
    V4 = serializers.FloatField(required=False, default=0.0)
    V5 = serializers.FloatField(required=False, default=0.0)
    V6 = serializers.FloatField(required=False, default=0.0)
    V7 = serializers.FloatField(required=False, default=0.0)
    V8 = serializers.FloatField(required=False, default=0.0)
    V9 = serializers.FloatField(required=False, default=0.0)
    V10 = serializers.FloatField(required=False, default=0.0)
    V11 = serializers.FloatField(required=False, default=0.0)
    V12 = serializers.FloatField(required=False, default=0.0)
    V13 = serializers.FloatField(required=False, default=0.0)
    V14 = serializers.FloatField(required=False, default=0.0)
    V15 = serializers.FloatField(required=False, default=0.0)
    V16 = serializers.FloatField(required=False, default=0.0)
    V17 = serializers.FloatField(required=False, default=0.0)
    V18 = serializers.FloatField(required=False, default=0.0)
    V19 = serializers.FloatField(required=False, default=0.0)
    V20 = serializers.FloatField(required=False, default=0.0)
    V21 = serializers.FloatField(required=False, default=0.0)
    V22 = serializers.FloatField(required=False, default=0.0)
    V23 = serializers.FloatField(required=False, default=0.0)
    V24 = serializers.FloatField(required=False, default=0.0)
    V25 = serializers.FloatField(required=False, default=0.0)
    V26 = serializers.FloatField(required=False, default=0.0)
    V27 = serializers.FloatField(required=False, default=0.0)
    V28 = serializers.FloatField(required=False, default=0.0)
    time = serializers.FloatField(required=False, default=0.0)


class FraudAlertSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)

    class Meta:
        model = FraudAlert
        fields = ["id", "transaction", "message", "created_at", "resolved", "resolved_at"]


class MerchantBlacklistSerializer(serializers.ModelSerializer):
    added_by_username = serializers.CharField(source="added_by.username", read_only=True)

    class Meta:
        model = MerchantBlacklist
        fields = ["id", "merchant_name", "reason", "added_by_username", "is_active", "created_at"]
        read_only_fields = ["id", "added_by_username", "created_at"]
