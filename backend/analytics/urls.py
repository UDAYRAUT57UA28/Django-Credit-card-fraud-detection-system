from django.urls import path
from .views import FraudStatsView, HourlyTransactionsView, DailyTrendView, TopRiskyCardsView

urlpatterns = [
    path("stats/", FraudStatsView.as_view(), name="fraud-stats"),
    path("hourly/", HourlyTransactionsView.as_view(), name="hourly-transactions"),
    path("daily/", DailyTrendView.as_view(), name="daily-trend"),
    path("risky-cards/", TopRiskyCardsView.as_view(), name="risky-cards"),
]
