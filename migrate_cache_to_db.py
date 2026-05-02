import json
import os
import mysql.connector
from urllib.parse import urlparse
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    CACHE_FILE = "published_cache.json"
    DB_URL = "mysql://root:iTaeDTgRLhlrDcsQtGmkIAbSoHqlaIai@monorail.proxy.rlwy.net:31361/railway"
    
    if not os.path.exists(CACHE_FILE):
        logger.info("ℹ️  Nenhum cache local encontrado para migrar.")
        return

    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache_data = json.load(f)

    if not cache_data:
        logger.info("ℹ️  Cache local está vazio.")
        return

    parsed = urlparse(DB_URL)
    try:
        conn = mysql.connector.connect(
            host=parsed.hostname,
            port=parsed.port or 3306,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/'),
            autocommit=True
        )
        cursor = conn.cursor()
        
        logger.info(f"🚚 Migrando {len(cache_data)} itens para o banco de dados...")
        
        for product_id, published_at_str in cache_data.items():
            try:
                # Tenta inserir no cacheItems
                query = "INSERT IGNORE INTO cacheItems (productId, publishedAt) VALUES (%s, %s)"
                cursor.execute(query, (product_id, published_at_str))
            except Exception as e:
                logger.warning(f"⚠️  Erro ao migrar item {product_id}: {e}")
        
        logger.info("✅ Migração concluída com sucesso!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Erro durante a migração: {e}")

if __name__ == "__main__":
    migrate()
