# 🚀 AfiliFlow

Bot de automação para afiliados Amazon BR que:
1. Busca os melhores produtos (rating ≥ 4.0) por categoria
2. Envia o link de afiliado para o bot do Telegram (publica no blog)
3. Gera imagem lifestyle com CTAs usando Gemini/Imagen 3
4. Publica no Instagram e Facebook via Buffer

---

## 📁 Estrutura

```
amazon-affiliate-bot/
├── main.py              # Entry point + scheduler
├── amazon.py            # Amazon Creators API — busca e filtra produtos
├── telegram_sender.py   # Envia URL para o bot Telegram
├── image_generator.py   # Gemini/Imagen 3 — gera imagem lifestyle
├── buffer_publisher.py  # Buffer API — publica no Instagram/Facebook
├── cache.py             # Evita repetir produtos já publicados
├── config.py            # Carrega variáveis de ambiente
├── .env.example         # Modelo do arquivo .env
├── requirements.txt     # Dependências Python
└── README.md
```

---

## ⚙️ Setup

### 1. Clonar e instalar dependências

```bash
git clone <seu-repo>
cd amazon-affiliate-bot
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves:

| Variável | Onde obter |
|---|---|
| `AMAZON_CREATORS_CREDENTIAL_ID` | [Associates — Creators API](https://affiliate-program.amazon.com.br/) (Credential ID) |
| `AMAZON_CREATORS_CREDENTIAL_SECRET` | Mesmo lugar (secret exibido ao criar o par) |
| `AMAZON_CREATORS_CREDENTIAL_VERSION` | `3.1` (LWA, credenciais novas) ou `2.1` / `2.2` / `2.3` (antigas) |
| `AMAZON_CREATORS_AUTH_ENDPOINT` | Só se precisar: Europa `https://api.amazon.co.uk/auth/o2/token`, FE `https://api.amazon.co.jp/auth/o2/token` |
| `AMAZON_MARKETPLACE` | `www.amazon.com.br` |
| `AMAZON_ASSOCIATE_TAG` | `melhoresofertasdaray-20` (já configurado) |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) no Telegram |
| `TELEGRAM_CHAT_ID` | ID do chat onde você envia os links manualmente |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |
| `BUFFER_ACCESS_TOKEN` | [Buffer Developer](https://buffer.com/developers/api) |
| `BUFFER_PROFILE_ID_INSTAGRAM` | Ver abaixo como obter |
| `BUFFER_PROFILE_ID_FACEBOOK` | Ver abaixo como obter |

### 3. Obter IDs dos perfis do Buffer

```bash
python main.py profiles
```

Isso lista todos os perfis conectados ao seu Buffer com o ID de cada um.

### 4. Testar o pipeline manualmente

```bash
python main.py run
```

Executa o fluxo completo uma vez para validar todas as integrações.

### 5. Iniciar o agendador

```bash
python main.py
```

O bot rodará nos horários definidos em `SCHEDULE_TIMES` (padrão: 08:00, 12:00, 18:00, 21:00 horário de Brasília).

---

## ☁️ Deploy no Railway

1. Crie um novo projeto no [Railway](https://railway.app)
2. Conecte o repositório GitHub
3. Vá em **Variables** e adicione todas as variáveis do `.env`
4. O Railway detecta automaticamente o `requirements.txt` e roda `python main.py`

> **Dica:** No Railway, defina o Start Command como:
> ```
> python main.py
> ```

---

## 🕐 Configurando Horários

No `.env`, edite `SCHEDULE_TIMES` com os horários desejados (HH:MM, separados por vírgula, fuso de Brasília):

```env
# 4x ao dia
SCHEDULE_TIMES=08:00,12:00,18:00,21:00

# 6x ao dia
SCHEDULE_TIMES=07:00,09:00,12:00,15:00,18:00,21:00

# 1x ao dia
SCHEDULE_TIMES=09:00
```

---

## 📂 Categorias Disponíveis

| Código | Label |
|---|---|
| `HomeAndKitchen` | Casa e Cozinha |
| `BeautyAndPersonalCare` | Beleza e Cuidados Pessoais |
| `SportsAndOutdoors` | Esportes e Fitness |
| `Electronics` | Eletrônicos |

Para ativar/desativar categorias, edite `ACTIVE_CATEGORIES` no `.env`.

---

## 🔍 Filtros de Produto

| Variável | Padrão | Descrição |
|---|---|---|
| `MIN_RATING` | `4.0` | Rating mínimo (0-5) |
| `MIN_REVIEWS` | `50` | Número mínimo de avaliações |
| `MAX_PRICE` | `500.00` | Preço máximo em R$ |
| `PRODUCTS_PER_RUN` | `1` | Produtos por execução |

---

## 📊 Monitoramento

```bash
# Ver stats do cache
python main.py cache

# Ver logs em tempo real
tail -f bot.log
```

---

## 🔄 Fluxo Completo

```
APScheduler (horário configurado)
       │
       ▼
Amazon Creators API → filtra rating ≥ 4.0 + reviews
       │
       ├──► Telegram Bot → publica no blog
       │
       └──► Gemini Imagen 3 → imagem lifestyle + CTAs
                   │
                   └──► Buffer API → Instagram + Facebook
```

---

## ⚠️ Observações

- O cache evita republicar o mesmo produto por **30 dias**
- A cada execução, as categorias são embaralhadas para variar o conteúdo
- Imagens temporárias são removidas automaticamente após o upload
- Logs são salvos em `bot.log`
