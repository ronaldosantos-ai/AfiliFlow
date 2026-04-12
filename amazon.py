"""
amazon.py
Busca produtos na Amazon Creators API (BR) com autenticação OAuth2.
"""

import random
import math
import time
import requests
from dataclasses import dataclass
from typing import Optional

import cache
import config

# Endpoints corretos da Creators API
TOKEN_URL        = "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token"
CREATORS_API_URL = "https://affiliate-program.amazon.com.br/creatorsapi/v3.1"

KEYWORDS_MAP = {
    "HomeAndKitchen":        "mais vendidos casa cozinha",
    "BeautyAndPersonalCare": "mais vendidos beleza cuidados",
    "SportsAndOutdoors":     "mais vendidos esportes fitness",
    "Electronics":           "mais vendidos eletronicos",
}

# Cache do token OAuth2 em memória
_token_cache = {"access_token": None, "expires_at": 0}


def _get_oauth_token() -> Optional[str]:
    """Obtém ou reutiliza o token OAuth2 da Creators API."""
    now = time.time()
    if _token_cache["access_token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    try:
        response = requests.post(
            TOKEN_URL,
            data={
                "grant_type":    "client_credentials",
                "client_id":     config.AMAZON_CREATORS_CREDENTIAL_ID,
                "client_secret": config.AMAZON_CREATORS_CREDENTIAL_SECRET,
                "scope":         "creatorsapi/default",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        _token_cache["access_token"] = data["access_token"]
        _token_cache["expires_at"]   = now + int(data.get("expires_in", 3600))
        print("✅ OAuth2: Token obtido com sucesso.")
        return _token_cache["access_token"]
    except Exception as e:
        print(f"❌ OAuth2: Erro ao obter token: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Detalhe: {e.response.text}")
        return None


def _search_items(keywords: str, search_index: str) -> list:
    token = _get_oauth_token()
    if not token:
        return []

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }

    payload = {
        "keywords":    keywords,
        "searchIndex": search_index,
        "partnerTag":  config.AMAZON_ASSOCIATE_TAG,
        "partnerType": "Associates",
        "itemCount":   10,
        "sortBy":      "AvgCustomerReviews",
        "resources": [
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "OffersV2.Listings.Price",
            "Images.Primary.Large",
            "CustomerReviews.StarRating",
            "CustomerReviews.Count",
        ],
    }

    try:
        response = requests.post(
            f"{CREATORS_API_URL}/searchItems",
            headers=headers,
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("searchResult", {}).get("items", [])
    except requests.exceptions.HTTPError as e:
        print(f"❌ Creators API erro: {e}")
        if e.response is not None:
            print(f"   Detalhe: {e.response.text}")
        return []
    except Exception as e:
        print(f"❌ Creators API erro inesperado: {e}")
        return []


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


def _parse_item(item: dict, category: str) -> Optional[Product]:
    try:
        asin = item.get("asin")
        if not asin:
            return None

        title = item.get("itemInfo", {}).get("title", {}).get("displayValue")
        if not title:
            return None

        brand = item.get("itemInfo", {}).get("byLineInfo", {}).get("brand", {}).get("displayValue", "")

        price    = 0.0
        currency = "BRL"
        listings = item.get("offersV2", {}).get("listings", [])
        if listings:
            price_data = listings[0].get("price", {})
            price    = float(price_data.get("amount", 0))
            currency = price_data.get("currency", "BRL")

        if price <= 0 or price > config.MAX_PRICE:
            return None

        image_url = item.get("images", {}).get("primary", {}).get("large", {}).get("url", "")
        if not image_url:
            return None

        reviews_data = item.get("customerReviews", {})
        rating  = float(reviews_data.get("starRating", {}).get("value", 0))
        reviews = int(reviews_data.get("count", {}).get("value", 0))

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

    items = _search_items(keywords, category)
    if not items:
        print(f"⚠️  Nenhum resultado para {category}")
        return None

    candidates = []
    for item in items:
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
