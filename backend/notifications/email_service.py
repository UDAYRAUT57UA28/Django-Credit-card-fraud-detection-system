from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_fraud_alert(user_email: str, amount: float, transaction_id: int):
    """Send fraud alert email to the card holder."""
    subject = "🚨 Fraud Alert — Suspicious Transaction Detected"
    message = f"""
Dear Cardholder,

A suspicious transaction has been detected on your account.

Transaction Details:
- Transaction ID: #{transaction_id}
- Amount: ${amount:.2f}
- Status: FLAGGED AS FRAUD

If you did not authorize this transaction, please:
1. Contact your bank immediately
2. Freeze your card via the app
3. Report the transaction

If this was you, you can dismiss this alert in your dashboard.

— FraudDetect Security Team
"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        logger.info(f"Fraud alert sent to {user_email} for transaction #{transaction_id}")
    except Exception as e:
        logger.error(f"Failed to send fraud alert email: {e}")
