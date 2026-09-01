from django.contrib import admin
from .models import Note, UserProfile

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "created_at")
    list_filter = ("author", "created_at")
    search_fields = ("title", "content", "author__username")
    ordering = ("-created_at",)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "status")
    list_filter = ("role", "status")
    search_fields = ("user__username",)