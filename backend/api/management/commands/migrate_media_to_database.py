from pathlib import Path
import mimetypes

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from api.models import MediaBlob


class Command(BaseCommand):
    help = "Copies files from the local media directory into database-backed media storage."

    def add_arguments(self, parser):
        parser.add_argument("--source", help="Local media directory (defaults to MEDIA_ROOT).")
        parser.add_argument("--dry-run", action="store_true", help="Show files without writing them.")
        parser.add_argument("--overwrite", action="store_true", help="Replace blobs that already exist.")

    def handle(self, *args, **options):
        source = Path(options["source"] or settings.MEDIA_ROOT)
        if not source.is_dir():
            raise CommandError(f"Media directory does not exist: {source}")

        copied = skipped = 0
        for file_path in source.rglob("*"):
            if not file_path.is_file():
                continue

            name = file_path.relative_to(source).as_posix()
            if MediaBlob.objects.filter(name=name).exists() and not options["overwrite"]:
                skipped += 1
                continue

            if options["dry_run"]:
                self.stdout.write(f"Would copy: {name}")
                copied += 1
                continue

            MediaBlob.objects.update_or_create(
                name=name,
                defaults={
                    "content": file_path.read_bytes(),
                    "content_type": mimetypes.guess_type(file_path.name)[0] or "application/octet-stream",
                },
            )
            copied += 1

        label = "Would copy" if options["dry_run"] else "Copied"
        self.stdout.write(self.style.SUCCESS(f"{label}: {copied}; skipped: {skipped}"))
