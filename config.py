import os
from dotenv import load_dotenv

load_dotenv()

# ── Shopee ────────────────────────────────────────────────
SHOPEE_APP_ID = os.getenv("SHOPEE_APP_ID", "18191390000")
SHOPEE_TOKEN = os.getenv("SHOPEE_TOKEN", "XCZN2VKYQ3F4RP47BBP3RZX5EJYM3UK2")

# ── Amazon ────────────────────────────────────────────────
def _strip_env(name: str) -> str | None:
    v = os.getenv(name)
    return v.strip() if v else None


# Creators API (OAuth client credentials no Associates Central — não usar Access Key da PA API)
AMAZON_CREATORS_CREDENTIAL_ID = _strip_env("AMAZON_CREATORS_CREDENTIAL_ID")
AMAZON_CREATORS_CREDENTIAL_SECRET = _strip_env("AMAZON_CREATORS_CREDENTIAL_SECRET")
# v2: 2.1 (Américas), 2.2 (Europa), 2.3 (FE). v3: ex. 3.1 = LWA (padrão para credenciais novas).
AMAZON_CREATORS_CREDENTIAL_VERSION = (os.getenv("AMAZON_CREATORS_CREDENTIAL_VERSION") or "3.1").strip()
# Cabeçalho de marketplace (ex.: www.amazon.com.br)
AMAZON_MARKETPLACE = (os.getenv("AMAZON_MARKETPLACE") or "www.amazon.com.br").strip()
# Opcional: URL do token OAuth se a Amazon indicar um endpoint customizado
_raw_auth_ep = os.getenv("AMAZON_CREATORS_AUTH_ENDPOINT")
AMAZON_CREATORS_AUTH_ENDPOINT = _raw_auth_ep.strip() if _raw_auth_ep else ""

AMAZON_ASSOCIATE_TAG = os.getenv("AMAZON_ASSOCIATE_TAG", "melhoresofertasdaray-20")
AMAZON_COUNTRY = os.getenv("AMAZON_COUNTRY", "BR")
AMAZON_ITEM_COUNT = int(os.getenv("AMAZON_ITEM_COUNT", "15"))

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
        "SHOPEE_APP_ID": SHOPEE_APP_ID,
        "SHOPEE_TOKEN": SHOPEE_TOKEN,
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
