from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from api.models import TaskGoal, TimeGoal


class Command(BaseCommand):
    help = "Mark daily/weekly TaskGoals and TimeGoals as 'missed' when their period has passed without completion."

    def handle(self, *args, **options):
        today = timezone.localdate()

        # ===== TaskGoal: Mark missed =====
        # Daily goals: date strictly before today and not completed/missed
        daily_task_qs = TaskGoal.objects.filter(period="daily", date__lt=today).exclude(status__in=("completed", "missed"))
        daily_task_count = daily_task_qs.update(status="missed")

        # Weekly goals: week start is in `date`. If week_end < today and not completed/missed => mark missed
        weekly_task_qs = TaskGoal.objects.filter(period="weekly").exclude(status__in=("completed", "missed"))
        weekly_task_count = 0
        for task in weekly_task_qs:
            week_end = task.date + timedelta(days=6)
            if week_end < today:
                task.status = "missed"
                task.save(update_fields=["status"])
                weekly_task_count += 1

        # ===== TimeGoal: Mark missed =====
        # Daily goals: date strictly before today and not completed/missed
        daily_time_qs = TimeGoal.objects.filter(period="daily", date__lt=today).exclude(status__in=("completed", "missed"))
        daily_time_count = daily_time_qs.update(status="missed")

        # Weekly goals: week start is in `date`. If week_end < today and not completed/missed => mark missed
        weekly_time_qs = TimeGoal.objects.filter(period="weekly").exclude(status__in=("completed", "missed"))
        weekly_time_count = 0
        for goal in weekly_time_qs:
            week_end = goal.date + timedelta(days=6)
            if week_end < today:
                goal.status = "missed"
                goal.save(update_fields=["status"])
                weekly_time_count += 1

        self.stdout.write(
            f"TaskGoal Daily missed: {daily_task_count}, Weekly missed: {weekly_task_count} | "
            f"TimeGoal Daily missed: {daily_time_count}, Weekly missed: {weekly_time_count}"
        )

