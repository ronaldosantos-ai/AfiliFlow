"""
image_generator.py
Gera imagem lifestyle do produto com CTAs e gatilhos de conversão
usando a API do Gemini (google-genai) com Imagen 3.
"""

import os
import requests
import logging
from io import BytesIO
from PIL import Image

from google import genai
from google.genai import types
import config
logger = logging.getLogger(__name__)

# Configura o cliente Gemini
client = genai.Client(api_key=config.GEMINI_API_KEY)

CATEGORY_TRIGGERS = {
    "HomeAndKitchen": [
        "Transforme sua casa agora",
        "Frete grátis",
        "Mais de {reviews} compradores satisfeitos",
        "Qualidade garantida ⭐{rating}",
    ],
    "BeautyAndPersonalCare": [
        "Resultado comprovado",
        "Mais de {reviews} avaliações positivas",
        "Cuidado que você merece ✨",
        "⭐{rating} — Top vendas",
    ],
    "SportsAndOutdoors": [
        "Supere seus limites 💪",
        "Avaliado por {reviews}+ atletas",
        "Performance de elite",
        "⭐{rating} — Melhor custo-benefício",
    ],
    "Electronics": [
        "Tecnologia de ponta 🔥",
        "Frete grátis",
        "{reviews}+ clientes satisfeitos",
        "⭐{rating} — Escolha dos especialistas",
    ],
}

DEFAULT_TRIGGERS = [
    "Oferta imperdível 🔥",
    "Frete grátis",
    "Mais de {reviews} avaliações",
    "⭐{rating} estrelas",
]


def _get_triggers(category: str, rating: float, reviews: int) -> list[str]:
    triggers = CATEGORY_TRIGGERS.get(category, DEFAULT_TRIGGERS)
    result = []
    for t in triggers[:3]:
        t = t.replace("{rating}", str(rating))
        t = t.replace("{reviews}", f"{reviews:,}".replace(",", "."))
        result.append(t)
    return result


def _build_image_prompt(product_title: str, category_label: str,
                        price: float, triggers: list[str]) -> str:
    triggers_text = " | ".join(triggers)
    return (
        f"Create a professional lifestyle product advertisement image for Instagram. "
        f"The product is: {product_title}. Category: {category_label}. "
        f"Style: bright, clean, modern lifestyle photography with soft shadows. "
        f"Background: minimal, light gradient or clean white/beige surface. "
        f"The product should be the hero of the image, beautifully lit. "
        f"Add a subtle overlay text panel at the bottom with these CTAs in Portuguese: "
        f"'{triggers_text}'. "
        f"Also display the price 'R$ {price:.2f}' prominently. "
        f"Use bold, readable typography. Color palette: warm and inviting. "
        f"Square format (1:1), high quality, photorealistic. "
        f"Do NOT add any store logo or watermarks."
    )


def _download_product_image(image_url: str) -> bytes | None:
    try:
        response = requests.get(image_url, timeout=15)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"⚠️  Não foi possível baixar imagem do produto: {e}")
        return None


def generate_product_image(
    product_title: str,
    category: str,
    category_label: str,
    price: float,
    rating: float,
    reviews: int,
    product_image_url: str,
    asin: str,
) -> str | None:
    triggers = _get_triggers(category, rating, reviews)
    prompt = _build_image_prompt(product_title, category_label, price, triggers)

    print(f"🎨 Gerando imagem para: {product_title[:50]}...")
    print(f"   Gatilhos: {triggers}")

    result = _generate_with_imagen3(prompt, asin)
    if result:
        return result

    print("⚡ Tentando fallback com Gemini Flash Image...")
    return _generate_with_gemini_flash(prompt, asin, product_image_url)


def _generate_with_imagen3(prompt: str, asin: str) -> str | None:
    try:
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                safety_filter_level="BLOCK_LOW_AND_ABOVE",
                person_generation="DONT_ALLOW",
            ),
        )

        if response.generated_images:
            image_bytes = response.generated_images[0].image.image_bytes
            output_path = f"generated_{asin}.jpg"
            img = Image.open(BytesIO(image_bytes))
            img = img.convert("RGB")
            img.save(output_path, "JPEG", quality=92)
            print(f"✅ Imagem gerada (Imagen 3): {output_path}")
            return output_path

        print("❌ Imagen 3: Nenhuma imagem retornada.")
        return None

    except Exception as e:
        print(f"❌ Erro ao gerar imagem com Imagen 3: {e}")
        return None


def _generate_with_gemini_flash(prompt: str, asin: str,
                                product_image_url: str) -> str | None:
    try:
        product_img_bytes = _download_product_image(product_image_url)

        contents = []
        if product_img_bytes:
            contents.append(
                types.Part.from_bytes(
                    data=product_img_bytes,
                    mime_type="image/jpeg",
                )
            )
            contents.append(f"Based on this product image, {prompt}")
        else:
            contents.append(prompt)

        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        output_path = f"generated_{asin}.jpg"
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image"):
                img_bytes = part.inline_data.data
                with open(output_path, "wb") as f:
                    f.write(img_bytes)
                print(f"✅ Imagem (fallback) gerada: {output_path}")
                return output_path

        print("❌ Fallback: sem imagem na resposta.")
        return None

    except Exception as e:
        print(f"❌ Fallback também falhou: {e}")
        return None


def build_caption(product_title: str, category_label: str,
                  price: float, rating: float,
                  reviews: int, affiliate_url: str) -> str:
    stars = "⭐" * min(round(rating), 5)
    price_str = f"R$ {price:.2f}"
    caption = (
        f"🔥 {product_title}\n\n"
        f"💰 {price_str}\n"
        f"{stars} {rating}/5 — {reviews:,} avaliações\n\n"
        f"✅ Frete grátis\n"
        f"✅ Entrega rápida\n\n"
        f"👉 Compre agora: {affiliate_url}\n\n"
        f"#{category_label.replace(' ', '')} "
        f"#MelhoresOfertas #Oferta #Compras #Shopee"
    )
    return caption.replace(",", ".")


def cleanup_image(image_path: str):
    try:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            print(f"🗑️  Imagem temporária removida: {image_path}")
    except Exception as e:
        print(f"⚠️  Não foi possível remover {image_path}: {e}")


def get_public_image_url(image_path: str) -> str | None:
    """
    Faz upload da imagem gerada para um serviço de armazenamento público e retorna a URL.
    """
    try:
        # Usar manus-upload-file para fazer o upload e obter a URL pública
        # O resultado do manus-upload-file é uma string JSON com as URLs
        import subprocess
        command = ["manus-upload-file", image_path]
        process = subprocess.run(command, capture_output=True, text=True, check=True)
        output = process.stdout.strip()
        
        # O output é uma string JSON, precisamos parseá-la
        import json
        urls = json.loads(output)
        
        if urls and isinstance(urls, list) and len(urls) > 0:
            logger.info(f"✅ Imagem {image_path} uploaded. URL pública: {urls[0]}")
            return urls[0]
        else:
            logger.error(f"❌ manus-upload-file não retornou URL pública para {image_path}: {output}")
            return None
    except Exception as e:
        logger.error(f"❌ Erro ao fazer upload da imagem {image_path}: {e}")
        return None
