import os
import mysql.connector
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    db_url = "mysql://root:iTaeDTgRLhlrDcsQtGmkIAbSoHqlaIai@monorail.proxy.rlwy.net:31361/railway"
    parsed = urlparse(db_url)
    
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
        
        logger.info("🚀 Criando tabelas no banco de dados...")
        
        # Tabela de Posts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            productId VARCHAR(255) NOT NULL,
            productName TEXT NOT NULL,
            price DECIMAL(10, 2),
            imageUrl TEXT,
            affiliateUrl TEXT,
            category VARCHAR(100),
            status ENUM('published', 'failed') DEFAULT 'published',
            channelsPublished JSON,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Tabela de Logs de Execução
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS executionLogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            executionId VARCHAR(255) UNIQUE,
            status ENUM('success', 'error', 'partial'),
            productFound VARCHAR(255),
            productName TEXT,
            channelsPublished JSON,
            errorMessage TEXT,
            executionTime INT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Tabela de Configuração do Pipeline
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pipelineConfig (
            id INT AUTO_INCREMENT PRIMARY KEY,
            scheduleTimes JSON,
            keywords JSON,
            maxPrice DECIMAL(10, 2),
            minRating DECIMAL(3, 2),
            activeCategories JSON,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """)
        
        # Tabela de Cache de Itens
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cacheItems (
            id INT AUTO_INCREMENT PRIMARY KEY,
            productId VARCHAR(255) UNIQUE,
            productName TEXT,
            imageUrl TEXT,
            affiliateUrl TEXT,
            category VARCHAR(100),
            publishedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Tabela de Status de Integração
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS integrationStatus (
            id INT AUTO_INCREMENT PRIMARY KEY,
            integrationName VARCHAR(100) UNIQUE,
            status ENUM('healthy', 'warning', 'error'),
            responseTime FLOAT,
            errorMessage TEXT,
            lastCheckedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        logger.info("✅ Todas as tabelas foram criadas ou já existem.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar banco de dados: {e}")

if __name__ == "__main__":
    init_db()
