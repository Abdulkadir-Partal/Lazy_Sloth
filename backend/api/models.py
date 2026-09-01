from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

# Create your models here.
class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_verification")

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.username} - verification token"

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to="note_images/", null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'note')  # Her kullanıcı bir postu bir kez beğenebilir

    def __str__(self):
        return f"{self.user.username} likes {self.note.title}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} commented on {self.note.title}"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("moderator", "Moderator"),
        ("user", "User"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("restricted", "Restricted"),
        ("banned", "Banned"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


# ← YENİ: Pomodoro Session - Her çalışma seansı kaydedilir
class PomodoroSession(models.Model):
    # ← User ile bağlantı (Note'taki author gibi)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pomodoro_sessions")
    
    # ← Planlanan ve gerçek süre (dakika)
    duration = models.IntegerField()  # Planlanan dakika (25, 45 vb)
    actual_duration = models.IntegerField(default=0)  # Gerçek çalışılan dakika
    
    # ← Zaman takibi
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)  # null = devam ediyor
    
    # ← Durum
    is_completed = models.BooleanField(default=False)  # Tamamlandı mı?
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.duration}min"


# ← YENİ: Pomodoro İstatistikleri - Günlük/Haftalık toplam
class PomodoroStatistics(models.Model):
    # ← User ile bağlantı
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pomodoro_stats")
    
    # ← Tarih bilgisi
    date = models.DateField()  # Günlük tracking (2026-01-29)
    
    # ← Toplam veriler
    total_duration = models.IntegerField(default=0)  # Toplam dakika
    session_count = models.IntegerField(default=0)  # Kaç session?
    
    # ← Son güncelleme
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'date')  # ← Aynı gün için tek istatistik
    
    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.total_duration}min)"

# ← YENİ: Günlük / Haftalık süre hedefleri
class TimeGoal(models.Model):
    PERIOD_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),      # Henüz yapılmadı
        ("completed", "Completed"),  # Kullanıcı tickledi
        ("missed", "Missed"),        # Süresi geçti, otomatik
    ]

    # Hedef kullanıcıya ait
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="time_goals"
    )

    # Günlük mi haftalık mı
    period = models.CharField(
        max_length=10,
        choices=PERIOD_CHOICES
    )

    # Hedef süre (dakika cinsinden)
    # Örn: 4 saat = 240
    target_minutes = models.IntegerField()

    # 🔴 KRİTİK ALANLAR
    # daily  → o günün tarihi
    # weekly → haftanın başlangıç günü (örn. pazartesi)
    date = models.DateField(default=None)  # Kullanıcı tarafından ayarlanacak

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 🔴 Aynı period/date kombı her kullanıcı için unique
        unique_together = ("user", "period", "date")

    def __str__(self):
        return f"{self.user.username} - {self.period} ({self.target_minutes} min)"

# ← YENİ: Günlük / Haftalık görev hedefleri (checklist)
class TaskGoal(models.Model):
    PERIOD_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),     # Henüz yapılmadı
        ("completed", "Completed"), # Kullanıcı tickledi
        ("missed", "Missed"),       # Süresi geçti, otomatik
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_goals"
    )

    # Görev başlığı
    title = models.CharField(max_length=255)

    # Günlük mü haftalık mı
    period = models.CharField(
        max_length=10,
        choices=PERIOD_CHOICES
    )

    # 🔴 KRİTİK ALAN
    # daily  → o günün tarihi
    # weekly → haftanın başlangıç günü (örn. pazartesi)
    date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.period}) - {self.status}"

# ← YENİ: Post Report Sistemi -----------------------------report
class Report(models.Model):

    REASON_CHOICES = [
        ("spam", "Spam"),
        ("harassment", "Harassment"),
        ("hate", "Hate Speech"),
        ("violence", "Violence"),
        ("nudity", "Nudity"),
        ("fake", "Fake Information"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("ignored", "Ignored"),
    ]

    # Raporlayan kullanıcı
    reporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reports_sent"
    )

    # Raporlanan post
    note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    # Sebep
    reason = models.CharField(
        max_length=30,
        choices=REASON_CHOICES
    )

    # Ek açıklama
    description = models.TextField(blank=True, null=True)

    # Moderation status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    # Moderatör notu
    moderator_note = models.TextField(blank=True, null=True)

    # İnceleyen moderator
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_reports"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Aynı kullanıcı aynı postu tekrar tekrar reportlayamasın
        unique_together = ("reporter", "note")

    def __str__(self):
        return f"{self.reporter.username} reported {self.note.title}"
    
# ← YENİ: Ürün Sistemi  -----------------------------------product
class Product(models.Model):

    title = models.CharField(max_length=255)

    description = models.TextField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    stock = models.IntegerField(default=0)

    image = models.ImageField(
        upload_to="product_images/",
        null=True,
        blank=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
# ← YENİ: Cart ------------------------------cart
class Cart(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="cart"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} cart"
    
# ← YENİ: Cart Item
class CartItem(models.Model):

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    quantity = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product")

    def __str__(self):
        return f"{self.product.title} x {self.quantity}"