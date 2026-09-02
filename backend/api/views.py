from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (AdminUserSerializer, NoteSerializer, UserSerializer, UserProfileUpdateSerializer, UserProfileSerializer,CustomTokenObtainPairSerializer, PomodoroSessionSerializer, PomodoroStatisticsSerializer)
from .models import Report
from .serializers import ReportSerializer
from .serializers import TimeGoalSerializer, TaskGoalSerializer, CommentSerializer
from .permissions import IsAdminOrModerator, IsOwnerOrAdmin, CanCreatePost, IsOwnerOrAdminOrModerator
from .models import Note, UserProfile,PomodoroSession, PomodoroStatistics, Like, Comment, TimeGoal, TaskGoal, Product, Cart, CartItem, EmailVerificationToken
from rest_framework.generics import UpdateAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponse
from .serializers import (ProductSerializer, CartSerializer, CartItemSerializer,)
from datetime import date, timedelta
from django.utils import timezone



class UserProfileDetailView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user.profile

class UserProfileUpdateView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self):
        pk = self.kwargs.get('pk')
        profile = UserProfile.objects.get(user_id=pk)
        
        # Kendi profilini güncelleyebilir, yada admin/moderator'ler başkasını
        if self.request.user.id != profile.user_id:
            user_profile = self.request.user.profile
            if user_profile.role not in ["admin", "moderator"]:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Başkasının profilini güncelleyemezsiniz.")
        
        return profile

###
class AdminUserUpdateView(UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrModerator]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrModerator]


