"""
amazon.py
Busca produtos na Amazon PA API (BR), filtra por rating e reviews,
e retorna o melhor candidato ainda não publicado.
"""

import random
import time
from dataclasses import dataclass
from typing import Optional

from paapi5_python_sdk.api.default_api import DefaultApi
from paapi5_python_sdk.models.partner_type import PartnerType
from paapi5_python_sdk.models.search_items_request import SearchItemsRequest
from paapi5_python_sdk.models.search_items_resource import SearchItemsResource
from paapi5_python_sdk.rest import ApiException

import cache
import config

# Recursos que precisamos de cada produto
SEARCH_RESOURCES = [
    SearchItemsResource.ITEMINFO_TITLE,
    SearchItemsResource.ITEMINFO_BYLINEINFO,
    SearchItemsResource.OFFERS_LISTINGS_PRICE,
    SearchItemsResource.IMAGES_PRIMARY_LARGE,
    SearchItemsResource.CUSTOMERREVIEWS_STARRATING,
    SearchItemsResource.CUSTOMERREVIEWS_COUNT,
    SearchItemsResource.ITEMINFO_PRODUCTINFO,
]


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


def _build_client() -> DefaultApi:
    return DefaultApi(
        access_key=config.AMAZON_ACCESS_KEY,
        secret_key=config.AMAZON_SECRET_KEY,
        host="webservices.amazon.com.br",
        region="us-east-1",
    )


def _parse_product(item, category: str) -> Optional[Product]:
    """Extrai e valida os campos necessários de um item da API."""
    try:
        asin = item.asin

        # Título
        title = item.item_info.title.display_value if item.item_info and item.item_info.title else None
        if not title:
            return None

        # Marca
        brand = ""
        if item.item_info and item.item_info.by_line_info and item.item_info.by_line_info.brand:
            brand = item.item_info.by_line_info.brand.display_value or ""

        # Preço
        price = 0.0
        currency = "BRL"
        if item.offers and item.offers.listings:
            listing = item.offers.listings[0]
            if listing.price:
                price = listing.price.amount or 0.0
                currency = listing.price.currency or "BRL"

        if price <= 0 or price > config.MAX_PRICE:
            return None

        # Imagem
        image_url = ""
        if item.images and item.images.primary and item.images.primary.large:
            image_url = item.images.primary.large.url or ""

        if not image_url:
            return None

        # Rating e reviews
        rating = 0.0
        reviews = 0
        if item.customer_reviews:
            rating = float(item.customer_reviews.star_rating.display_value or 0)
            reviews = int(item.customer_reviews.count.display_value or 0)

        # Link de afiliado — a PA API já inclui o Associate Tag na URL de detalhe
        affiliate_url = f"https://www.amazon.com.br/dp/{asin}?tag={config.AMAZON_ASSOCIATE_TAG}"

        return Product(
            asin=asin,
            title=title,
            brand=brand,
            price=price,
            currency=currency,
            rating=rating,
            reviews=reviews,
            image_url=image_url,
            affiliate_url=affiliate_url,
            category=category,
            category_label=config.CATEGORY_LABELS.get(category, category),
        )
    except Exception as e:
        print(f"⚠️  Erro ao parsear item {getattr(item, 'asin', '?')}: {e}")
        return None


def search_best_product(category: str) -> Optional[Product]:
    """
    Busca produtos em uma categoria, filtra por qualidade
    e retorna o melhor ainda não publicado.
    """
    client = _build_client()

    # Keywords de busca por categoria para melhorar resultados
    keywords_map = {
        "HomeAndKitchen":        "mais vendidos casa cozinha",
        "BeautyAndPersonalCare": "mais vendidos beleza cuidados",
        "SportsAndOutdoors":     "mais vendidos esportes fitness",
        "Electronics":           "mais vendidos eletrônicos",
    }
    keywords = keywords_map.get(category, "mais vendidos")

    try:
        request = SearchItemsRequest(
            partner_tag=config.AMAZON_ASSOCIATE_TAG,
            partner_type=PartnerType.ASSOCIATES,
            keywords=keywords,
            search_index=category,
            item_count=10,
            sort_by="AvgCustomerReviews",
            resources=SEARCH_RESOURCES,
        )

        print(f"🔍 Buscando em [{category}] — keywords: '{keywords}'")
        response = client.search_items(request)

        if not response.search_result or not response.search_result.items:
            print(f"⚠️  Nenhum resultado para categoria {category}")
            return None

        candidates = []
        for item in response.search_result.items:
            product = _parse_product(item, category)
            if not product:
                continue
            if product.rating < config.MIN_RATING:
                continue
            if product.reviews < config.MIN_REVIEWS:
                continue
            if cache.is_published(product.asin):
                print(f"⏭️  Pulando {product.asin} — já publicado recentemente")
                continue
            candidates.append(product)

        if not candidates:
            print(f"ℹ️  Nenhum candidato válido em {category}")
            return None

        # Ordena por (rating × log(reviews)) — favorece produtos com boa nota E volume
        import math
        candidates.sort(
            key=lambda p: p.rating * math.log(max(p.reviews, 1)),
            reverse=True
        )

        best = candidates[0]
        print(f"✅ Produto selecionado: [{best.asin}] {best.title[:60]}... "
              f"⭐{best.rating} ({best.reviews} reviews) R${best.price:.2f}")
        return best

    except ApiException as e:
        print(f"❌ Erro PA API [{category}]: {e}")
        return None
    except Exception as e:
        print(f"❌ Erro inesperado [{category}]: {e}")
        return None


def get_product_for_run() -> Optional[Product]:
    """
    Itera pelas categorias ativas em ordem aleatória
    e retorna o primeiro produto válido encontrado.
    """
    categories = config.ACTIVE_CATEGORIES.copy()
    random.shuffle(categories)  # Varia as categorias entre as execuções

    for category in categories:
        product = search_best_product(category)
        if product:
            return product
        time.sleep(1)  # Respeita rate limit da API

    print("❌ Nenhum produto encontrado em nenhuma categoria.")
    return None
