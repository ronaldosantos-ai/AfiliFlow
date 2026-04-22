# AfiliFlow Dashboard - TODO

## Fase 1: Arquitetura de Dados
- [x] Definir schema do banco de dados (postagens, configurações, logs, integrações)
- [x] Criar tabelas: posts, pipeline_config, execution_logs, integration_status, cache_items
- [x] Gerar e aplicar migrações SQL

## Fase 2: UI Base e Tema
- [x] Configurar paleta de cores (laranja Shopee oklch 0.6 0.2 29, roxo digital oklch 0.55 0.18 270)
- [x] Implementar DashboardLayout com sidebar
- [x] Criar componentes base (Header, Sidebar, MainContent)
- [x] Aplicar dark mode com Tailwind

## Fase 3: Painel de Métricas
- [x] Implementar cards de métricas (total publicado, taxa sucesso por rede)
- [x] Criar feed visual de últimas postagens
- [x] Exibir imagem IA, título, preço, link afiliado, status

## Fase 4: Editor de Configurações
- [x] Criar formulário de configuração do pipeline
- [x] Campos: SCHEDULE_TIMES, palavras-chave por categoria, MAX_PRICE, MIN_RATING
- [x] Salvar/carregar configurações do banco de dados (tRPC procedures criadas)
- [x] Validação de entrada

## Fase 5: Logs e Cache
- [x] Implementar visualizador de logs em tempo real
- [x] Criar gerenciador de cache com lista de produtos publicados
- [x] Função de remover itens do cache

## Fase 6: Integrações e Histórico
- [x] Monitorar status das integrações (Shopee, Telegram, Buffer/Instagram, Gemini)
- [x] Alertas de falha de integração
- [x] Histórico de execuções com detalhes

## Fase 7: Testes e Entrega
- [x] Testes unitários com Vitest (17 testes passando)
- [x] Helpers de banco de dados criados
- [x] Routers tRPC para dashboard implementados
- [x] Integração backend-frontend pronta para consumo
