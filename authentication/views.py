from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .models import User

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user

        # Handle password change
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        if current_password or new_password:
            if not current_password:
                return Response({'current_password': ['Current password is required.']}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(current_password):
                return Response({'current_password': ['Incorrect current password.']}, status=status.HTTP_400_BAD_REQUEST)
            if not new_password or len(new_password) < 6:
                return Response({'new_password': ['New password must be at least 6 characters.']}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password changed successfully.'})

        # Handle profile field updates
        data = {k: v for k, v in request.data.items() if k not in ('current_password', 'new_password')}
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        users = User.objects.all().order_by('-created_at')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            user = User.objects.get(pk=pk)
            if user.role == 'admin':
                return Response({'error': 'Cannot delete admin account'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            user = User.objects.get(pk=pk)
            password = request.data.get('password')
            if password:
                if len(password) < 6:
                    return Response({'password': ['At least 6 characters required']}, status=status.HTTP_400_BAD_REQUEST)
                user.set_password(password)
                user.save()
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            return Response({'message': f'Password reset link has been sent to {email}.'})
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
