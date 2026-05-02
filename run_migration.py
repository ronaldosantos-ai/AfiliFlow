import mysql.connector
import os

conn = mysql.connector.connect(
    host=os.getenv('MYSQLHOST'),
    port=int(os.getenv('MYSQLPORT', 3306)),
    user=os.getenv('MYSQLUSER'),
    password=os.getenv('MYSQLPASSWORD'),
    database=os.getenv('MYSQLDATABASE')
)

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS integrationSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  integrationName VARCHAR(64) NOT NULL UNIQUE,
  metaAppId VARCHAR(255),
  metaAppSecret VARCHAR(255),
  metaPageAccessToken VARCHAR(255),
  metaPageId VARCHAR(255),
  metaInstagramAccountId VARCHAR(255),
  telegramBotToken VARCHAR(255),
  telegramChatId VARCHAR(255),
  shopeeApiKey VARCHAR(255),
  shopeePartnerId VARCHAR(255),
  gtmId VARCHAR(255),
  isActive BOOLEAN DEFAULT true NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
)
""")

conn.commit()
print("✅ Tabela integrationSettings criada com sucesso!")
conn.close()