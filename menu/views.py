from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import MenuItem
from .serializers import MenuItemSerializer

class MenuListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        search   = request.query_params.get('search')
        items    = MenuItem.objects.all()
        if category:
            items = items.filter(category=category)
        if search:
            items = items.filter(item_name__icontains=search)
        return Response(MenuItemSerializer(items, many=True).data)

    def post(self, request):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        
        import json
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        if 'combo_items' in data:
            try:
                if isinstance(data['combo_items'], str):
                    data['combo_items'] = json.loads(data['combo_items'])
            except Exception:
                pass

        serializer = MenuItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class MenuDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return MenuItem.objects.get(pk=pk)
        except MenuItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({'error': 'Not found'}, status=404)
        return Response(MenuItemSerializer(item).data)

    def put(self, request, pk):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        item = self.get_object(pk)
        if not item:
            return Response({'error': 'Not found'}, status=404)

        import json
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        if 'combo_items' in data:
            try:
                if isinstance(data['combo_items'], str):
                    data['combo_items'] = json.loads(data['combo_items'])
            except Exception:
                pass

        serializer = MenuItemSerializer(item, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        item = self.get_object(pk)
        if not item:
            return Response({'error': 'Not found'}, status=404)
        item.delete()
        return Response(status=204)
