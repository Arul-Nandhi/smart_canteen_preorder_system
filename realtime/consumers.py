from channels.generic.websocket import AsyncWebsocketConsumer
import json

class StaffConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        # allow only authenticated staff/admin users
        if not user or user.is_anonymous or getattr(user, 'role', None) not in ['staff', 'admin']:
            await self.close()
            return
        await self.channel_layer.group_add('staff', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('staff', self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # No client-side messages expected for now
        return

    async def order_update(self, event):
        # event['data'] should be serializable dict
        await self.send(text_data=json.dumps({ 'type': 'order_update', 'data': event.get('data') }))

    async def notification(self, event):
        await self.send(text_data=json.dumps({ 'type': 'notification', 'data': event.get('data') }))
