from .config import settings


def redis_is_ready() -> bool:
    try:
        from redis import Redis

        client = Redis.from_url(settings.redis_url, socket_connect_timeout=2)
        return bool(client.ping())
    except Exception:
        return False
