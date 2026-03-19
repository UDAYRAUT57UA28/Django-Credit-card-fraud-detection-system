from django.urls import path
from .views import (
    DetectFraudView,
    ModelComparisonView,
    TransactionListView,
    TransactionDetailView,
    CardListCreateView,
    FreezeCardView,
    FraudAlertListView,
    ResolveAlertView,
    MerchantBlacklistView,
    MerchantBlacklistDetailView,
)

urlpatterns = [
    path("detect/", DetectFraudView.as_view(), name="detect-fraud"),
    path("compare/", ModelComparisonView.as_view(), name="model-compare"),
    path("transactions/", TransactionListView.as_view(), name="transaction-list"),
    path("transactions/<int:pk>/", TransactionDetailView.as_view(), name="transaction-detail"),
    path("cards/", CardListCreateView.as_view(), name="card-list-create"),
    path("cards/<int:pk>/freeze/", FreezeCardView.as_view(), name="freeze-card"),
    path("alerts/", FraudAlertListView.as_view(), name="alert-list"),
    path("alerts/<int:pk>/resolve/", ResolveAlertView.as_view(), name="resolve-alert"),
    path("blacklist/", MerchantBlacklistView.as_view(), name="blacklist-list"),
    path("blacklist/<int:pk>/", MerchantBlacklistDetailView.as_view(), name="blacklist-detail"),
]
