from django.contrib import admin
from .models import Note, UserProfile

from rest_framework.permissions import BasePermission

###
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):

        profile = request.user.profile

        if profile.role in ["admin", "moderator"]:
            return True

        return obj.author == request.user
    
class IsNotBanned(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.status != "banned"
        )

class IsAdminOrModerator(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.role in ["admin", "moderator"] and
            request.user.profile.status == "active"
        )

class CanCreatePost(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        profile = request.user.profile

        # Do not allow banned or restricted users to create posts
        if profile.status in ["banned", "restricted"]:
            return False

        return True

class CanDeletePost(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.role in ["admin", "moderator"] and
            request.user.profile.status == "active"
        )

class CanBanUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.role in ["admin", "moderator"] and
            request.user.profile.status == "active"
        )

class CanManageProducts(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.role == "admin" and
            request.user.profile.status == "active"
        )

class CanReportPost(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profile.status == "active"
        )
 
class IsOwnerOrAdminOrModerator(BasePermission):
    def has_object_permission(self, request, view, obj):

        if request.user.role in ["admin", "moderator"]:
            return True

        return obj.user == request.user
