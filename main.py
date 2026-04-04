"""
main.py
Ponto de entrada do Amazon Affiliate Bot.
Orquestra o fluxo completo e gerencia o agendamento via APScheduler.

Fluxo por execução:
  1. Busca produto na Amazon PA API
  2. Envia URL de afiliado para o bot do Telegram
  3. Gera imagem lifestyle com CTAs (Gemini/Imagen 3)
  4. Publica imagem + legenda no Instagram e Facebook via Buffer
  5. Marca produto no cache
"""

import logging
import sys
import time

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

import config
import cache
import amazon
import telegram_sender
import image_generator
import buffer_publisher

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────
#  FLUXO PRINCIPAL
# ─────────────────────────────────────────────────────────

def run_pipeline():
    """Executa o pipeline completo para um produto."""
    logger.info("=" * 60)
    logger.info("🚀 Iniciando pipeline...")
    logger.info("=" * 60)

    # 1. Limpa cache expirado (manutenção automática)
    cache.clean_expired()

    # 2. Busca produto
    product = amazon.get_product_for_run()
    if not product:
        logger.warning("⛔ Pipeline encerrado: nenhum produto disponível.")
        return

    logger.info(f"📦 Produto: {product.title}")
    logger.info(f"   ASIN: {product.asin} | R${product.price:.2f} | ⭐{product.rating} ({product.reviews} reviews)")
    logger.info(f"   Categoria: {product.category_label}")
    logger.info(f"   Link: {product.affiliate_url}")

    success_count = 0

    # 3. Envia para o Telegram (publica no blog)
    logger.info("📨 Enviando para Telegram...")
    tg_ok = telegram_sender.send_affiliate_link(
        affiliate_url=product.affiliate_url,
        product_title=product.title,
    )
    if tg_ok:
        success_count += 1
        logger.info("✅ Telegram: OK")
    else:
        logger.error("❌ Telegram: FALHOU")

    # 4. Gera imagem lifestyle
    logger.info("🎨 Gerando imagem lifestyle...")
    image_path = image_generator.generate_product_image(
        product_title=product.title,
        category=product.category,
        category_label=product.category_label,
        price=product.price,
        rating=product.rating,
        reviews=product.reviews,
        product_image_url=product.image_url,
        asin=product.asin,
    )

    if not image_path:
        logger.error("❌ Imagem: FALHOU — post social não será feito.")
    else:
        logger.info(f"✅ Imagem gerada: {image_path}")

        # 5. Monta caption
        caption = image_generator.build_caption(
            product_title=product.title,
            category_label=product.category_label,
            price=product.price,
            rating=product.rating,
            reviews=product.reviews,
            affiliate_url=product.affiliate_url,
        )

        # 6. Publica no Buffer (Instagram + Facebook)
        logger.info("📲 Publicando via Buffer...")
        buffer_ok = buffer_publisher.publish_to_social(
            image_path=image_path,
            caption=caption,
        )
        if buffer_ok:
            success_count += 1
            logger.info("✅ Buffer: OK")
        else:
            logger.error("❌ Buffer: FALHOU")

        # 7. Remove imagem temporária
        image_generator.cleanup_image(image_path)

    # 8. Marca no cache apenas se pelo menos uma publicação funcionou
    if success_count > 0:
        cache.mark_published(product.asin)
        logger.info(f"📝 Cache atualizado para ASIN {product.asin}")

    stats = cache.get_stats()
    logger.info(f"📊 Total de produtos publicados no cache: {stats['total_published']}")
    logger.info("=" * 60)
    logger.info(f"✅ Pipeline concluído. Sucessos: {success_count}/2")
    logger.info("=" * 60)


# ─────────────────────────────────────────────────────────
#  SCHEDULER
# ─────────────────────────────────────────────────────────

def start_scheduler():
    """Configura e inicia o agendador com os horários do .env."""
    scheduler = BlockingScheduler(timezone="America/Sao_Paulo")

    if not config.SCHEDULE_TIMES:
        logger.error("❌ Nenhum horário configurado em SCHEDULE_TIMES.")
        sys.exit(1)

    for time_str in config.SCHEDULE_TIMES:
        try:
            hour, minute = time_str.strip().split(":")
            scheduler.add_job(
                run_pipeline,
                trigger=CronTrigger(hour=int(hour), minute=int(minute)),
                id=f"pipeline_{time_str.replace(':', '')}",
                name=f"Pipeline {time_str}",
                misfire_grace_time=300,  # 5 min de tolerância
            )
            logger.info(f"⏰ Agendado: {time_str} (Horário de Brasília)")
        except ValueError:
            logger.warning(f"⚠️  Horário inválido ignorado: '{time_str}'")

    logger.info(f"🤖 Bot iniciado com {len(scheduler.get_jobs())} horários agendados.")
    logger.info("   Pressione Ctrl+C para encerrar.")

    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("👋 Bot encerrado pelo usuário.")
        scheduler.shutdown()


# ─────────────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════╗
║        🚀 AfiliFlow — melhoresofertasdaray        ║
╚══════════════════════════════════════════════╝
    """)

    # Valida configurações antes de iniciar
    try:
        config.validate()
    except EnvironmentError as e:
        logger.error(str(e))
        sys.exit(1)

    # Argumentos de linha de comando
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()

        if arg == "run":
            # Executa uma vez imediatamente (para teste)
            logger.info("▶️  Modo: execução única (teste)")
            run_pipeline()

        elif arg == "profiles":
            # Lista perfis do Buffer (para pegar os IDs)
            logger.info("📋 Listando perfis do Buffer...")
            buffer_publisher.get_profiles()

        elif arg == "cache":
            # Mostra stats do cache
            stats = cache.get_stats()
            print(f"\n📊 Cache: {stats['total_published']} produtos publicados")

        else:
            print(f"Argumento desconhecido: {arg}")
            print("Uso: python main.py [run|profiles|cache]")
    else:
        # Modo normal: inicia o agendador
        start_scheduler()
