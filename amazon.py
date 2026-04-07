"""
amazon.py
Busca produtos na Amazon Creators API (BR), filtra por rating e reviews,
e retorna o melhor candidato ainda não publicado.
"""

import math
import random
import time
from dataclasses import dataclass
from typing import Optional

import creators_lwa_patch

creators_lwa_patch.apply()

from creatorsapi_python_sdk.api.default_api import DefaultApi
from creatorsapi_python_sdk.api_client import ApiClient
from creatorsapi_python_sdk.exceptions import ApiException
from creatorsapi_python_sdk.models.item import Item
from creatorsapi_python_sdk.models.search_items_request_content import SearchItemsRequestContent
from creatorsapi_python_sdk.models.search_items_resource import SearchItemsResource
from creatorsapi_python_sdk.models.sort_by import SortBy

import cache
import config

SEARCH_RESOURCES = [
    SearchItemsResource.ITEM_INFO_DOT_TITLE,
    SearchItemsResource.ITEM_INFO_DOT_BY_LINE_INFO,
    SearchItemsResource.OFFERS_V2_DOT_LISTINGS_DOT_PRICE,
    SearchItemsResource.IMAGES_DOT_PRIMARY_DOT_LARGE,
    SearchItemsResource.CUSTOMER_REVIEWS_DOT_STAR_RATING,
    SearchItemsResource.CUSTOMER_REVIEWS_DOT_COUNT,
    SearchItemsResource.ITEM_INFO_DOT_PRODUCT_INFO,
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


def _build_api() -> DefaultApi:
    auth_ep = (config.AMAZON_CREATORS_AUTH_ENDPOINT or "").strip() or None
    client = ApiClient(
        credential_id=config.AMAZON_CREATORS_CREDENTIAL_ID,
        credential_secret=config.AMAZON_CREATORS_CREDENTIAL_SECRET,
        version=config.AMAZON_CREATORS_CREDENTIAL_VERSION,
        auth_endpoint=auth_ep,
    )
    return DefaultApi(api_client=client)


def _parse_product(item: Item, category: str) -> Optional[Product]:
    """Extrai e valida os campos necessários de um item da API."""
    try:
        asin = item.asin
        if not asin:
            return None

        title = None
        if item.item_info and item.item_info.title:
            title = item.item_info.title.display_value
        if not title:
            return None

        brand = ""
        if (
            item.item_info
            and item.item_info.by_line_info
            and item.item_info.by_line_info.brand
        ):
            brand = item.item_info.by_line_info.brand.display_value or ""

        price = 0.0
        currency = "BRL"
        if item.offers_v2 and item.offers_v2.listings:
            listing = item.offers_v2.listings[0]
            if listing.price and listing.price.money:
                price = float(listing.price.money.amount or 0)
                currency = listing.price.money.currency or "BRL"

        if price <= 0 or price > config.MAX_PRICE:
            return None

        image_url = ""
        if (
            item.images
            and item.images.primary
            and item.images.primary.large
            and item.images.primary.large.url
        ):
            image_url = item.images.primary.large.url

        if not image_url:
            return None

        rating = 0.0
        reviews = 0
        if item.customer_reviews:
            if item.customer_reviews.star_rating and item.customer_reviews.star_rating.value is not None:
                rating = float(item.customer_reviews.star_rating.value)
            if item.customer_reviews.count is not None:
                reviews = int(item.customer_reviews.count)

        affiliate_url = item.detail_page_url or (
            f"https://www.amazon.com.br/dp/{asin}?tag={config.AMAZON_ASSOCIATE_TAG}"
        )

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
    api = _build_api()

    keywords_map = {
        "HomeAndKitchen": "mais vendidos casa cozinha",
        "BeautyAndPersonalCare": "mais vendidos beleza cuidados",
        "SportsAndOutdoors": "mais vendidos esportes fitness",
        "Electronics": "mais vendidos eletrônicos",
    }
    keywords = keywords_map.get(category, "mais vendidos")

    try:
        body = SearchItemsRequestContent(
            partner_tag=config.AMAZON_ASSOCIATE_TAG,
            keywords=keywords,
            search_index=category,
            item_count=config.AMAZON_ITEM_COUNT,
            sort_by=SortBy.AVGCUSTOMERREVIEWS,
            resources=SEARCH_RESOURCES,
            max_price=int(config.MAX_PRICE),
        )

        print(f"🔍 Buscando em [{category}] — keywords: '{keywords}'")
        response = api.search_items(
            x_marketplace=config.AMAZON_MARKETPLACE,
            search_items_request_content=body,
        )

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

        candidates.sort(
            key=lambda p: p.rating * math.log(max(p.reviews, 1)),
            reverse=True,
        )

        best = candidates[0]
        print(
            f"✅ Produto selecionado: [{best.asin}] {best.title[:60]}... "
            f"⭐{best.rating} ({best.reviews} reviews) R${best.price:.2f}"
        )
        return best

    except ApiException as e:
        print(f"❌ Erro Creators API [{category}]: {e}")
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
    random.shuffle(categories)

    for category in categories:
        product = search_best_product(category)
        if product:
            return product
        time.sleep(1)

    print("❌ Nenhum produto encontrado em nenhuma categoria.")
    return None
