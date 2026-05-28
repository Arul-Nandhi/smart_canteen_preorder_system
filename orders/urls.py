from django.urls import path
from .views import OrderListView, OrderDetailView, AllOrdersView, OrderBillingView, OrderReceiptView

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('all/', AllOrdersView.as_view(), name='order-all'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/bill/', OrderBillingView.as_view(), name='order-billing'),
    path('<int:pk>/receipt/', OrderReceiptView.as_view(), name='order-receipt'),
]
