# AfiliFlow Dashboard

Dashboard administrativo moderno para monitorar, controlar e otimizar o pipeline automatizado de publicação de produtos afiliados da Shopee em redes sociais.

## 🎨 Características

- **Painel de Métricas:** Total de produtos publicados, taxa de sucesso por rede social e categorias mais ativas
- **Feed Visual:** Últimas postagens com imagem gerada pela IA, título, preço e link de afiliado
- **Editor de Configurações:** Controle de SCHEDULE_TIMES, palavras-chave por categoria, filtros de preço e avaliação
- **Visualizador de Logs:** Histórico em tempo real das execuções do pipeline
- **Gerenciador de Cache:** Lista de produtos já publicados com opção de remover itens
- **Monitoramento de Integrações:** Status das conexões com Shopee API, Telegram, Buffer/Instagram e Gemini
- **Tema Dark Mode:** Interface moderna com paleta laranja Shopee e roxo digital

## 🚀 Stack Tecnológico

- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Database:** MySQL/TiDB
- **Autenticação:** Manus OAuth
- **Testes:** Vitest
- **Build:** Vite

## 📦 Instalação

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- MySQL/TiDB database

### Passos

1. **Instalar dependências:**
```bash
cd dashboard
pnpm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

3. **Aplicar migrações do banco de dados:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

4. **Executar em desenvolvimento:**
```bash
pnpm dev
```

O dashboard estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
dashboard/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas do dashboard
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários e configuração tRPC
│   │   └── contexts/      # React contexts
│   └── public/
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Definição de procedures tRPC
│   ├── db.ts              # Helpers de banco de dados
│   └── _core/             # Configuração interna
├── drizzle/               # Schema e migrações
├── shared/                # Código compartilhado
└── package.json
```

## 📊 Páginas Disponíveis

| Página | Descrição |
|--------|-----------|
| **Métricas** | Dashboard com KPIs e gráficos de performance |
| **Postagens** | Feed visual das últimas publicações |
| **Configurações** | Editor de configurações do pipeline |
| **Logs** | Histórico de execuções em tempo real |
| **Cache** | Gerenciador de produtos já publicados |
| **Integrações** | Monitoramento de status das APIs externas |

## 🔌 API (tRPC Procedures)

### Dashboard Routes

#### Métricas
- `dashboard.getMetricsSummary()` - Resumo de métricas
- `dashboard.getRecentPosts(limit)` - Últimas postagens
- `dashboard.getMetricsSnapshots(limit)` - Histórico de métricas

#### Configurações
- `dashboard.getPipelineConfig()` - Obter configurações
- `dashboard.updatePipelineConfig(config)` - Atualizar configurações

#### Logs
- `dashboard.getExecutionLogs(limit)` - Obter logs
- `dashboard.createExecutionLog(log)` - Criar novo log

#### Integrações
- `dashboard.getIntegrationStatus(name?)` - Status das integrações
- `dashboard.updateIntegrationStatus(name, status)` - Atualizar status

#### Cache
- `dashboard.getCacheItems()` - Listar itens em cache
- `dashboard.removeCacheItem(productId)` - Remover item do cache

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar em modo watch
pnpm test --watch

# Cobertura de testes
pnpm test --coverage
```

## 🚢 Deploy na Railway

1. **Conectar repositório GitHub:**
   - Acesse Railway.app
   - Crie novo projeto
   - Conecte o repositório `ronaldosantos-ai/AfiliFlow`

2. **Configurar variáveis de ambiente:**
   - `DATABASE_URL` - Conexão MySQL/TiDB
   - `JWT_SECRET` - Chave de sessão
   - `VITE_APP_ID` - ID da aplicação Manus OAuth
   - `OAUTH_SERVER_URL` - URL do servidor OAuth

3. **Build e Deploy:**
   - Railway detectará automaticamente o `package.json`
   - Execute `pnpm build` para build
   - Execute `pnpm start` para iniciar

## 📝 Variáveis de Ambiente

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# Auth
JWT_SECRET=sua-chave-secreta-aqui
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend

# Owner Info
OWNER_NAME=seu-nome
OWNER_OPEN_ID=seu-open-id
```

## 🤝 Integração com AfiliFlow Bot

O dashboard se comunica com o bot Python via:

1. **Banco de dados compartilhado:** Ambos acessam as mesmas tabelas
2. **API REST:** O bot pode fazer requisições aos endpoints tRPC
3. **Eventos:** Logs e métricas são registrados no banco em tempo real

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido para o projeto AfiliFlow
