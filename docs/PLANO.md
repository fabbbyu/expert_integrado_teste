# Plano de Desenvolvimento - SDR CRM com Gerador de Mensagens IA

## O Que É Este Sistema? (Resumo Simples)

**Sistema para equipes de vendas organizarem pessoas interessadas (leads) e gerarem mensagens personalizadas usando Inteligência Artificial.**

### Em Poucas Palavras:
- Cadastra pessoas interessadas em comprar
- Organiza elas em etapas do processo de venda (funil)
- Cria campanhas de abordagem (ex: Black Friday, lançamento de produto)
- Gera mensagens personalizadas automaticamente usando IA
- Visualiza tudo em formato Kanban (colunas por etapa)

**Para explicação detalhada, ver:** `docs/O_QUE_EH_ESTE_SISTEMA.md`

**Nota importante - Comunicação Natural**: 
- Tudo (código, comentários, commits, documentação) deve ser escrito de forma que você consiga entender e explicar facilmente.
- Usar linguagem do dia a dia: "fazer" ao invés de "implementar", "adicionar" ao invés de "integrar".
- Se você não conseguir explicar um termo em uma call ou vídeo, não usar ou explicar na primeira vez.
- Escrever como você falaria, não como um manual técnico.
- Regra de ouro: "Eu conseguiria explicar isso para alguém?" Se não, simplificar.

## Arquitetura Geral

O sistema será desenvolvido como uma aplicação full stack com separação clara entre frontend e backend:

- **Frontend**: Next.js 14+ (App Router) com React, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (TypeScript)
- **Banco de Dados**: Supabase PostgreSQL com Row Level Security (RLS)
- **Autenticação**: Supabase Auth
- **IA**: OpenAI API (GPT-3.5/GPT-4)
- **Hospedagem**: Vercel (frontend) + Supabase (backend/DB)

## Estrutura do Projeto

```
expert_integrado_teste/
├── frontend/                 # Next.js app
│   ├── app/                  # App Router
│   ├── components/           # Componentes React
│   ├── lib/                  # Utilitários e clientes
│   └── types/                # TypeScript types
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── generate-message/ # Geração de mensagens IA
│   │   └── auto-generate/    # Geração automática por gatilho
│   ├── migrations/           # Migrações SQL
│   └── seed.sql              # Dados iniciais (etapas do funil)
├── docs/                     # Documentação
│   ├── PLANO.md              # Este arquivo
│   ├── PROGRESSO.md           # Acompanhamento de progresso
│   └── PROVA_TECNICA.md       # Documento da prova técnica
├── .env.example              # Variáveis de ambiente
└── README.md                  # Documentação completa
```

## Banco de Dados (Supabase)

### Tabelas Principais

1. **workspaces** - Workspaces/empresas
   - id, name, created_at, updated_at

2. **workspace_members** - Membros dos workspaces
   - id, workspace_id, user_id, role (admin/member), created_at

3. **users** - Extensão do auth.users (perfil)
   - id (FK auth.users), full_name, avatar_url, created_at

4. **funnel_stages** - Etapas do funil (configuráveis)
   - id, workspace_id, name, order, required_fields (JSONB), created_at

5. **custom_fields** - Campos personalizados do workspace
   - id, workspace_id, name, type (text/number/date/select), options (JSONB), created_at

6. **leads** - Leads cadastrados
   - id, workspace_id, name, email, phone, company, position, source, notes, 
     assigned_to (FK users), stage_id (FK funnel_stages), custom_data (JSONB), 
     created_at, updated_at

7. **campaigns** - Campanhas de abordagem
   - id, workspace_id, name, context (texto), prompt (texto), 
     trigger_stage_id (FK funnel_stages, nullable), is_active, created_at, updated_at

8. **generated_messages** - Mensagens geradas pela IA
   - id, lead_id, campaign_id, messages (JSONB array), generated_at, sent_at

9. **activity_logs** - Histórico de atividades (diferencial)
   - id, lead_id, user_id, action_type, details (JSONB), created_at

### Políticas RLS

- Workspaces: usuário só vê workspaces onde é membro
- Leads: isolamento por workspace_id
- Campanhas: isolamento por workspace_id
- Todas as tabelas com validação de workspace membership

