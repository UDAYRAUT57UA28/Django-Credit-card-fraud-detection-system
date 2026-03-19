from django.contrib import admin
from .models import Card, Transaction, FraudAlert, MerchantBlacklist


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ["__str__", "user", "card_type", "status", "created_at"]
    list_filter = ["status", "card_type"]
    search_fields = ["holder_name", "card_last4"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["id", "amount", "prediction", "fraud_probability", "merchant", "location", "timestamp"]
    list_filter = ["prediction"]
    search_fields = ["merchant", "location"]
    readonly_fields = ["raw_features", "timestamp"]


@admin.register(FraudAlert)
class FraudAlertAdmin(admin.ModelAdmin):
    list_display = ["id", "transaction", "resolved", "created_at"]
    list_filter = ["resolved"]
    actions = ["mark_resolved"]

    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(resolved=True, resolved_at=timezone.now())
    mark_resolved.short_description = "Mark selected alerts as resolved"


@admin.register(MerchantBlacklist)
class MerchantBlacklistAdmin(admin.ModelAdmin):
    list_display = ["merchant_name", "reason", "added_by", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["merchant_name"]
