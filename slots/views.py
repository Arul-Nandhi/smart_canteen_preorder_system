from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import date, datetime, time
from .models import Slot
from .serializers import SlotSerializer

class SlotListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = request.query_params.get('date', str(date.today()))
        try:
            target_date = datetime.strptime(today, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()
            today = str(target_date)

        slots = Slot.objects.filter(slot_date=target_date)
        if not slots.exists():
            standard_slots = [
                {"start": time(10, 30), "end": time(11, 00), "max_orders": 30},
                {"start": time(12, 30), "end": time(13, 30), "max_orders": 80},
                {"start": time(15, 30), "end": time(16, 00), "max_orders": 40},
                {"start": time(18, 00), "end": time(19, 00), "max_orders": 50},
            ]
            for s in standard_slots:
                Slot.objects.create(
                    slot_date=target_date,
                    start_time=s['start'],
                    end_time=s['end'],
                    max_orders=s['max_orders'],
                    slot_status='open'
                )
            slots = Slot.objects.filter(slot_date=target_date)
        return Response(SlotSerializer(slots, many=True).data)

    def post(self, request):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        serializer = SlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class SlotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            slot = Slot.objects.get(pk=pk)
            return Response(SlotSerializer(slot).data)
        except Slot.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def put(self, request, pk):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            slot = Slot.objects.get(pk=pk)
        except Slot.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        serializer = SlotSerializer(slot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            slot = Slot.objects.get(pk=pk)
            slot.delete()
            return Response(status=204)
        except Slot.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


from datetime import timedelta

class SmartSlotListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = datetime.now()
        start = now.replace(second=0, microsecond=0)
        minutes = start.minute
        remainder = minutes % 10
        if remainder != 0:
            start += timedelta(minutes=(10 - remainder))
        
        slots_data = []
        for i in range(18): # 3 hours * 6 slots/hour = 18 slots
            slot_start_dt = start + timedelta(minutes=i * 10)
            slot_end_dt = slot_start_dt + timedelta(minutes=10)
            
            slot_date = slot_start_dt.date()
            start_time = slot_start_dt.time()
            end_time = slot_end_dt.time()

            # Find or create
            slot, created = Slot.objects.get_or_create(
                slot_date=slot_date,
                start_time=start_time,
                end_time=end_time,
                defaults={
                    'max_orders': 30,
                    'current_orders': 0,
                    'slot_status': 'open'
                }
            )
            slots_data.append(slot)
            
        serializer = SlotSerializer(slots_data, many=True)
        return Response(serializer.data)

