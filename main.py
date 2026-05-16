"""
main.py
Ponto de entrada do Shopee Affiliate Bot.
Orquestra o fluxo completo e gerencia o agendamento via APScheduler.

Fluxo por execução (NOVO - Fase 1):
  0. Verifica se pipeline está pausado
  1. Limpa cache expirado
  2. Busca produto na Shopee Affiliate API
  3. Adiciona UTM (rastreamento)
  4. Gera imagem lifestyle com Gemini
  5. Upload da imagem para URL pública
  6. Gera conteúdo (título, descrição, hashtags) com Gemini
  7. Salva em contentApprovals com status 'pending'
  8. Marca produto no cache

⚠️ O pipeline NÃO publica em nenhum canal. Todo conteúdo vai para Aprovações.
"""

import logging
import os
import sys
import time
import json
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

import config
import cache
import shopee
import image_generator
import python_db_integration
import utm_pixel_tracking
import init_db_tables

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
#  FLUXO PRINCIPAL (NOVO)
# ─────────────────────────────────────────────────────────

def run_pipeline():
    """Executa o pipeline completo para um produto."""
    logger.info("=" * 60)
    logger.info("🚀 Iniciando pipeline...")
    logger.info("=" * 60)

    # 0. Verifica se pipeline está pausado
    pipeline_paused = python_db_integration.is_pipeline_paused()
    if pipeline_paused:
        logger.info("⏸️  Pipeline pausado no dashboard. Encerrando execução.")
        return

    # 1. Limpa cache expirado (manutenção automática)
    cache.clean_expired()

    # 2. Busca produto
    product = shopee.get_product_for_run()
    if not product:
        logger.warning("⛔ Pipeline encerrado: nenhum produto disponível.")
        return

    # 2.1 Adiciona rastreamento (UTMs)
    tracker = utm_pixel_tracking.initialize_tracking_manager({
        'utm_source': 'afiliflow',
        'utm_medium': 'social',
        'facebook_pixel_id': os.getenv('META_PIXEL_ID'),
        'gtm_id': os.getenv('GTM_ID')
    })
    
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

    try:
        # 3. Gera imagem lifestyle
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
            logger.error("❌ Imagem: FALHOU — conteúdo não será gerado.")
            return

        logger.info(f"✅ Imagem gerada: {image_path}")

        # 4. Upload da imagem para URL pública
        logger.info("📤 Fazendo upload da imagem...")
        public_image_url = image_generator.get_public_image_url(image_path)
        if not public_image_url:
            logger.error("❌ Upload: FALHOU — conteúdo não será gerado.")
            return

        logger.info(f"✅ Imagem disponível em: {public_image_url}")

        # 5. Gera conteúdo com Gemini
        logger.info("✍️  Gerando conteúdo com Gemini...")
        content = image_generator.generate_content_with_gemini(
            product_title=product.title,
            category_label=product.category_label,
            price=product.price,
            rating=product.rating,
            reviews=product.reviews,
            product_description=product.description or "",
        )

        if not content:
            logger.error("❌ Conteúdo: FALHOU")
            return

        logger.info("✅ Conteúdo gerado com sucesso")

        # 6. Salva em contentApprovals
        logger.info("💾 Salvando em contentApprovals...")
        approval_id = python_db_integration.create_content_approval(
            product_id=product.asin,
            product_name=product.title,
            product_price=product.price,
            product_image=product.image_url,
            product_description=product.description or "",
            affiliate_url=product.affiliate_url,
            title=content.get('title', product.title),
            description=content.get('description', ''),
            hashtags=content.get('hashtags', ''),
            image_url=public_image_url,
            source='automatic'
        )

        if not approval_id:
            logger.error("❌ Erro ao salvar em contentApprovals")
            return

        logger.info(f"✅ Conteúdo salvo em contentApprovals (ID: {approval_id})")

        # 7. Marca no cache
        logger.info("📝 Marcando produto no cache...")
        cache.mark_published(product.asin)
        logger.info(f"✅ Cache atualizado para ID {product.asin}")

        # 8. Registra a execução
        execution_log = {
            'executionId': f"{product.asin}_{datetime.now().timestamp()}",
            'status': 'success',
            'productFound': product.asin,
            'productName': product.title,
            'contentApprovalId': approval_id,
            'executionTime': 0
        }
        python_db_integration.create_execution_log(execution_log)

        logger.info("=" * 60)
        logger.info("✅ Pipeline concluído com sucesso!")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"❌ Erro durante execução: {str(e)}")
        execution_log = {
            'executionId': f"{product.asin}_{datetime.now().timestamp()}",
            'status': 'error',
            'productFound': product.asin,
            'productName': product.title,
            'errorMessage': str(e),
            'executionTime': 0
        }
        python_db_integration.create_execution_log(execution_log)


# ─────────────────────────────────────────────────────────
#  SCHEDULER (NOVO - carrega horários do banco)
# ─────────────────────────────────────────────────────────

def start_scheduler():
    """Configura e inicia o agendador com os horários do banco de dados."""
    scheduler = BlockingScheduler(timezone="America/Sao_Paulo")

    # Carrega horários do banco de dados
    schedule_times = python_db_integration.get_schedule_times()
    
    if not schedule_times:
        logger.error("❌ Nenhum horário configurado no banco de dados.")
        sys.exit(1)

    for time_str in schedule_times:
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

    # Inicializa banco de dados (cria tabelas se não existirem)
    logger.info("🗄️  Inicializando banco de dados...")
    init_db_tables.init_db()
    
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
            logger.info("🔄 Modo: Execução única (sem agendador)")
            run_pipeline()

        elif arg == "scheduler":
            logger.info("⏰ Modo: Agendador")
            start_scheduler()

        else:
            logger.error(f"❌ Argumento desconhecido: {arg}")
            logger.info("   Use: python main.py [run|scheduler]")
            sys.exit(1)
    else:
        # Padrão: inicia o scheduler
        logger.info("⏰ Modo padrão: Agendador")
        start_scheduler()
