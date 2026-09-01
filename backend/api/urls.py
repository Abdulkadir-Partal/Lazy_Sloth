from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    NoteListCreateView,
    NoteDelete,
    NoteLikeToggleView,
    CommentListCreateView,
    CommentDeleteView,
    CustomTokenObtainPairView,
    CreateUserView,
    AdminUserListView,
    AdminUserUpdateView,
    ReportListView,
    UserProfileUpdateView,
    UserProfileDetailView,
    UserDetailByUsernameView,
    UserPostsView,

    PomodoroStartView,
    PomodoroCompleteView,
    PomodoroCancelView,
    PomodoroStatsView,
    TimeGoalListCreateView,
    TimeGoalDetailView,
    TimeGoalToggleCompleteView,
    TimeGoalShareView,
    TaskGoalListCreateView,
    TaskGoalDetailView,
    TaskGoalToggleCompleteView,
    TaskGoalShareView,
    
    UserPomodoroStatsView,
    UserPomodoroSessionsView,
    UserTimeGoalsView,
    UserTaskGoalsView,
    ReportCreateView,
    ReportActionView,
    ProductListView,
    ProductCreateView,  
    ProductUpdateView,
    ProductDeleteView,
    CartView,
    AddToCartView,
    RemoveFromCartView,
    CheckoutView,
    VerifyEmailView
)

urlpatterns = [

    # Notes
    path("notes/", NoteListCreateView.as_view(), name="note-list"),
    path("notes/delete/<int:pk>/", NoteDelete.as_view(), name="delete-note"),
    path("notes/<int:pk>/like/", NoteLikeToggleView.as_view(), name="note-like-toggle"),
    path("notes/<int:note_id>/comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/", CommentDeleteView.as_view(), name="comment-delete"),

    # Auth
    path("user/register/", CreateUserView.as_view(), name="user-register"),
    path("user/<str:username>/", UserDetailByUsernameView.as_view(), name="user-detail"),
    path("user/<str:username>/posts/", UserPostsView.as_view(), name="user-posts"),
    path("user/<str:username>/pomodoro/stats/", UserPomodoroStatsView.as_view(), name="user-pomodoro-stats"),
    path("user/<str:username>/pomodoro/sessions/", UserPomodoroSessionsView.as_view(), name="user-pomodoro-sessions"),
    path("user/<str:username>/goals/time/", UserTimeGoalsView.as_view(), name="user-time-goals"),
    path("user/<str:username>/goals/tasks/", UserTaskGoalsView.as_view(), name="user-task-goals"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify-email/<uuid:token>/",VerifyEmailView.as_view(),name="verify-email"),
    # Admin
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/profile/<int:pk>/", AdminUserUpdateView.as_view(), name="admin-user-profile-update"),

    path("profile/update/<int:pk>/", UserProfileUpdateView.as_view()),
    path("profile/<int:pk>/", UserProfileDetailView.as_view()),

    # Pomodoro
    path("pomodoro/start/", PomodoroStartView.as_view()),
    path("pomodoro/complete/<int:session_id>/", PomodoroCompleteView.as_view()),
    path("pomodoro/stats/", PomodoroStatsView.as_view()),
    path("pomodoro/cancel/<int:session_id>/",PomodoroCancelView.as_view())
    ,
    # Goals
    path("goals/time/", TimeGoalListCreateView.as_view()),
    path("goals/time/<int:pk>/", TimeGoalDetailView.as_view()),
    path("goals/time/<int:pk>/complete/", TimeGoalToggleCompleteView.as_view()),
    path("goals/time/<int:pk>/share/", TimeGoalShareView.as_view()),
    path("goals/tasks/", TaskGoalListCreateView.as_view()),
    path("goals/tasks/<int:pk>/", TaskGoalDetailView.as_view()),
    path("goals/tasks/<int:pk>/complete/", TaskGoalToggleCompleteView.as_view()),
    path("goals/tasks/<int:pk>/share/", TaskGoalShareView.as_view()),

    path("reports/create/", ReportCreateView.as_view()),
    path("reports/", ReportListView.as_view()),
    path("reports/<int:pk>/action/", ReportActionView.as_view()),
    # products
    path("products/", ProductListView.as_view()),
    path("products/create/", ProductCreateView.as_view()),
    path("products/<int:pk>/update/", ProductUpdateView.as_view()),
    path("products/<int:pk>/delete/", ProductDeleteView.as_view()),

    # cart
    path("cart/", CartView.as_view()),
    path("cart/add/", AddToCartView.as_view()),
    path("cart/remove/", RemoveFromCartView.as_view()),
    path("cart/checkout/", CheckoutView.as_view()),
    
    
]