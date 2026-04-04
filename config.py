import os
from dotenv import load_dotenv

load_dotenv()

# ── Amazon ────────────────────────────────────────────────
AMAZON_ACCESS_KEY  = os.getenv("AMAZON_ACCESS_KEY")
AMAZON_SECRET_KEY  = os.getenv("AMAZON_SECRET_KEY")
AMAZON_ASSOCIATE_TAG = os.getenv("AMAZON_ASSOCIATE_TAG", "melhoresofertasdaray-20")
AMAZON_COUNTRY     = os.getenv("AMAZON_COUNTRY", "BR")

# ── Telegram ──────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID")

# ── Gemini ────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ── Buffer ────────────────────────────────────────────────
BUFFER_ACCESS_TOKEN          = os.getenv("BUFFER_ACCESS_TOKEN")
BUFFER_PROFILE_ID_INSTAGRAM  = os.getenv("BUFFER_PROFILE_ID_INSTAGRAM")
BUFFER_PROFILE_ID_FACEBOOK   = os.getenv("BUFFER_PROFILE_ID_FACEBOOK")

# ── Scheduler ─────────────────────────────────────────────
_raw_times = os.getenv("SCHEDULE_TIMES", "08:00,12:00,18:00,21:00")
SCHEDULE_TIMES = [t.strip() for t in _raw_times.split(",") if t.strip()]

# ── Filtros ───────────────────────────────────────────────
MIN_RATING        = float(os.getenv("MIN_RATING", "4.0"))
MIN_REVIEWS       = int(os.getenv("MIN_REVIEWS", "50"))
MAX_PRICE         = float(os.getenv("MAX_PRICE", "500.00"))
PRODUCTS_PER_RUN  = int(os.getenv("PRODUCTS_PER_RUN", "1"))

# ── Categorias ────────────────────────────────────────────
_raw_cats = os.getenv(
    "ACTIVE_CATEGORIES",
    "HomeAndKitchen,BeautyAndPersonalCare,SportsAndOutdoors,Electronics"
)
ACTIVE_CATEGORIES = [c.strip() for c in _raw_cats.split(",") if c.strip()]

# Mapeamento categoria → label PT-BR (para prompts e captions)
CATEGORY_LABELS = {
    "HomeAndKitchen":        "Casa e Cozinha",
    "BeautyAndPersonalCare": "Beleza e Cuidados Pessoais",
    "SportsAndOutdoors":     "Esportes e Fitness",
    "Electronics":           "Eletrônicos",
}

def validate():
    """Valida se as variáveis obrigatórias estão presentes."""
    required = {
        "AMAZON_ACCESS_KEY":  AMAZON_ACCESS_KEY,
        "AMAZON_SECRET_KEY":  AMAZON_SECRET_KEY,
        "TELEGRAM_BOT_TOKEN": TELEGRAM_BOT_TOKEN,
        "TELEGRAM_CHAT_ID":   TELEGRAM_CHAT_ID,
        "GEMINI_API_KEY":     GEMINI_API_KEY,
        "BUFFER_ACCESS_TOKEN": BUFFER_ACCESS_TOKEN,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        raise EnvironmentError(
            f"❌ Variáveis de ambiente faltando: {', '.join(missing)}\n"
            "Verifique o arquivo .env"
        )
    print("✅ Configurações validadas com sucesso.")
