"""
main.py
Ponto de entrada do Shopee Affiliate Bot.
Orquestra o fluxo completo e gerencia o agendamento via APScheduler.

Fluxo por execução:
  1. Busca produto na Shopee Affiliate API
  2. Envia URL de afiliado para o bot do Telegram
  3. Gera imagem lifestyle com CTAs (Gemini/Imagen 3)
  4. Publica imagem + legenda no Instagram e Facebook via Buffer
  5. Marca produto no cache
"""

import logging
import sys
import time
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

import config
import cache
import shopee
import telegram_sender
import image_generator
import meta_publisher
import python_db_integration
import utm_pixel_tracking

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
    product = shopee.get_product_for_run()
    if not product:
        logger.warning("⛔ Pipeline encerrado: nenhum produto disponível.")
        return

    # 2.1 Adiciona rastreamento (UTMs)
    # Criamos o tracker com as configurações do ambiente
    tracker = utm_pixel_tracking.initialize_tracking_manager({
        'utm_source': 'afiliflow',
        'utm_medium': 'social',
        'facebook_pixel_id': os.getenv('META_PIXEL_ID'),
        'gtm_id': os.getenv('GTM_ID')
    })
    
    # Geramos a URL com UTMs específicas para o fluxo geral
    # Note: No futuro, podemos gerar URLs diferentes para Telegram e Instagram se desejar
    tracking_data = tracker.create_tracking_url(
        affiliate_url=product.affiliate_url,
        campaign_name=f"shopee_br_{datetime.now().strftime('%Y%m')}",
        product_name=product.title,
        category=product.category_label,
        product_id=product.asin,
        price=product.price
    )
    
    product.affiliate_url = tracking_data['url']
    logger.info(f"🔗 URL com UTM e Rastreamento: {product.affiliate_url}")

    logger.info(f"📦 Produto: {product.title}")
    logger.info(f"   ID: {product.asin} | R${product.price:.2f} | ⭐{product.rating} ({product.reviews} reviews)")
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
        asin=product.asin, # Usando asin como identificador genérico
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

    # 6. Publica no Instagram via Meta API
    logger.info("📲 Publicando via Meta API (Instagram)...")
    meta_ok = meta_publisher.publish_to_instagram(
        image_url=image_generator.get_public_image_url(image_path), # Assumindo que a imagem precisa de URL pública
        caption=caption,
    )
    if meta_ok:
        success_count += 1
        logger.info("✅ Meta API (Instagram): OK")
    else:
        logger.error("❌ Meta API (Instagram): FALHOU")

        # 7. Remove imagem temporária
        image_generator.cleanup_image(image_path)

    # 8. Marca no cache apenas se pelo menos uma publicação funcionou
    if success_count > 0:
        # Tenta salvar no banco de dados primeiro
        db_saved = python_db_integration.add_cache_item(
            product_id=product.asin,
            product_name=product.title,
            image_url=product.image_url,
            affiliate_url=product.affiliate_url,
            category=product.category
        )
        
        # Fallback para cache local se banco de dados não estiver disponível
        if not db_saved:
            cache.mark_published(product.asin)
            logger.info(f"📝 Cache local atualizado para ID {product.asin}")
        else:
            logger.info(f"📝 Cache do banco de dados atualizado para ID {product.asin}")
    
    # Registra a execução no banco de dados
    execution_log = {
        'executionId': f"{product.asin}_{datetime.now().timestamp()}",
        'status': 'success' if success_count == 2 else ('partial' if success_count > 0 else 'error'),
        'productFound': product.asin,
        'productName': product.title,
        'channelsPublished': ['telegram'] if success_count > 0 else [],
        'executionTime': 0
    }
    if success_count > 0:
        execution_log['channelsPublished'].append('instagram')
    
    python_db_integration.create_execution_log(execution_log)
    
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
