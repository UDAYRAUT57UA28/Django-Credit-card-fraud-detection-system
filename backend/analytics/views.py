from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum
from django.db.models.functions import TruncHour, TruncDate
from fraud_app.models import Transaction, FraudAlert


class FraudStatsView(APIView):
    """GET /api/analytics/stats/ — Overall fraud statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = Transaction.objects.count()
        fraud_count = Transaction.objects.filter(prediction="Fraud").count()
        legit_count = Transaction.objects.filter(prediction="Legitimate").count()
        avg_fraud_prob = Transaction.objects.aggregate(avg=Avg("fraud_probability"))["avg"] or 0
        total_amount = Transaction.objects.aggregate(total=Sum("amount"))["total"] or 0
        fraud_amount = Transaction.objects.filter(prediction="Fraud").aggregate(total=Sum("amount"))["total"] or 0
        open_alerts = FraudAlert.objects.filter(resolved=False).count()

        return Response({
            "total_transactions": total,
            "fraud_transactions": fraud_count,
            "legitimate_transactions": legit_count,
            "fraud_rate": round((fraud_count / total * 100) if total > 0 else 0, 2),
            "avg_fraud_probability": round(avg_fraud_prob, 4),
            "total_amount_processed": round(total_amount, 2),
            "fraud_amount": round(fraud_amount, 2),
            "open_alerts": open_alerts,
        })


class HourlyTransactionsView(APIView):
    """GET /api/analytics/hourly/ — Transactions grouped by hour."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Transaction.objects
            .annotate(hour=TruncHour("timestamp"))
            .values("hour")
            .annotate(total=Count("id"), fraud=Count("id", filter=__import__("django.db.models", fromlist=["Q"]).Q(prediction="Fraud")))
            .order_by("hour")
        )
        return Response(list(data))


class DailyTrendView(APIView):
    """GET /api/analytics/daily/ — Daily fraud trend."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        data = (
            Transaction.objects
            .annotate(date=TruncDate("timestamp"))
            .values("date")
            .annotate(
                total=Count("id"),
                fraud=Count("id", filter=Q(prediction="Fraud")),
                legitimate=Count("id", filter=Q(prediction="Legitimate")),
            )
            .order_by("date")
        )
        return Response(list(data))


class TopRiskyCardsView(APIView):
    """GET /api/analytics/risky-cards/ — Cards with most fraud transactions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from fraud_app.models import Card
        data = (
            Card.objects
            .annotate(fraud_count=Count("transactions", filter=__import__("django.db.models", fromlist=["Q"]).Q(transactions__prediction="Fraud")))
            .filter(fraud_count__gt=0)
            .values("id", "card_last4", "holder_name", "fraud_count")
            .order_by("-fraud_count")[:10]
        )
        return Response(list(data))
