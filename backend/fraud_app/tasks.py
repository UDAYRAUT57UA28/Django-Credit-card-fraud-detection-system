from celery import shared_task
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_fraud_detection(self, transaction_id: int):
    """
    Async Celery task: re-run fraud detection and send alerts.
    Triggered after a transaction is saved.
    """
    try:
        from .models import Transaction, FraudAlert
        from .services import detect_fraud
        from notifications.email_service import send_fraud_alert

        transaction = Transaction.objects.get(id=transaction_id)
        prediction, probability = detect_fraud(transaction.raw_features)

        transaction.prediction = "Fraud" if prediction == 1 else "Legitimate"
        transaction.fraud_probability = probability
        transaction.save(update_fields=["prediction", "fraud_probability"])

        if prediction == 1 and not transaction.alert_sent:
            # Create fraud alert record
            FraudAlert.objects.get_or_create(
                transaction=transaction,
                defaults={"message": f"Fraudulent transaction detected. Amount: ${transaction.amount:.2f}. Probability: {probability:.2%}"}
            )

            # Send email alert if card owner has email
            if transaction.card and transaction.card.user.email:
                send_fraud_alert(
                    user_email=transaction.card.user.email,
                    amount=transaction.amount,
                    transaction_id=transaction.id,
                )

            transaction.alert_sent = True
            transaction.save(update_fields=["alert_sent"])

        logger.info(f"Transaction {transaction_id} processed: {transaction.prediction} ({probability:.2%})")
        return {"transaction_id": transaction_id, "prediction": transaction.prediction, "probability": probability}

    except Exception as exc:
        logger.error(f"Error processing transaction {transaction_id}: {exc}")
        raise self.retry(exc=exc, countdown=5)
