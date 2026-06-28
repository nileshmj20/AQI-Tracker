from __future__ import annotations

import time
from dataclasses import dataclass
from threading import RLock
from typing import Any, Callable, Hashable, Optional


@dataclass
class CacheItem:
    value: Any
    expires_at: float


class TTLCache:
    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self.default_ttl_seconds = default_ttl_seconds
        self._items: dict[Hashable, CacheItem] = {}
        self._lock = RLock()

    def get(self, key: Hashable) -> Any | None:
        now = time.monotonic()
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            if item.expires_at <= now:
                self._items.pop(key, None)
                return None
            return item.value

    def set(self, key: Hashable, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = self.default_ttl_seconds if ttl_seconds is None else ttl_seconds
        with self._lock:
            self._items[key] = CacheItem(value=value, expires_at=time.monotonic() + ttl)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()

    async def get_or_set(self, key: Hashable, factory: Callable[[], Any], ttl_seconds: Optional[int] = None) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = await factory()
        self.set(key, value, ttl_seconds=ttl_seconds)
        return value


cache = TTLCache()
