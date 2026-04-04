"""
telegram_sender.py
Envia o link de afiliado Amazon para o bot do Telegram existente.
O bot já processa e publica no blog automaticamente.
"""

import requests
import config


def send_affiliate_link(affiliate_url: str, product_title: str = "") -> bool:
    """
    Envia apenas a URL de afiliado para o chat do bot.
    O bot existente cuida de identificar o produto e publicar no blog.
    """
    if not config.TELEGRAM_BOT_TOKEN or not config.TELEGRAM_CHAT_ID:
        print("❌ Telegram: TOKEN ou CHAT_ID não configurados.")
        return False

    # Envia somente a URL — exatamente como você faz manualmente
    message = affiliate_url

    url = f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": config.TELEGRAM_CHAT_ID,
        "text": message,
        "disable_web_page_preview": False,
    }

    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        print(f"✅ Telegram: URL enviada — {affiliate_url[:60]}...")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Telegram: Erro ao enviar mensagem: {e}")
        return False
