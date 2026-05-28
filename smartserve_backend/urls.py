from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from orders.views import FeedbackListView, FeedbackDetailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/slots/', include('slots.urls')),
    path('api/queue/', include('queue_engine.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/feedback/', FeedbackListView.as_view(), name='feedback-list'),
    path('api/feedback/<int:pk>/', FeedbackDetailView.as_view(), name='feedback-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

