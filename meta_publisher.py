import os
import requests
import time
import logging
import config

logger = logging.getLogger(__name__)

def publish_to_instagram(image_url: str, caption: str) -> bool:
    """
    Publica uma imagem no Instagram usando a Meta Graph API.
    Requer que a imagem esteja acessível publicamente (image_url).
    """
    access_token = config.META_PAGE_ACCESS_TOKEN
    ig_user_id = config.META_INSTAGRAM_ACCOUNT_ID
    
    if not access_token or not ig_user_id:
        logger.error("❌ Meta API: META_PAGE_ACCESS_TOKEN ou META_INSTAGRAM_ACCOUNT_ID não configurados.")
        return False

    graph_url = "https://graph.facebook.com/v19.0"
    
    # Passo 1: Criar o container de mídia
    logger.info("📸 Meta API: Criando container de mídia no Instagram...")
    container_url = f"{graph_url}/{ig_user_id}/media"
    payload = {
        "image_url": image_url,
        "caption": caption,
        "access_token": access_token
    }
    
    try:
        response = requests.post(container_url, data=payload, timeout=30)
        result = response.json()
        
        if "id" not in result:
            logger.error(f"❌ Meta API: Erro ao criar container: {result}")
            return False
            
        creation_id = result["id"]
        logger.info(f"✅ Meta API: Container criado com ID {creation_id}. Aguardando processamento...")
        
        # Aguardar um pouco para a Meta processar a imagem
        time.sleep(10)
        
        # Passo 2: Publicar o container
        logger.info("🚀 Meta API: Publicando o container...")
        publish_url = f"{graph_url}/{ig_user_id}/media_publish"
        publish_payload = {
            "creation_id": creation_id,
            "access_token": access_token
        }
        
        pub_response = requests.post(publish_url, data=publish_payload, timeout=30)
        pub_result = pub_response.json()
        
        if "id" in pub_result:
            logger.info(f"✅ Meta API: Post publicado com sucesso! ID: {pub_result['id']}")
            return True
        else:
            logger.error(f"❌ Meta API: Erro ao publicar container: {pub_result}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Meta API: Exceção durante a publicação: {e}")
        return False