## Backend (Supabase Edge Functions)

### 1. generate-message
**Endpoint**: `/generate-message`
**Método**: POST
**Função**: Gera mensagens personalizadas para um lead usando IA

**Input**:
```typescript
{
  leadId: string,
  campaignId: string
}
```

**Processo**:
1. Buscar dados do lead (incluindo custom_data)
2. Buscar campanha (context + prompt)
3. Construir prompt completo para OpenAI
4. Chamar OpenAI API (2-3 variações)
5. Salvar em generated_messages
6. Retornar mensagens geradas

### 2. auto-generate
**Endpoint**: `/auto-generate`
**Método**: POST (chamado via trigger/webhook)
**Função**: Geração automática quando lead muda de etapa

**Processo**:
1. Trigger quando lead.stage_id muda
2. Verificar se há campanhas ativas com trigger_stage_id = nova etapa
3. Para cada campanha, chamar generate-message
4. Processar em background (assíncrono)

## Frontend (Next.js)

### Páginas Principais

1. **`/auth/login`** - Login/Cadastro (Supabase Auth)
2. **`/dashboard`** - Dashboard com métricas
3. **`/workspaces`** - Seleção/criação de workspace
4. **`/leads`** - Kanban board de leads
5. **`/leads/[id]`** - Detalhes do lead + geração de mensagens
6. **`/campaigns`** - Listagem de campanhas
7. **`/campaigns/[id]`** - Criar/editar campanha
8. **`/settings/funnel`** - Configurar funil e campos obrigatórios
9. **`/settings/custom-fields`** - Gerenciar campos personalizados

### Componentes Principais

- **KanbanBoard** - Board drag-and-drop (@dnd-kit)
- **LeadCard** - Card do lead no Kanban
- **LeadForm** - Formulário de criação/edição de lead
- **CampaignForm** - Formulário de campanha
- **MessageGenerator** - Interface de geração de mensagens
- **DashboardMetrics** - Cards de métricas
- **FunnelConfig** - Configuração de etapas e campos obrigatórios

### Bibliotecas Principais

- `@supabase/supabase-js` - Cliente Supabase
- `@tanstack/react-query` - Gerenciamento de estado/API
- `@dnd-kit/core` - Drag and drop
- `recharts` - Gráficos do dashboard
- `zod` - Validação de formulários
- `react-hook-form` - Formulários

## Integração OpenAI

### Estratégia de Prompt

Construir prompt estruturado:
1. **Contexto da campanha** (oferta, produto, período)
2. **Instruções do prompt** (persona, tom, formato)
3. **Dados do lead** (todos os campos, incluindo customizados)
4. **Formato de saída** (JSON com 2-3 variações)

### Tratamento de Erros

- Rate limiting
- Retry logic
- Fallback para mensagens genéricas
- Logging de erros

## Funcionalidades por Módulo

### 1. Autenticação e Workspaces ✅
- [ ] Cadastro/login com Supabase Auth
- [ ] Criação de workspace
- [ ] Isolamento de dados por workspace
- [ ] Controle de acesso básico

### 2. Gestão de Leads ✅
- [ ] CRUD de leads
- [ ] Campos personalizados (criação e uso)
- [ ] Atribuição de responsável
- [ ] Visualização Kanban
- [ ] Drag and drop entre etapas
- [ ] Validação de campos obrigatórios na transição

### 3. Funil de Pré-Vendas ✅
- [ ] Etapas padrão (7 etapas)
- [ ] Configuração de campos obrigatórios por etapa
- [ ] Validação na movimentação
- [ ] [DIFERENCIAL] Edição de funil (criar/editar etapas)

### 4. Campanhas e IA ✅
- [ ] CRUD de campanhas
- [ ] Campos: nome, contexto, prompt
- [ ] Geração manual de mensagens (2-3 variações)
- [ ] Visualização e regeneração
- [ ] Ação de envio (move para "Tentando Contato")
- [ ] [DIFERENCIAL] Geração automática por etapa gatilho

### 5. Regras de Transição ✅
- [ ] Configuração de campos obrigatórios por etapa
- [ ] Validação antes de mover lead
- [ ] Mensagem de erro informativa

