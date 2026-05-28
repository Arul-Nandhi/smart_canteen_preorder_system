from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from authentication.models import User
from menu.models import MenuItem
from slots.models import Slot
from datetime import date, time

class OrderPlacementTests(APITestCase):
    def setUp(self):
        # Create users
        self.student = User.objects.create_user(
            email="test_student@gmail.com",
            name="Test Student",
            password="Password@123",
            role="student"
        )
        self.staff = User.objects.create_user(
            email="test_staff@gmail.com",
            name="Test Staff",
            password="Password@123",
            role="staff"
        )
        
        # Create menu items
        self.item1 = MenuItem.objects.create(
            item_name="Masala Dosa",
            category="breakfast",
            price=40.00,
            is_veg=True,
            prep_time_mins=10
        )
        self.item2 = MenuItem.objects.create(
            item_name="Apple Juice",
            category="juices",
            price=20.00,
            is_veg=True,
            prep_time_mins=5
        )
        
        # Create combo item
        self.combo = MenuItem.objects.create(
            item_name="Masala Dosa Combo",
            category="combo",
            price=55.00,
            is_veg=True,
            prep_time_mins=12,
            combo_items=[self.item1.id, self.item2.id]
        )
        
        # Create a slot
        self.slot = Slot.objects.create(
            slot_date=date.today(),
            start_time=time(12, 0),
            end_time=time(12, 10),
            max_orders=30
        )

    def test_place_instant_order_standard_items(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('order-list') if hasattr(reverse, 'order-list') else '/api/orders/'
        
        payload = {
            "order_type": "instant",
            "payment_method": "cash",
            "special_instructions": "Less spicy",
            "items": [
                {"item_id": self.item1.id, "quantity": 2},
                {"item_id": self.item2.id, "quantity": 1}
            ]
        }
        
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token_number', response.data)
        self.assertTrue(response.data['token_number'].startswith('I'))
        self.assertEqual(float(response.data['total_amount']), 100.00) # (40*2) + 20

    def test_place_instant_order_combo_item(self):
        self.client.force_authenticate(user=self.student)
        url = '/api/orders/'
        
        payload = {
            "order_type": "instant",
            "payment_method": "cash",
            "special_instructions": "",
            "items": [
                {"item_id": self.combo.id, "quantity": 1}
            ]
        }
        
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token_number', response.data)
        self.assertEqual(float(response.data['total_amount']), 55.00)

    def test_place_preorder_with_slot(self):
        self.client.force_authenticate(user=self.student)
        url = '/api/orders/'
        
        payload = {
            "order_type": "preorder",
            "slot_id": self.slot.id,
            "payment_method": "upi",
            "special_instructions": "",
            "items": [
                {"item_id": self.item1.id, "quantity": 1}
            ]
        }
        
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['token_number'].startswith('P'))
        self.assertEqual(float(response.data['total_amount']), 40.00)
        self.assertEqual(response.data['payment']['payment_status'], 'success')
