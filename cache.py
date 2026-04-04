"""
cache.py
Controla quais produtos já foram publicados para evitar repetição.
Usa um arquivo JSON simples — leve, sem dependência de banco de dados.
"""

import json
import os
from datetime import datetime, timedelta

CACHE_FILE = "published_cache.json"
CACHE_EXPIRY_DAYS = 30  # Produto pode ser reutilizado após 30 dias


def _load() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: dict):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def is_published(asin: str) -> bool:
    """Retorna True se o produto já foi publicado recentemente."""
    data = _load()
    if asin not in data:
        return False
    published_at = datetime.fromisoformat(data[asin])
    expiry = published_at + timedelta(days=CACHE_EXPIRY_DAYS)
    return datetime.now() < expiry


def mark_published(asin: str):
    """Registra o produto como publicado agora."""
    data = _load()
    data[asin] = datetime.now().isoformat()
    _save(data)
    print(f"📝 Cache: ASIN {asin} registrado como publicado.")


def clean_expired():
    """Remove entradas expiradas do cache."""
    data = _load()
    now = datetime.now()
    cleaned = {
        asin: date_str
        for asin, date_str in data.items()
        if now < datetime.fromisoformat(date_str) + timedelta(days=CACHE_EXPIRY_DAYS)
    }
    removed = len(data) - len(cleaned)
    _save(cleaned)
    if removed:
        print(f"🧹 Cache: {removed} entradas expiradas removidas.")


def get_stats() -> dict:
    data = _load()
    return {"total_published": len(data), "cache_file": CACHE_FILE}
