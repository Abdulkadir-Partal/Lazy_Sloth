from pathlib import PurePosixPath
from urllib.parse import quote

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage


class DatabaseMediaStorage(Storage):
    """Stores uploaded media bytes in the database instead of the local disk."""

    def _open(self, name, mode="rb"):
        from .models import MediaBlob

        blob = MediaBlob.objects.get(name=name)
        file = ContentFile(bytes(blob.content), name=name)
        return file

    def _save(self, name, content):
        from .models import MediaBlob

        content.seek(0)
        data = content.read()
        MediaBlob.objects.update_or_create(
            name=name,
            defaults={
                "content": data,
                "content_type": getattr(content, "content_type", "") or "application/octet-stream",
            },
        )
        return name

    def delete(self, name):
        from .models import MediaBlob

        MediaBlob.objects.filter(name=name).delete()

    def exists(self, name):
        from .models import MediaBlob

        return MediaBlob.objects.filter(name=name).exists()

    def size(self, name):
        from .models import MediaBlob

        return MediaBlob.objects.only("content").get(name=name).size

    def url(self, name):
        # An absolute URL also works when the frontend is deployed on another host.
        normalized = PurePosixPath(name).as_posix()
        media_path = f"{settings.MEDIA_URL}{quote(normalized)}"
        return f"{settings.BACKEND_URL.rstrip('/')}{media_path}"
