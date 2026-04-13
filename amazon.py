"""
amazon.py
Busca produtos na Amazon Creators API (BR) usando o SDK oficial.
"""

import random
import math
import time
from dataclasses import dataclass
from typing import Optional

import creatorsapi_python_sdk
from creatorsapi_python_sdk import DefaultApi, Configuration, SearchItemsRequestContent
from creatorsapi_python_sdk.auth import OAuth2Config, OAuth2TokenManager

import cache
import config


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
    "HomeAndKitchen":        "mais vendidos casa cozinha",
    "BeautyAndPersonalCare": "mais vendidos beleza cuidados",
    "SportsAndOutdoors":     "mais vendidos esportes fitness",
    "Electronics":           "mais vendidos eletronicos",
}


def _build_api() -> DefaultApi:
    oauth_config = OAuth2Config(
        credential_id=config.AMAZON_CREATORS_CREDENTIAL_ID,
        credential_secret=config.AMAZON_CREATORS_CREDENTIAL_SECRET,
        version="2.3",
        auth_endpoint=None,
    )
    token_manager = OAuth2TokenManager(oauth_config)
    access_token = token_manager.get_token()

    configuration = Configuration(
        host="https://affiliate-program.amazon.com.br"
    )
    api_client = creatorsapi_python_sdk.ApiClient(
        configuration=configuration,
        header_name="Authorization",
        header_value=f"Bearer {access_token}",
    )
    return DefaultApi(api_client)


def _parse_item(item, category: str) -> Optional[Product]:
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
        if item.item_info and item.item_info.by_line_info and item.item_info.by_line_info.brand:
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
        if item.images and item.images.primary and item.images.primary.large:
            image_url = item.images.primary.large.url or ""
        if not image_url:
            return None

        rating = 0.0
        reviews = 0
        if item.customer_reviews:
            if item.customer_reviews.star_rating:
                rating = float(item.customer_reviews.star_rating.value or 0)
            if item.customer_reviews.count:
                reviews = int(item.customer_reviews.count.value or 0)

        affiliate_url = f"https://www.amazon.com.br/dp/{asin}?tag={config.AMAZON_ASSOCIATE_TAG}"

        return Product(
            asin=asin, title=title, brand=brand,
            price=price, currency=currency,
            rating=rating, reviews=reviews,
            image_url=image_url, affiliate_url=affiliate_url,
            category=category,
            category_label=config.CATEGORY_LABELS.get(category, category),
        )
    except Exception as e:
        print(f"⚠️  Erro ao parsear item: {e}")
        return None


def search_best_product(category: str) -> Optional[Product]:
    keywords = KEYWORDS_MAP.get(category, "mais vendidos")
    print(f"🔍 Buscando em [{category}] — '{keywords}'")

    try:
        api = _build_api()

        request = SearchItemsRequestContent(
            partner_tag=config.AMAZON_ASSOCIATE_TAG,
            partner_type="Associates",
            keywords=keywords,
            search_index=category,
            item_count=10,
            sort_by="AvgCustomerReviews",
            resources=[
                "ItemInfo.Title",
                "ItemInfo.ByLineInfo",
                "OffersV2.Listings.Price",
                "Images.Primary.Large",
                "CustomerReviews.StarRating",
                "CustomerReviews.Count",
            ],
        )

        response = api.search_items(request)

        if not response or not response.search_result or not response.search_result.items:
            print(f"⚠️  Nenhum resultado para {category}")
            return None

        candidates = []
        for item in response.search_result.items:
            product = _parse_item(item, category)
            if not product:
                continue
            if product.rating < config.MIN_RATING:
                continue
            if product.reviews < config.MIN_REVIEWS:
                continue
            if cache.is_published(product.asin):
                print(f"⏭️  Pulando {product.asin} — já publicado")
                continue
            candidates.append(product)

        if not candidates:
            print(f"ℹ️  Nenhum candidato válido em {category}")
            return None

        candidates.sort(
            key=lambda p: p.rating * math.log(max(p.reviews, 1)),
            reverse=True
        )

        best = candidates[0]
        print(f"✅ [{best.asin}] {best.title[:60]}... ⭐{best.rating} R${best.price:.2f}")
        return best

    except Exception as e:
        print(f"❌ Erro em [{category}]: {e}")
        return None


def get_product_for_run() -> Optional[Product]:
    categories = config.ACTIVE_CATEGORIES.copy()
    random.shuffle(categories)

    for category in categories:
        product = search_best_product(category)
        if product:
            return product
        time.sleep(1)

    print("❌ Nenhum produto encontrado.")
    return None
