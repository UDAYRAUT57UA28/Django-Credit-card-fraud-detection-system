from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum, Q
from django.db.models.functions import TruncDate, TruncHour
from fraud_app.models import Transaction, FraudAlert, Card


class FraudStatsView(APIView):
    """
    GET /api/analytics/stats/
    Returns statistics scoped to the logged-in user only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # All queries filtered to this user
        qs = Transaction.objects.filter(user=request.user)

        total = qs.count()
        fraud_count = qs.filter(prediction="Fraud").count()
        legit_count = qs.filter(prediction="Legitimate").count()
        avg_fraud_prob = qs.aggregate(avg=Avg("fraud_probability"))["avg"] or 0
        total_amount = qs.aggregate(total=Sum("amount"))["total"] or 0
        fraud_amount = qs.filter(prediction="Fraud").aggregate(total=Sum("amount"))["total"] or 0
        open_alerts = FraudAlert.objects.filter(
            transaction__user=request.user, resolved=False
        ).count()

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


class DailyTrendView(APIView):
    """
    GET /api/analytics/daily/
    Daily fraud trend for the logged-in user only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Transaction.objects
            .filter(user=request.user)
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


class HourlyTransactionsView(APIView):
    """
    GET /api/analytics/hourly/
    Hourly breakdown for the logged-in user only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Transaction.objects
            .filter(user=request.user)
            .annotate(hour=TruncHour("timestamp"))
            .values("hour")
            .annotate(
                total=Count("id"),
                fraud=Count("id", filter=Q(prediction="Fraud")),
            )
            .order_by("hour")
        )
        return Response(list(data))


class TopRiskyCardsView(APIView):
    """
    GET /api/analytics/risky-cards/
    Cards with most fraud transactions — scoped to the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Card.objects
            .filter(user=request.user)
            .annotate(fraud_count=Count(
                "transactions",
                filter=Q(transactions__prediction="Fraud")
            ))
            .filter(fraud_count__gt=0)
            .values("id", "card_last4", "holder_name", "fraud_count")
            .order_by("-fraud_count")[:10]
        )
        return Response(list(data))
