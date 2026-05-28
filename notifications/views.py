from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(notifs, many=True).data)

class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.notification_status = 'read'
            notif.save()
            return Response({'status': 'marked read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(user=request.user, notification_status='unread').update(notification_status='read')
        return Response({'status': 'all marked read'})
