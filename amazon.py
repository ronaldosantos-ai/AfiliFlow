"""
amazon.py
Busca produtos na Amazon PA API (BR), filtra por rating e reviews,
e retorna o melhor candidato ainda não publicado.
"""

import random
import math
import time
from dataclasses import dataclass
from typing import Optional

from amazon_paapi import AmazonApi

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


def _build_client() -> AmazonApi:
    return AmazonApi(
        key=config.AMAZON_ACCESS_KEY,
        secret=config.AMAZON_SECRET_KEY,
        tag=config.AMAZON_ASSOCIATE_TAG,
        country="BR",
    )


def _parse_product(item, category: str) -> Optional[Product]:
    try:
        asin = item.asin
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
        if item.offers and item.offers.listings:
            listing = item.offers.listings[0]
            if listing.price:
                price = float(listing.price.amount or 0)
                currency = listing.price.currency or "BRL"

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
    keywords_map = {
        "HomeAndKitchen":        "mais vendidos casa cozinha",
        "BeautyAndPersonalCare": "mais vendidos beleza cuidados",
        "SportsAndOutdoors":     "mais vendidos esportes fitness",
        "Electronics":           "mais vendidos eletronicos",
    }
    keywords = keywords_map.get(category, "mais vendidos")

    try:
        amazon = _build_client()
        print(f"🔍 Buscando em [{category}] — keywords: '{keywords}'")

        results = amazon.search_items(
            keywords=keywords,
            search_index=category,
            item_count=10,
            sort_by="AvgCustomerReviews",
            resources=[
                "ItemInfo.Title",
                "ItemInfo.ByLineInfo",
                "Offers.Listings.Price",
                "Images.Primary.Large",
                "CustomerReviews.StarRating",
                "CustomerReviews.Count",
            ],
        )

        if not results or not results.items:
            print(f"⚠️  Nenhum resultado para categoria {category}")
            return None

        candidates = []
        for item in results.items:
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
            reverse=True
        )

        best = candidates[0]
        print(f"✅ Produto: [{best.asin}] {best.title[:60]}... ⭐{best.rating} R${best.price:.2f}")
        return best

    except Exception as e:
        print(f"❌ Erro ao buscar em [{category}]: {e}")
        return None


def get_product_for_run() -> Optional[Product]:
    categories = config.ACTIVE_CATEGORIES.copy()
    random.shuffle(categories)

    for category in categories:
        product = search_best_product(category)
        if product:
            return product
        time.sleep(1)

    print("❌ Nenhum produto encontrado em nenhuma categoria.")
    return None
