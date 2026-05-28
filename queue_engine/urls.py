from django.urls import path
from .views import QueueStatusView, TokenStatusView, KitchenQueueView, RushLevelUpdateView

urlpatterns = [
    path('status/', QueueStatusView.as_view(), name='queue-status'),
    path('token/<str:token>/', TokenStatusView.as_view(), name='token-status'),
    path('kitchen/', KitchenQueueView.as_view(), name='kitchen-queue'),
    path('update-rush/', RushLevelUpdateView.as_view(), name='update-rush-level'),
]
