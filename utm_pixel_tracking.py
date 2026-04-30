"""
utm_pixel_tracking.py
Módulo para adicionar suporte a rastreamento de UTMs, Facebook Pixel e Google Tag Manager.
Será expandido conforme necessário para novos marketplaces.
"""

import logging
from typing import Optional, Dict, Any
from urllib.parse import urlencode, urlparse, parse_qs, urljoin
import hashlib

logger = logging.getLogger(__name__)


class TrackingManager:
    """Gerencia UTMs, Pixel e GTM para rastreamento de conversões."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.pixel_id = self.config.get('facebook_pixel_id')
        self.gtm_id = self.config.get('gtm_id')
        self.utm_source = self.config.get('utm_source', 'afiliflow')
        self.utm_medium = self.config.get('utm_medium', 'social')
    
    def add_utm_parameters(self, affiliate_url: str, campaign_name: str, 
                          product_name: str, category: str) -> str:
        """
        Adiciona parâmetros UTM a uma URL de afiliado.
        
        Parâmetros:
        - utm_source: fonte do tráfego (ex: 'instagram', 'telegram')
        - utm_medium: meio (ex: 'social', 'email')
        - utm_campaign: nome da campanha
        - utm_content: conteúdo específico (ex: nome do produto)
        - utm_term: categoria do produto
        """
        try:
            parsed = urlparse(affiliate_url)
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            
            # Converte de lista para string (parse_qs retorna listas)
            for key in query_params:
                query_params[key] = query_params[key][0] if query_params[key] else ''
            
            # Adiciona parâmetros UTM
            query_params['utm_source'] = self.utm_source
            query_params['utm_medium'] = self.utm_medium
            query_params['utm_campaign'] = campaign_name
            query_params['utm_content'] = product_name[:50]  # Limita o tamanho
            query_params['utm_term'] = category
            
            # Reconstrói a URL com os novos parâmetros
            new_query = urlencode(query_params)
            new_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{new_query}"
            
            logger.info(f"✅ UTM adicionado à URL: {new_url[:80]}...")
            return new_url
        except Exception as e:
            logger.error(f"❌ Erro ao adicionar UTM: {e}")
            return affiliate_url
    
    def get_pixel_tracking_code(self, event_name: str = 'ViewContent',
                               product_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Retorna o código de rastreamento do Facebook Pixel.
        
        Eventos suportados:
        - ViewContent: visualização de produto
        - AddToCart: adição ao carrinho
        - Purchase: compra realizada
        """
        if not self.pixel_id:
            logger.warning("⚠️  Facebook Pixel ID não configurado.")
            return ""
        
        try:
            product_data = product_data or {}
            
            # Cria o evento do Pixel
            pixel_code = f"""
<!-- Facebook Pixel Code -->
<img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id={self.pixel_id}&ev={event_name}&noscript=1"
/>
<!-- End Facebook Pixel Code -->
"""
            
            # Se houver dados do produto, cria um evento customizado
            if product_data:
                pixel_code += f"""
<script>
  fbq('track', '{event_name}', {{
    content_name: '{product_data.get('name', '')}',
    content_type: 'product',
    content_ids: ['{product_data.get('id', '')}'],
    value: {product_data.get('price', 0)},
    currency: 'BRL'
  }});
</script>
"""
            
            logger.info(f"✅ Código de Pixel gerado para evento: {event_name}")
            return pixel_code
        except Exception as e:
            logger.error(f"❌ Erro ao gerar código de Pixel: {e}")
            return ""
    
    def get_gtm_tracking_code(self, event_name: str = 'view_product',
                             product_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Retorna o código de rastreamento do Google Tag Manager.
        
        Eventos suportados:
        - view_product: visualização de produto
        - add_to_cart: adição ao carrinho
        - purchase: compra realizada
        """
        if not self.gtm_id:
            logger.warning("⚠️  GTM ID não configurado.")
            return ""
        
        try:
            product_data = product_data or {}
            
            # Cria o evento do GTM
            gtm_code = f"""
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={self.gtm_id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
"""
            
            # Se houver dados do produto, cria um evento de dataLayer
            if product_data:
                gtm_code += f"""
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({{
    'event': '{event_name}',
    'ecommerce': {{
      'items': [{{
        'item_id': '{product_data.get('id', '')}',
        'item_name': '{product_data.get('name', '')}',
        'price': {product_data.get('price', 0)},
        'item_category': '{product_data.get('category', '')}'
      }}]
    }}
  }});
</script>
"""
            
            logger.info(f"✅ Código de GTM gerado para evento: {event_name}")
            return gtm_code
        except Exception as e:
            logger.error(f"❌ Erro ao gerar código de GTM: {e}")
            return ""
    
    def create_tracking_url(self, affiliate_url: str, campaign_name: str,
                           product_name: str, category: str,
                           product_id: str, price: float) -> Dict[str, str]:
        """
        Cria uma URL de rastreamento completa com UTM, Pixel e GTM.
        Retorna um dicionário com:
        - url: URL com UTM
        - pixel_code: Código do Pixel
        - gtm_code: Código do GTM
        """
        try:
            tracking_url = self.add_utm_parameters(
                affiliate_url, campaign_name, product_name, category
            )
            
            product_data = {
                'id': product_id,
                'name': product_name,
                'category': category,
                'price': price
            }
            
            pixel_code = self.get_pixel_tracking_code('ViewContent', product_data)
            gtm_code = self.get_gtm_tracking_code('view_product', product_data)
            
            logger.info(f"✅ URL de rastreamento completa criada para {product_name}")
            
            return {
                'url': tracking_url,
                'pixel_code': pixel_code,
                'gtm_code': gtm_code
            }
        except Exception as e:
            logger.error(f"❌ Erro ao criar URL de rastreamento: {e}")
            return {
                'url': affiliate_url,
                'pixel_code': '',
                'gtm_code': ''
            }


def initialize_tracking_manager(config: Optional[Dict[str, Any]] = None) -> TrackingManager:
    """Inicializa o gerenciador de rastreamento com configurações."""
    return TrackingManager(config)
