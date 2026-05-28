from django.urls import path
from .views import MenuListView, MenuDetailView

urlpatterns = [
    path('', MenuListView.as_view(), name='menu-list'),
    path('<int:pk>/', MenuDetailView.as_view(), name='menu-detail'),
]
