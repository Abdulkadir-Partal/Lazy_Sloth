from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import Report
from .models import Note, UserProfile, PomodoroSession, PomodoroStatistics, TimeGoal, TaskGoal, Like, Comment
from .models import Product, Cart, CartItem

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        token["role"] = profile.role
        token["status"] = profile.status
        token["username"] = user.username
        token["avatar"] = profile.avatar.url if profile.avatar else None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if profile.status == "banned":
            raise AuthenticationFailed("Your account is banned.")

        data["role"] = profile.role
        data["status"] = profile.status
        data["username"] = user.username
        data["email"] = user.email
        data["avatar"] = profile.avatar.url if profile.avatar else None


        return data
    ###
    def validate_avatar(self, value):
        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Avatar size must be under 2MB")

        return value


class UserSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["id", "username","email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        return user
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "This email is already in use."
            )

        return value

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id","role", "status", "avatar","bio"]

    def validate_bio(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Bio maksimum 500 karakter olabilir.")
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "profile"]


class NoteSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    user_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = ["id", "title", "content", "image", "created_at", "author", "author_username", "author_avatar", "like_count", "user_liked", "comment_count"]
        extra_kwargs = {"author": {"read_only": True}}

    def get_author_avatar(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.avatar:
            return obj.author.profile.avatar.url
        return None

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_user_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_comment_count(self, obj):
        return obj.comments.count()

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id","role","status"]

##################################################pomodoro
class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = "__all__"
        read_only_fields = (
            "user",
            "actual_duration",
            "started_at",
            "ended_at",
            "is_completed",
            "created_at",
        )


class PomodoroStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroStatistics
        fields = "__all__"
        read_only_fields = ("user", "updated_at")


class TimeGoalSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TimeGoal
        fields = ["id", "user", "period", "target_minutes", "date", "status", "created_at", "progress"]
        read_only_fields = ("user", "created_at", "progress")

    def get_progress(self, obj):
        # Do a best-effort calculation using PomodoroStatistics; keep simple so it
        # works with the current models.py (no model changes).
        from .models import PomodoroStatistics
        from datetime import timedelta, date

        try:
            if obj.period == "daily":
                stats = PomodoroStatistics.objects.filter(user=obj.user, date=obj.date).first()
                actual = stats.total_duration if stats else 0
            else:
                # weekly: sum from obj.date for 7 days
                end = obj.date + timedelta(days=6)
                qs = PomodoroStatistics.objects.filter(user=obj.user, date__range=(obj.date, end))
                actual = sum(s.total_duration for s in qs)

            percent = (actual / obj.target_minutes * 100) if obj.target_minutes else 0
            return {"actual_minutes": actual, "target_minutes": obj.target_minutes, "percentage": percent}
        except Exception:
            return {"actual_minutes": 0, "target_minutes": obj.target_minutes, "percentage": 0}


class TaskGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskGoal
        fields = ["id", "user", "title", "period", "date", "status", "created_at"]
        read_only_fields = ("user", "created_at")


class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_username', 'user_avatar', 'content', 'created_at']
        read_only_fields = ('user', 'created_at')

    def get_user_avatar(self, obj):
        if obj.user.profile.avatar:
            return obj.user.profile.avatar.url
        return None
    
class ReportSerializer(serializers.ModelSerializer):

    reporter_username = serializers.CharField(
        source="reporter.username",
        read_only=True
    )

    note_title = serializers.CharField(
        source="note.title",
        read_only=True
    )

    note_author = serializers.CharField(
        source="note.author.username",
        read_only=True
    )

    note_author_status = serializers.CharField(
        source="note.author.profile.status",
        read_only=True
    )

    class Meta:
        model = Report

        fields = [
            "id",
            "reporter",
            "reporter_username",
            "note",
            "note_title",
            "note_author",
            "note_author_status",
            "reason",
            "description",
            "status",
            "moderator_note",
            "reviewed_by",
            "created_at",
        ]

        read_only_fields = [
            "reporter",
            "status",
            "reviewed_by",
        ]

class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product

        fields = [
            "id",
            "title",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]

class CartItemSerializer(serializers.ModelSerializer):

    product = ProductSerializer(read_only=True)

    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem

        fields = [
            "id",
            "product",
            "product_id",
            "quantity",
        ]

class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart

        fields = [
            "id",
            "items",
            "created_at",
        ]