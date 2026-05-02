import requests
import config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_connection():
    access_token = config.META_PAGE_ACCESS_TOKEN
    ig_user_id = config.META_INSTAGRAM_ACCOUNT_ID
    
    if not access_token or not ig_user_id:
        logger.error("❌ Erro: META_PAGE_ACCESS_TOKEN ou META_INSTAGRAM_ACCOUNT_ID não configurados no .env")
        return

    logger.info(f"🔍 Testando conexão para IG User ID: {ig_user_id}")
    
    # Endpoint para verificar informações básicas da conta do IG
    url = f"https://graph.facebook.com/v19.0/{ig_user_id}"
    params = {
        "fields": "username,name,biography",
        "access_token": access_token
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "error" in data:
            logger.error(f"❌ Erro na API: {data['error'].get('message')}")
            if data['error'].get('error_subcode') == 2207001:
                logger.error("💡 Dica: Verifique se o ID fornecido é realmente o ID da conta Business do Instagram.")
        else:
            logger.info("✅ Conexão bem-sucedida!")
            logger.info(f"📱 Conta: @{data.get('username')} ({data.get('name')})")
            
    except Exception as e:
        logger.error(f"❌ Exceção ao conectar: {e}")

if __name__ == "__main__":
    test_connection()
