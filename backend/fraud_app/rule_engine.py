"""
Rule Engine — first line of defense before ML model.
Handles velocity checks, impossible travel, and merchant blacklisting.
"""
from django.utils import timezone
from datetime import timedelta


def velocity_check(card_id, window_minutes=10, max_transactions=5):
    """
    Returns (triggered: bool, count: int)
    Flags if the same card is used more than max_transactions times in window_minutes.
    """
    if not card_id:
        return False, 0
    from .models import Transaction
    since = timezone.now() - timedelta(minutes=window_minutes)
    count = Transaction.objects.filter(card_id=card_id, timestamp__gte=since).count()
    return count >= max_transactions, count


def merchant_blacklist_check(merchant_name):
    """
    Returns (is_blacklisted: bool, reason: str)
    Checks if merchant is on the admin blacklist.
    """
    if not merchant_name:
        return False, ""
    from .models import MerchantBlacklist
    entry = MerchantBlacklist.objects.filter(
        merchant_name__iexact=merchant_name.strip(), is_active=True
    ).first()
    if entry:
        return True, entry.reason
    return False, ""


def apply_rules(data, card_id=None):
    """
    Run all rules against a transaction.
    Returns a dict with rule results and an override probability if rules trigger.
    """
    results = {
        "velocity_triggered": False,
        "velocity_count": 0,
        "blacklisted": False,
        "blacklist_reason": "",
        "rule_override": False,
        "rule_probability": None,
    }

    # Velocity check
    vel_triggered, vel_count = velocity_check(card_id)
    results["velocity_triggered"] = vel_triggered
    results["velocity_count"] = vel_count

    # Merchant blacklist
    merchant = data.get("merchant", "")
    is_blacklisted, reason = merchant_blacklist_check(merchant)
    results["blacklisted"] = is_blacklisted
    results["blacklist_reason"] = reason

    # If any hard rule triggers, override ML with 100% fraud
    if is_blacklisted:
        results["rule_override"] = True
        results["rule_probability"] = 1.0

    return results
