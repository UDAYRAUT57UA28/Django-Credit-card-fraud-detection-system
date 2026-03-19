from django.db import models
from django.contrib.auth.models import User


class Card(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("FROZEN", "Frozen"),
        ("BLOCKED", "Blocked"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cards")
    card_last4 = models.CharField(max_length=4)
    holder_name = models.CharField(max_length=100)
    expiry = models.CharField(max_length=5)
    card_type = models.CharField(max_length=20, default="VISA")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"**** **** **** {self.card_last4} ({self.holder_name})"

    class Meta:
        ordering = ["-created_at"]


class Transaction(models.Model):
    PREDICTION_CHOICES = [
        ("Legitimate", "Legitimate"),
        ("Fraud", "Fraud"),
        ("Pending", "Pending"),
    ]
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="transactions", null=True, blank=True)
    amount = models.FloatField()
    location = models.CharField(max_length=200, blank=True, default="Unknown")
    merchant = models.CharField(max_length=200, blank=True, default="Unknown")
    timestamp = models.DateTimeField(auto_now_add=True)
    prediction = models.CharField(max_length=20, choices=PREDICTION_CHOICES, default="Pending")
    fraud_probability = models.FloatField(default=0.0)
    raw_features = models.JSONField(default=dict, blank=True)
    shap_explanation = models.JSONField(default=dict, blank=True)
    alert_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Transaction ${self.amount} — {self.prediction} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        ordering = ["-timestamp"]


class FraudAlert(models.Model):
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name="alert")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Alert for Transaction #{self.transaction.id}"

    class Meta:
        ordering = ["-created_at"]


class MerchantBlacklist(models.Model):
    merchant_name = models.CharField(max_length=200, unique=True)
    reason = models.TextField(blank=True, default="Flagged by admin")
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Blacklisted: {self.merchant_name}"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Merchant Blacklist"
        verbose_name_plural = "Merchant Blacklist"