class NoteCreateView(APIView):
    permission_classes = [CanCreatePost]

    def post(self, request):
        serializer = NoteSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        # Allow anyone to GET the list of notes (homepage). Only authenticated
        # users who pass CanCreatePost may create (POST).
        if self.request.method == "GET":
            from rest_framework.permissions import AllowAny
            return [AllowAny()]

        return [IsAuthenticated(), CanCreatePost()]

    def get_queryset(self):
        return Note.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class NoteDelete(generics.DestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

class NoteLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.get(pk=pk)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        like, created = Like.objects.get_or_create(user=request.user, note=note)

        if not created:
            # Already liked, so unlike
            like.delete()
            liked = False
        else:
            liked = True

        # Return updated like count and user's like status
        like_count = note.likes.count()
        return Response({
            "liked": liked,
            "like_count": like_count
        })

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        note_id = self.kwargs['note_id']
        return Comment.objects.filter(note_id=note_id).order_by('created_at')

    def perform_create(self, serializer):
        note_id = self.kwargs['note_id']
        note = Note.objects.get(id=note_id)
        serializer.save(user=self.request.user, note=note)


class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

################################################################# şüpheli
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        user.is_active = False
        user.save()

        # 1. token create
        token_obj = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        # 2. verification link
        link = f"{settings.BACKEND_URL}/api/auth/verify-email/{token_obj.token}/"

        # 3. email send (console backend ise terminale düşer)
        send_mail(
            subject="Email Verification",
            message=f"Verify your account: {link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )

class VerifyEmailView(APIView):
    permission_classes = []

    def get(self, request, token):

        try:
            verification = EmailVerificationToken.objects.get(
                token=token
            )

        except EmailVerificationToken.DoesNotExist:
            return HttpResponse(
                "Invalid verification link.",
                status=400
            )

        if verification.is_used:
            return HttpResponse(
                "This verification link has already been used.",
                status=400
            )

        if verification.expires_at < timezone.now():
            return HttpResponse(
                "Verification link expired.",
                status=400
            )

        user = verification.user

        user.is_active = True
        user.save()

        verification.is_used = True
        verification.save()

        return HttpResponse(
            "Email verified successfully. You can now login."
        )

#----------------------------------------------------------------------------------------------
class UserDetailByUsernameView(generics.RetrieveAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'

    def get_queryset(self):
        return User.objects.all()

# ← Belirli bir kullanıcının postlarını döner - Home gibi basit
class UserPostsView(generics.ListAPIView):
    serializer_class = NoteSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        username = self.kwargs.get('username')
        return Note.objects.filter(author__username=username).order_by('-created_at')

#################################pomodoro
class PomodoroStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        duration = request.data.get("duration")

        if not duration:
            return Response(
                {"error": "duration is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = PomodoroSession.objects.create(
            user=request.user,
            duration=duration
        )

        return Response(
            PomodoroSessionSerializer(session).data,
            status=status.HTTP_201_CREATED
        )

class PomodoroCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = PomodoroSession.objects.get(
                id=session_id,
                user=request.user,
                is_completed=False
            )
        except PomodoroSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        actual_duration = request.data.get("actual_duration")

        if actual_duration is None:
            return Response(
                {"error": "actual_duration is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.actual_duration = actual_duration
        session.ended_at = timezone.now()
        session.is_completed = True
        session.save()

        # 📊 Günlük istatistik güncelle
        today = date.today()

        stats, _ = PomodoroStatistics.objects.get_or_create(
            user=request.user,
            date=today
        )

        stats.total_duration += actual_duration
        stats.session_count += 1
        stats.save()

        return Response({"message": "Pomodoro completed"})

class PomodoroCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = PomodoroSession.objects.get(
                id=session_id,
                user=request.user,
                is_completed=False
            )
        except PomodoroSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        session.ended_at = timezone.now()
        session.actual_duration = request.data.get("actual_duration", 0)
        session.is_completed = False
        session.save()

        return Response({"message": "Pomodoro cancelled"})

class PomodoroStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_start = today - timedelta(days=6)

        daily = PomodoroStatistics.objects.filter(
            user=request.user,
            date=today
        ).first()

        weekly_stats = PomodoroStatistics.objects.filter(
            user=request.user,
            date__range=(week_start, today)
        )

        weekly_total = sum(s.total_duration for s in weekly_stats)
        weekly_sessions = sum(s.session_count for s in weekly_stats)

        return Response({
            "daily": {
                "total_duration": daily.total_duration if daily else 0,
                "session_count": daily.session_count if daily else 0
            },
            "weekly": {
                "total_duration": weekly_total,
                "session_count": weekly_sessions
            }
        })


### TimeGoal endpoints
class TimeGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = TimeGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TimeGoal.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TimeGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TimeGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TimeGoal.objects.filter(user=self.request.user)


class TimeGoalToggleCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            goal = TimeGoal.objects.get(pk=pk, user=request.user)
        except TimeGoal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Toggle to completed
        goal.status = "completed"
        goal.save()

        return Response({"message": "Time goal marked completed"})


### TaskGoal endpoints
class TaskGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskGoal.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskGoal.objects.filter(user=self.request.user)


class TaskGoalToggleCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            task = TaskGoal.objects.get(pk=pk, user=request.user)
        except TaskGoal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Toggle to completed
        task.status = "completed"
        task.save()

        return Response({"message": "Task marked completed"})


class TimeGoalShareView(APIView):
    permission_classes = [IsAuthenticated, CanCreatePost]

    def post(self, request, pk):
        try:
            goal = TimeGoal.objects.get(pk=pk, user=request.user)
        except TimeGoal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        extra_note = request.data.get("extra_note", "")

        # compute progress (same logic as serializer)
        from datetime import timedelta

        try:
            if goal.period == "daily":
                stats = PomodoroStatistics.objects.filter(user=goal.user, date=goal.date).first()
                actual = stats.total_duration if stats else 0
            else:
                end = goal.date + timedelta(days=6)
                qs = PomodoroStatistics.objects.filter(user=goal.user, date__range=(goal.date, end))
                actual = sum(s.total_duration for s in qs)

            percent = (actual / goal.target_minutes * 100) if goal.target_minutes else 0
        except Exception:
            actual = 0
            percent = 0

        # Format status display
        status_emoji = "✓" if goal.status == "completed" else "⏳" if goal.status == "pending" else "✗"
        period_label = "📅 Günlük" if goal.period == "daily" else "📆 Haftalık"
        
        title = f"🎯 Hedef Paylaşımı: {goal.target_minutes}dk ({goal.period})"
        
        # User note first, then goal details
        if extra_note:
            content = (
                f"💭 Kullanıcı Notu:\n"
                f"{extra_note}\n\n"
                f"━━━━━━━━━━━━━━━━\n\n"
                f"📊 Hedef Detayları:\n"
                f"{period_label}\n"
                f"Hedef: {goal.target_minutes} dakika\n"
                f"Mevcut: {actual} dakika ({percent:.1f}%)\n"
                f"Durum: {status_emoji} {goal.status.capitalize()}"
            )
        else:
            content = (
                f"📊 Hedef Detayları:\n"
                f"{period_label}\n"
                f"Hedef: {goal.target_minutes} dakika\n"
                f"Mevcut: {actual} dakika ({percent:.1f}%)\n"
                f"Durum: {status_emoji} {goal.status.capitalize()}"
            )

        note = Note.objects.create(title=title, content=content, author=request.user)

        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)


class TaskGoalShareView(APIView):
    permission_classes = [IsAuthenticated, CanCreatePost]

    def post(self, request, pk):
        try:
            task = TaskGoal.objects.get(pk=pk, user=request.user)
        except TaskGoal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        extra_note = request.data.get("extra_note", "")

        # Format status display
        status_emoji = "✓" if task.status == "completed" else "⏳" if task.status == "pending" else "✗"
        period_label = "📅 Günlük" if task.period == "daily" else "📆 Haftalık"
        
        title = f"✅ Görev Paylaşımı: {task.title}"
        
        # User note first, then task details
        if extra_note:
            content = (
                f"💭 Kullanıcı Notu:\n"
                f"{extra_note}\n\n"
                f"━━━━━━━━━━━━━━━━\n\n"
                f"📋 Görev Detayları:\n"
                f"{period_label}\n"
                f"Görev: {task.title}\n"
                f"Durum: {status_emoji} {task.status.capitalize()}"
            )
        else:
            content = (
                f"📋 Görev Detayları:\n"
                f"{period_label}\n"
                f"Görev: {task.title}\n"
                f"Durum: {status_emoji} {task.status.capitalize()}"
            )

        note = Note.objects.create(title=title, content=content, author=request.user)

        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)

class UserPomodoroStatsView(APIView):
    """Belirli bir kullanıcının günlük/haftalık istatistiklerini döner"""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        week_start = today - timedelta(days=6)

        daily = PomodoroStatistics.objects.filter(
            user=user,
            date=today
        ).first()

        weekly_stats = PomodoroStatistics.objects.filter(
            user=user,
            date__range=(week_start, today)
        )

        weekly_total = sum(s.total_duration for s in weekly_stats)
        weekly_sessions = sum(s.session_count for s in weekly_stats)

        return Response({
            "daily": {
                "total_duration": daily.total_duration if daily else 0,
                "session_count": daily.session_count if daily else 0
            },
            "weekly": {
                "total_duration": weekly_total,
                "session_count": weekly_sessions
            }
        })


class UserPomodoroSessionsView(generics.ListAPIView):
    """Belirli bir kullanıcının son pomodoro seanslarını döner"""
    serializer_class = PomodoroSessionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        username = self.kwargs.get('username')
        try:
            user = User.objects.get(username=username)
            return PomodoroSession.objects.filter(
                user=user
            ).order_by('-started_at')[:10]  # Son 10 seansı göster
        except User.DoesNotExist:
            return PomodoroSession.objects.none()


class UserTimeGoalsView(generics.ListAPIView):
    """Belirli bir kullanıcının zaman hedeflerini döner"""
    serializer_class = TimeGoalSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        username = self.kwargs.get('username')
        try:
            user = User.objects.get(username=username)
            return TimeGoal.objects.filter(user=user).order_by('-created_at')
        except User.DoesNotExist:
            return TimeGoal.objects.none()


class UserTaskGoalsView(generics.ListAPIView):
    """Belirli bir kullanıcının görev hedeflerini döner"""
    serializer_class = TaskGoalSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        username = self.kwargs.get('username')
        try:
            user = User.objects.get(username=username)
            return TaskGoal.objects.filter(user=user).order_by('-created_at')
        except User.DoesNotExist:
            return TaskGoal.objects.none()
        
class ReportCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ReportSerializer(data=request.data)

        if serializer.is_valid():

            note = serializer.validated_data["note"]

            # kendi postunu reportlayamasın
            if note.author == request.user:
                return Response(
                    {"error": "You cannot report your own post"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save(reporter=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class ReportListView(generics.ListAPIView):

    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get_queryset(self):
        return Report.objects.all().order_by("-created_at")
    
class ReportActionView(APIView):

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):

        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"error": "Report not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get("action")

        target_user = report.note.author

        # ignore
        if action == "ignore":

            report.status = "ignored"

        # restrict
        elif action == "restrict":

            target_user.profile.status = "restricted"
            target_user.profile.save()

            report.status = "reviewed"

        # unrestrict
        elif action == "unrestrict":

            target_user.profile.status = "active"
            target_user.profile.save()

            report.status = "reviewed"

        # ban
        elif action == "ban":

            target_user.profile.status = "banned"
            target_user.profile.save()

            report.status = "reviewed"

        # delete post
        elif action == "delete_post":

            report.note.delete()

            report.status = "reviewed"

        else:
            return Response(
                {"error": "Invalid action"},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.reviewed_by = request.user
        report.moderator_note = request.data.get(
            "moderator_note",
            ""
        )

        report.save()

        return Response({
            "message": "Action applied successfully"
        })
    
#product endpoints
class ProductListView(generics.ListAPIView):

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True
        ).order_by("-created_at")
    
class ProductCreateView(generics.CreateAPIView):

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrModerator]
    parser_classes = [MultiPartParser, FormParser]

class ProductUpdateView(generics.UpdateAPIView):

    queryset = Product.objects.all()

    serializer_class = ProductSerializer

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    parser_classes = [MultiPartParser, FormParser]

class ProductDeleteView(generics.DestroyAPIView):

    queryset = Product.objects.all()

    serializer_class = ProductSerializer

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

class CartView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        serializer = CartSerializer(cart)

        return Response(serializer.data)
    
class AddToCartView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        product_id = request.data.get("product_id")

        quantity = int(request.data.get("quantity", 1))

        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True
            )
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.stock < quantity:
            return Response(
                {"error": "Not enough stock"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        if created:
            item.quantity = quantity
        else:
            item.quantity += quantity

        if item.quantity > product.stock:
            return Response(
                {"error": "Stock exceeded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.save()

        return Response({
            "message": "Added to cart"
        })
    
class RemoveFromCartView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        item_id = request.data.get("item_id")

        try:
            item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response(
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()

        return Response({
            "message": "Item removed"
        })

class CheckoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        items = cart.items.all()

        if not items.exists():
            return Response(
                {"error": "Cart is empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # stock check
        for item in items:

            if item.quantity > item.product.stock:

                return Response(
                    {
                        "error":
                        f"Not enough stock for {item.product.title}"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # stock düş
        for item in items:

            product = item.product

            product.stock -= item.quantity

            product.save()

        # cart temizle
        items.delete()

        return Response({
            "message": "Checkout successful"
        })