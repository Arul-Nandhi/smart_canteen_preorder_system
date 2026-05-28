from django.urls import path
from .views import SlotListView, SlotDetailView, SmartSlotListView

urlpatterns = [
    path('', SlotListView.as_view(), name='slot-list'),
    path('smart/', SmartSlotListView.as_view(), name='smart-slot-list'),
    path('<int:pk>/', SlotDetailView.as_view(), name='slot-detail'),
]

