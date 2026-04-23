import requests
import logging
import random
import math
import time
import hashlib
import json
import datetime
import calendar
from dataclasses import dataclass
from typing import Optional, List

import config
import cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Product:
    asin: str
    title: str
    brand: str
    price: float
    currency: str
    rating: float
    reviews: int
    image_url: str
    affiliate_url: str
    category: str
    category_label: str

KEYWORDS_MAP = {
    "HomeAndKitchen":        "casa cozinha utilidades",
    "BeautyAndPersonalCare": "maquiagem cuidados pele",
    "SportsAndOutdoors":     "esportes fitness academia",
    "Electronics":           "eletronicos celular acessorios",
}

class ShopeeAffiliateAPI:
    def __init__(self, app_id, app_secret):
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_url = "https://open-api.affiliate.shopee.com.br/graphql"

    def _generate_signature(self, payload: str, timestamp: int) -> str:
        signature_base = f"{self.app_id}{timestamp}{payload}{self.app_secret}"
        return hashlib.sha256(signature_base.encode('utf-8')).hexdigest()

    def search_products(self, keyword: str, limit: int = 10) -> List[Product]:
        timestamp = calendar.timegm(datetime.datetime.utcnow().utctimetuple())

        # Query corrigida para productOfferV2
        query = """
        query getProductList($keyword: String, $limit: Int, $page: Int) {
            productOfferV2(keyword: $keyword, limit: $limit, page: $page) {
                nodes {
                    itemId
                    productName
                    priceMin
                    priceMax
                    imageUrl
                    commissionRate
                    commission
                    shopName
                    offerLink
                    ratingStar
                    
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        variables = {
            "keyword": keyword,
            "limit": limit,
            "page": 1
        }
        payload = json.dumps({"query": query, "variables": variables})
        signature = self._generate_signature(payload, timestamp)

        headers = {
            "Authorization": f"SHA256 Credential={self.app_id}, Signature={signature}, Timestamp={timestamp}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(self.base_url, headers=headers, data=payload)
            response.raise_for_status()
            data = response.json()

            if 'errors' in data:
                logger.error(f"Erro na API da Shopee: {data['errors']}")
                return []

            nodes = data.get('data', {}).get('productOfferV2', {}).get('nodes', [])
            products = []

            for node in nodes:
                # Usa priceMin como preço base
                price = float(node.get('priceMin') or node.get('priceMax') or 0)
                rating = float(node.get('ratingStar') or 4.5)
                reviews = int(node.get('') or 0)

                p = Product(
                    asin=str(node['itemId']),
                    title=node['productName'],
                    brand=node.get('shopName', 'Shopee'),
                    price=price,
                    currency="BRL",
                    rating=rating,
                    reviews=reviews,
                    image_url=node['imageUrl'],
                    affiliate_url=node['offerLink'],
                    category="",
                    category_label=""
                )
                products.append(p)

            return products

        except Exception as e:
            logger.error(f"Erro ao buscar produtos na Shopee: {e}")
            return []


def search_best_product(category: str) -> Optional[Product]:
    keywords = KEYWORDS_MAP.get(category, "ofertas")
    api = ShopeeAffiliateAPI(app_id=config.SHOPEE_APP_ID, app_secret=config.SHOPEE_TOKEN)

    logger.info(f"🔎 Buscando em [{category}] na Shopee — '{keywords}'")

    products = api.search_products(keywords)

    candidates = []
    for p in products:
        if p.price <= 0 or p.price > config.MAX_PRICE:
            continue
        if cache.is_published(p.asin):
            logger.info(f"⏭️  Pulando {p.asin} — já publicado")
            continue
        p.category = category
        p.category_label = config.CATEGORY_LABELS.get(category, category)
        candidates.append(p)

    if not candidates:
        return None

    # Ordena por rating × log(vendas)
    candidates.sort(
        key=lambda x: x.rating * math.log(max(x.reviews, 1)),
        reverse=True
    )

    best = candidates[0]
    logger.info(f"✅ [{best.asin}] {best.title[:60]}... R${best.price:.2f}")
    return best


def get_product_for_run() -> Optional[Product]:
    categories = config.ACTIVE_CATEGORIES.copy()
    random.shuffle(categories)

    for category in categories:
        product = search_best_product(category)
        if product:
            return product
        time.sleep(1)

    logger.info('Nenhum produto encontrado na Shopee após percorrer categorias.')
    return None