# SDR CRM com Gerador de Mensagens IA

Sistema completo de gestão de leads (CRM) voltado para equipes de Pré-Vendas (SDR) com funcionalidade de geração automática de mensagens personalizadas utilizando Inteligência Artificial.

## 📋 Descrição do Projeto

Este sistema permite que equipes de vendas organizem seus leads em um funil de pré-vendas, criem campanhas de abordagem contextualizadas e gerem mensagens personalizadas automaticamente usando IA. O sistema foi desenvolvido como uma solução full stack moderna, priorizando usabilidade, segurança e escalabilidade.

### Principais Funcionalidades

- **Gestão de Leads**: Cadastro completo com campos personalizáveis, visualização em formato Kanban e movimentação entre etapas
- **Funil de Pré-Vendas**: 7 etapas configuráveis com validação de campos obrigatórios
- **Campanhas de Abordagem**: Criação de campanhas com contexto e prompts personalizados
- **Geração de Mensagens com IA**: Integração com OpenAI para gerar mensagens personalizadas baseadas nos dados do lead
- **Geração Automática**: Mensagens geradas automaticamente quando leads chegam em etapas específicas
- **Multi-workspace**: Suporte para múltiplos workspaces com isolamento completo de dados
- **Sistema de Convites**: Convites por email com papéis (admin/member)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16** (App Router) - Framework React para aplicações full stack
- **TypeScript** - Tipagem estática para maior segurança de código
- **React 19** - Biblioteca para construção de interfaces
- **Tailwind CSS 4** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **@tanstack/react-query** - Gerenciamento de estado e cache de dados
- **@dnd-kit** - Biblioteca para drag-and-drop no Kanban
- **Recharts** - Gráficos e visualizações

### Backend
- **Supabase** - Plataforma Backend-as-a-Service
  - **PostgreSQL** - Banco de dados relacional
  - **Edge Functions** - Funções serverless (TypeScript)
  - **Supabase Auth** - Autenticação de usuários
  - **Row Level Security (RLS)** - Segurança em nível de linha

### Integração IA
- **OpenAI API** - Geração de mensagens personalizadas (GPT-3.5/GPT-4)

### Hospedagem
- **Vercel** - Deploy do frontend (plano gratuito)
- **Supabase** - Backend, banco de dados e Edge Functions (plano gratuito)

### Ferramentas de Desenvolvimento
- **Git + GitHub** - Controle de versão
- **TypeScript** - Tipagem estática
- **ESLint** - Linter para qualidade de código

## 🏗️ Decisões Técnicas

### Estrutura de Banco de Dados

**Por que PostgreSQL com JSONB?**

Escolhemos PostgreSQL como banco de dados principal por ser robusto, confiável e oferecer suporte nativo a JSONB. O JSONB foi fundamental para implementar:

- **Campos personalizados flexíveis**: Permite que cada workspace defina seus próprios campos sem alterar o schema
- **Campos obrigatórios por etapa**: Armazenados como array JSONB na tabela `funnel_stages`
- **Dados customizados dos leads**: Armazenados em `custom_data` (JSONB) permitindo flexibilidade sem migrations constantes

**Estrutura Multi-tenant:**

A arquitetura multi-tenant foi implementada através de:
- Campo `workspace_id` em todas as tabelas de dados
- Row Level Security (RLS) garantindo isolamento automático
- Função helper `is_workspace_member()` para validação de acesso
- Políticas RLS que verificam membership antes de qualquer operação

**Tabelas principais:**
- `workspaces` - Isolamento por empresa/equipe
- `workspace_members` - Relação usuário-workspace com papéis (admin/member)
- `workspace_invites` - Sistema de convites com tokens únicos
- `leads` - Dados dos leads com `custom_data` (JSONB)
- `funnel_stages` - Etapas do funil com `required_fields` (JSONB)
- `campaigns` - Campanhas com contexto e prompt
- `generated_messages` - Mensagens geradas com array de variações (JSONB)
- `activity_logs` - Histórico de atividades (diferencial)

### Integração com LLM

**Como estruturou a integração com LLM?**

A integração foi implementada através de Supabase Edge Functions, que rodam serverless e se comunicam diretamente com a OpenAI API.

**Arquitetura:**

