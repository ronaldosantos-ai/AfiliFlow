"""
buffer_publisher.py
Faz upload da imagem gerada e agenda o post no Buffer
para Instagram e Facebook.
"""

import os
import requests
import config


BUFFER_API_BASE = "https://api.bufferapp.com/1"


def _get_headers() -> dict:
    return {"Authorization": f"Bearer {config.BUFFER_ACCESS_TOKEN}"}


def _upload_media(image_path: str) -> str | None:
    """
    Faz upload da imagem para o Buffer e retorna o media ID.
    Buffer aceita upload via URL ou arquivo direto dependendo do plano.
    Aqui usamos upload via arquivo multipart.
    """
    url = f"{BUFFER_API_BASE}/media/upload.json"

    try:
        with open(image_path, "rb") as f:
            files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
            response = requests.post(
                url,
                headers=_get_headers(),
                files=files,
                timeout=30,
            )

        if response.status_code == 200:
            data = response.json()
            media_id = data.get("id") or data.get("media_id")
            print(f"✅ Buffer: Mídia enviada — ID: {media_id}")
            return media_id
        else:
            print(f"⚠️  Buffer upload retornou {response.status_code}: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Buffer: Erro no upload de mídia: {e}")
        return None


def _schedule_post(profile_id: str, text: str, media_id: str | None,
                    image_path: str | None) -> bool:
    """Agenda um post em um perfil específico do Buffer."""
    url = f"{BUFFER_API_BASE}/updates/create.json"

    payload = {
        "profile_ids[]": profile_id,
        "text": text,
        "shorten": False,
        "now": True,  # Publica imediatamente; mude para False + scheduled_at para agendar
    }

    # Adiciona mídia se disponível
    if media_id:
        payload["media[id]"] = media_id
    elif image_path:
        # Fallback: envia URL da imagem diretamente (se for acessível publicamente)
        payload["media[photo]"] = image_path

    try:
        response = requests.post(
            url,
            headers=_get_headers(),
            data=payload,
            timeout=30,
        )

        if response.status_code in (200, 201):
            data = response.json()
            if data.get("success"):
                print(f"✅ Buffer: Post agendado no perfil {profile_id}")
                return True
            else:
                print(f"⚠️  Buffer: Resposta inesperada: {data}")
                return False
        else:
            print(f"❌ Buffer: Erro {response.status_code}: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Buffer: Exceção ao agendar post: {e}")
        return False


def publish_to_social(image_path: str, caption: str) -> bool:
    """
    Publica a imagem com legenda no Instagram e Facebook via Buffer.
    Retorna True se pelo menos uma publicação foi bem-sucedida.
    """
    if not config.BUFFER_ACCESS_TOKEN:
        print("❌ Buffer: ACCESS_TOKEN não configurado.")
        return False

    # Faz upload da imagem uma vez
    media_id = _upload_media(image_path)

    results = []

    # Instagram
    if config.BUFFER_PROFILE_ID_INSTAGRAM:
        ok = _schedule_post(
            profile_id=config.BUFFER_PROFILE_ID_INSTAGRAM,
            text=caption,
            media_id=media_id,
            image_path=image_path,
        )
        results.append(ok)
        if ok:
            print("📸 Instagram: Post enviado para o Buffer.")
    else:
        print("ℹ️  Buffer: BUFFER_PROFILE_ID_INSTAGRAM não configurado — pulando Instagram.")

    # Facebook
    if config.BUFFER_PROFILE_ID_FACEBOOK:
        ok = _schedule_post(
            profile_id=config.BUFFER_PROFILE_ID_FACEBOOK,
            text=caption,
            media_id=media_id,
            image_path=image_path,
        )
        results.append(ok)
        if ok:
            print("📘 Facebook: Post enviado para o Buffer.")
    else:
        print("ℹ️  Buffer: BUFFER_PROFILE_ID_FACEBOOK não configurado — pulando Facebook.")

    return any(results)


def get_profiles() -> list[dict]:
    """Lista os perfis conectados ao Buffer (útil para pegar os IDs)."""
    url = f"{BUFFER_API_BASE}/profiles.json"
    try:
        response = requests.get(url, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        profiles = response.json()
        for p in profiles:
            print(f"  📱 [{p.get('service')}] ID: {p.get('id')} — @{p.get('service_username')}")
        return profiles
    except Exception as e:
        print(f"❌ Buffer: Erro ao listar perfis: {e}")
        return []