### 6. Dashboard ✅
- [ ] Leads por etapa (gráfico)
- [ ] Total de leads
- [ ] [DIFERENCIAL] Taxa de conversão entre etapas
- [ ] [DIFERENCIAL] Leads por período
- [ ] [DIFERENCIAL] Mensagens geradas por campanha

### 7. Diferenciais Adicionais
- [ ] [DIFERENCIAL] Multi-workspace (usuário em múltiplos workspaces)
- [ ] [DIFERENCIAL] Convite de usuários com papéis
- [ ] [DIFERENCIAL] Histórico de atividades
- [ ] [DIFERENCIAL] Histórico de mensagens enviadas
- [ ] [DIFERENCIAL] Filtros e busca de leads
- [ ] [DIFERENCIAL] RLS bem implementado

## Hospedagem Gratuita

### Frontend - Vercel
- Deploy automático via GitHub
- Tier gratuito: ilimitado
- Domínio personalizado opcional
- SSL automático

### Backend/DB - Supabase
- Edge Functions: 500K invocações/mês grátis
- PostgreSQL: 500MB grátis
- Auth: ilimitado no tier gratuito
- API REST: ilimitado

### Variáveis de Ambiente
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions)
- `OPENAI_API_KEY`

## Decisões Técnicas

1. **Next.js App Router**: Estrutura moderna, Server Components, melhor SEO
2. **TypeScript**: Type safety em todo o projeto
3. **Supabase RLS (Row Level Security)**: Segurança em nível de banco, não apenas aplicação
4. **Edge Functions**: Processamento serverless, escalável
5. **React Query**: Cache inteligente, sincronização de estado
6. **dnd-kit**: Biblioteca moderna de drag-and-drop (mais leve que react-beautiful-dnd)
7. **Zod + React Hook Form**: Validação type-safe de formulários

## Como Escrever de Forma Natural

### Exemplos de Linguagem Simples

**Ao invés de:**
- "Implementamos a funcionalidade de geração de mensagens"
- "Integramos a API da OpenAI"
- "Desenvolvemos o sistema de autenticação"

**Escrever:**
- "Fizemos a geração de mensagens"
- "Conectamos com a API da OpenAI"
- "Criamos o sistema de login"

### Regra Geral
- **Verbos simples**: fazer, criar, adicionar, usar, conectar
- **Evitar**: implementar, integrar, desenvolver, utilizar (quando "usar" funciona)
- **Explicar quando necessário**: Se precisar usar um termo técnico, explicar de forma simples na primeira vez
- **Pensar antes**: "Eu conseguiria explicar isso em uma call?" Se não, simplificar

## Desafios e Soluções

1. **Geração automática assíncrona**: Usar Supabase Database Webhooks ou Edge Function trigger
2. **Validação de campos obrigatórios**: Validar no frontend e backend antes de atualizar
3. **Multi-tenancy**: RLS garante isolamento, workspace_id em todas as queries
4. **Performance do Kanban**: Virtualização de listas, paginação se necessário
5. **Rate limiting OpenAI**: Implementar queue e retry logic

## Documentação (README.md)

O README será criado com todas as seções obrigatórias do documento:

### 1. Descrição do Projeto
- Breve explicação do sistema desenvolvido
- Contexto de negócio (SDR CRM)
- Funcionalidades principais

### 2. Tecnologias Utilizadas
Lista completa de:
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, bibliotecas específicas
- **Backend**: Supabase Edge Functions, TypeScript
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **IA**: OpenAI API
- **Hospedagem**: Vercel (frontend), Supabase (backend/DB)
- **Ferramentas**: Git, GitHub, etc.

### 3. Decisões Técnicas (Seção Detalhada)
Documentação explicativa de cada decisão importante:

#### 3.1 Estrutura de Banco de Dados
- **Por que PostgreSQL/Supabase**: Escalabilidade, RLS nativo, integração completa
- **Estrutura de tabelas**: Justificativa do schema (workspaces, leads, campaigns, etc.)
- **Campos JSONB**: Uso de custom_data e required_fields (flexibilidade vs normalização)
- **Relacionamentos**: Estratégia de FKs e isolamento por workspace