1. **Edge Function `generate-message`**:
   - Recebe `leadId` e `campaignId`
   - Busca dados completos do lead (incluindo `custom_data`)
   - Busca contexto e prompt da campanha
   - Constrói prompt estruturado para OpenAI:
     ```
     Contexto da campanha
     + Instruções do prompt
     + Dados do lead (todos os campos)
     + Formato de saída (JSON com 2-3 variações)
     ```
   - Chama OpenAI API
   - Salva mensagens geradas em `generated_messages`
   - Retorna variações para o frontend

2. **Edge Function `auto-generate`**:
   - Chamada automaticamente quando lead muda de etapa
   - Verifica campanhas ativas com `trigger_stage_id` correspondente
   - Invoca `generate-message` para cada campanha relevante
   - Processa em background (não bloqueia UI)

**Decisões de design:**
- **Separação contexto/prompt**: Permite reutilizar contexto em múltiplas campanhas
- **Processamento assíncrono**: Geração automática não bloqueia interface
- **Múltiplas variações**: Gera 2-3 opções para o usuário escolher
- **Tratamento de erros**: Retry logic e fallbacks implementados

### Multi-tenancy

**Como implementou o multi-tenancy?**

O isolamento de dados foi garantido em múltiplas camadas:

1. **Banco de Dados (RLS)**:
   - Todas as tabelas têm RLS habilitado
   - Políticas verificam `is_workspace_member(workspace_id)`
   - Usuário só acessa dados de workspaces onde é membro
   - Admins têm permissões especiais (ex: criar convites)

2. **Frontend**:
   - Workspace atual armazenado em `localStorage`
   - Todas as queries filtram por `workspace_id`
   - Middleware valida workspace antes de carregar páginas

3. **Edge Functions**:
   - Validação de membership antes de processar
   - Isolamento garantido mesmo em processamento assíncrono

**Sistema de Workspaces:**
- Usuário pode participar de múltiplos workspaces
- Criador do workspace é automaticamente admin
- Admins podem convidar outros usuários (com papéis)
- Isolamento completo entre workspaces

### Desafios Encontrados e Soluções

1. **Validação de Campos Obrigatórios**
   - **Desafio**: Validar campos padrão e personalizados antes de mover lead
   - **Solução**: Função `validateRequiredFields()` que verifica ambos os tipos, com feedback visual no Kanban

2. **Geração Automática em Background**
   - **Desafio**: Não bloquear UI durante geração de mensagens
   - **Solução**: Edge Function `auto-generate` processa assincronamente, frontend não aguarda resposta

3. **Flexibilidade de Campos Personalizados**
   - **Desafio**: Permitir campos dinâmicos sem migrations constantes
   - **Solução**: JSONB para `custom_data` e `required_fields`, permitindo total flexibilidade

4. **Segurança Multi-tenant**
   - **Desafio**: Garantir isolamento total entre workspaces
   - **Solução**: RLS policies + validação em múltiplas camadas (DB, frontend, Edge Functions)

5. **Performance do Dashboard**
   - **Desafio**: Carregar métricas sem travar interface
   - **Solução**: React Query para cache e refetch inteligente, queries otimizadas

## ✅ Funcionalidades Implementadas

### Requisitos Obrigatórios

- [x] **Autenticação e Workspaces**
  - Sistema de cadastro e login
  - Criação de workspaces
  - Isolamento de dados por workspace
  - Controle de acesso básico

- [x] **Gestão de Leads**
  - Cadastro com campos padrão (nome, email, telefone, empresa, cargo, origem, observações)
  - Campos personalizados (criação e uso)
  - Atribuição de responsável (opcional)
  - Visualização Kanban
  - Drag and drop entre etapas
  - Visualização e edição de detalhes

- [x] **Funil de Pré-Vendas**
  - 7 etapas padrão configuráveis
  - Configuração de campos obrigatórios por etapa
  - Validação na movimentação

- [x] **Campanhas e Geração de Mensagens**
  - CRUD de campanhas (nome, contexto, prompt)
  - Geração manual de mensagens (2-3 variações)
  - Visualização e regeneração
  - Ação de envio (move para "Tentando Contato")

- [x] **Regras de Transição**
  - Configuração de campos obrigatórios por etapa
  - Validação antes de mover lead
  - Mensagens de erro informativas

- [x] **Dashboard**
  - Total de leads cadastrados
  - Leads por etapa (gráficos de barras e pizza)
  - Métricas visuais

### Requisitos Diferenciais

- [x] **Geração automática por etapa gatilho** - Mensagens geradas automaticamente quando lead chega em etapa configurada
- [x] **Edição customizável do funil** - Criar e editar etapas do funil
- [x] **Multi-workspace** - Usuário pode participar de múltiplos workspaces
- [x] **Sistema de convites e papéis** - Convites por email com papéis (admin/member)
- [x] **Histórico de atividades** - Log completo de ações nos leads
- [x] **Histórico de mensagens enviadas** - Registro das mensagens efetivamente enviadas
- [x] **Filtros e busca** - Filtrar por responsável, etapa, buscar por nome/empresa/email
- [x] **Métricas avançadas** - Gráficos visuais no dashboard
- [x] **Row Level Security (RLS)** - Políticas de segurança bem implementadas

## 🚀 Instruções de Setup

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Conta no OpenAI (para gerar mensagens)
- Git instalado

### Configuração Local

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositorio>
   cd expert_integrado_teste
   ```

2. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com/)
   - Aplique as migrations na ordem:
     - `backend/migrations/20250109000001_create_workspaces.sql`
     - `backend/migrations/20250109000002_create_funnel_and_leads.sql`
     - `backend/migrations/20250109000003_create_campaigns_and_messages.sql`
     - `backend/migrations/20250109000004_create_rls_policies.sql`
     - `backend/migrations/20250109000005_seed_default_stages.sql`
     - `backend/migrations/20250109000006_create_invites.sql`

3. **Configure o Frontend**:
   ```bash
   cd frontend
   npm install
   ```
   
   Crie arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   ```

4. **Configure Edge Functions**:
   - Instale Supabase CLI
   - Faça login: `supabase login`
   - Link projeto: `supabase link --project-ref seu-project-ref`
   - Configure secret: `supabase secrets set OPENAI_API_KEY=sua-chave-openai`
   - Deploy functions:
     ```bash
     supabase functions deploy generate-message
     supabase functions deploy auto-generate
     ```

5. **Execute o projeto**:
   ```bash
   cd frontend
   npm run dev
   ```
   
   Acesse: http://localhost:3000

**Para instruções detalhadas, consulte:**
- `docs/COMO_RODAR_LOCALMENTE.md` - Guia completo de setup local
- `docs/COMO_FAZER_DEPLOY.md` - Guia de deploy em produção

## 📦 Deploy

### Frontend (Vercel)

1. Conecte repositório GitHub ao Vercel
2. Configure variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Deploy automático a cada push

### Backend (Supabase)

1. Aplique migrations no projeto Supabase
2. Configure Edge Functions (veja instruções acima)
3. Configure variável `OPENAI_API_KEY` nos secrets

**Link da aplicação**: [Será adicionado após deploy]

## 🎬 Apresentação em Vídeo

**Link do vídeo**: [Será adicionado após gravação]

O vídeo demonstra:
- Visão geral da aplicação
- Fluxo principal: cadastro → criar lead → gerar mensagem com IA
- Decisões técnicas relevantes
- Diferenciais implementados

## 📁 Estrutura do Projeto

```
expert_integrado_teste/
├── frontend/                 # Next.js app
│   ├── app/                 # App Router
│   ├── components/          # Componentes React
│   ├── lib/                 # Utilitários e clientes
│   └── types/               # TypeScript types
├── backend/
│   ├── functions/           # Edge Functions
│   │   ├── generate-message/
│   │   └── auto-generate/
│   └── migrations/         # Migrations SQL
├── docs/                    # Documentação interna
└── README.md               # Este arquivo
```

## 📝 Notas Adicionais

- **Comunicação Natural**: Todo o código, commits e documentação foram escritos de forma natural e compreensível
- **Commits Organizados**: Histórico de commits mostra evolução incremental do projeto
- **Testes**: Sistema testado localmente em todos os fluxos principais
- **Segurança**: RLS implementado em todas as tabelas, garantindo isolamento de dados

## 👤 Autor

Desenvolvido como prova técnica para avaliação de habilidades em desenvolvimento full stack com Vibe Coding.

---

**Desenvolvido com ❤️ usando Next.js, Supabase e OpenAI**