#### 3.2 Integração com LLM
- **Por que OpenAI**: API estável, boa documentação, tier gratuito
- **Estrutura de prompts**: Como construímos prompts dinâmicos (contexto + dados do lead)
- **Múltiplas variações**: Estratégia de geração (2-3 opções)
- **Processamento assíncrono**: Como implementamos geração automática por gatilho
- **Tratamento de erros**: Rate limiting, retry logic, fallbacks

#### 3.3 Multi-tenancy (Isolamento por Workspace)
- **Estratégia escolhida**: Row Level Security (RLS) do Supabase
- **Por que RLS**: Segurança em nível de banco, não apenas aplicação
- **Implementação**: Políticas RLS em todas as tabelas
- **Workspace membership**: Como validamos acesso (workspace_members)
- **Vantagens**: Performance, segurança, escalabilidade

#### 3.4 Arquitetura Frontend
- **Por que Next.js App Router**: Server Components, melhor performance, SEO
- **Gerenciamento de estado**: React Query para cache e sincronização
- **Formulários**: Zod + React Hook Form (validação type-safe)
- **Drag and Drop**: dnd-kit (mais leve e moderno)

#### 3.5 Edge Functions
- **Por que Supabase Edge Functions**: Serverless, escalável, integrado
- **Separação de responsabilidades**: generate-message vs auto-generate
- **Triggers e webhooks**: Como implementamos geração automática

### 4. Desafios Encontrados e Soluções
Documentação de cada desafio enfrentado:

1. **Geração automática assíncrona**
   - Desafio: Trigger quando lead muda de etapa
   - Solução: Database webhooks ou Edge Function trigger
   - Implementação detalhada

2. **Validação de campos obrigatórios**
   - Desafio: Validar antes de mover lead entre etapas
   - Solução: Validação no frontend (UX) + backend (segurança)
   - Como armazenamos required_fields (JSONB)

3. **Performance do Kanban**
   - Desafio: Muitos leads podem tornar o board lento
   - Solução: Virtualização, paginação, otimização de queries

4. **Rate limiting OpenAI**
   - Desafio: Limites da API podem causar falhas
   - Solução: Queue system, retry logic, tratamento de erros

5. **Multi-tenancy seguro**
   - Desafio: Garantir isolamento total entre workspaces
   - Solução: RLS policies + validação em Edge Functions

### 5. Funcionalidades Implementadas
Checklist completo separado por categoria:

#### Requisitos Obrigatórios
- [ ] Autenticação e Workspaces
- [ ] Gestão de Leads
- [ ] Funil de Pré-Vendas
- [ ] Campanhas e IA
- [ ] Dashboard

#### Requisitos Diferenciais
- [ ] Geração automática por etapa gatilho
- [ ] Edição customizável do funil
- [ ] Multi-workspace (usuário em múltiplos)
- [ ] Sistema de convites e papéis
- [ ] Histórico de atividades
- [ ] Histórico de mensagens enviadas
- [ ] Filtros e busca
- [ ] Métricas avançadas
- [ ] RLS bem implementado

### 6. Instruções de Setup
- Pré-requisitos
- Configuração do Supabase
- Variáveis de ambiente
- Instalação de dependências
- Como rodar localmente
- Como fazer deploy

### 7. Link da Aplicação
- URL da aplicação deployada
- Credenciais de teste (se aplicável)

### 8. Link do Vídeo
- URL do vídeo de apresentação (Loom, YouTube, etc.)

## Checklist de Entrega

- [ ] Código completo no GitHub com histórico de commits
- [ ] README com todas as seções obrigatórias:
  - [ ] Descrição do projeto
  - [ ] Tecnologias utilizadas
  - [ ] Decisões técnicas detalhadas (BD, LLM, multi-tenancy, desafios)
  - [ ] Funcionalidades implementadas (checklist completo)
  - [ ] Instruções de setup
- [ ] Aplicação deployada e acessível (link no README)
- [ ] Vídeo de apresentação (10 min) - link no README
- [ ] Variáveis de ambiente configuradas
- [ ] Testes manuais dos fluxos principais

