# 📋 Progresso do Projeto - SDR CRM com IA

Este arquivo serve para acompanhar o progresso do desenvolvimento e facilitar a retomada do trabalho.

**Última atualização**: [Será atualizado automaticamente]

**💡 Não sabe o que é este sistema?** Leia primeiro: `docs/O_QUE_EH_ESTE_SISTEMA.md` - explicação simples do que o sistema faz, sem jargões técnicos.

**Nota importante**: 
- **Comunicação natural**: Tudo (código, comentários, commits, documentação) deve ser escrito de forma que você consiga entender e explicar facilmente.
- **Evitar jargões técnicos**: Se não conseguir explicar um termo em uma call ou vídeo, não usar ou explicar na primeira vez.
- **Linguagem simples**: Preferir "fazer" ao invés de "implementar", "adicionar" ao invés de "integrar", "criar" ao invés de "desenvolver". Linguagem do dia a dia.
- **Código**: Natural e funcional, sem super complexidade. Clareza > perfeição.
- **Commits**: **ANTES DE COMMITAR, SEMPRE confirmar com você a mensagem OU passar a mensagem para você fazer o commit**
- **Documentação**: Clara mas não excessivamente formal. Fácil de explicar.
- **Tudo**: Parecer mix humano + IA, não 100% IA. Se tiver dúvida, confirmar antes.

---

## ✅ Checkpoints de Confirmação

Antes de iniciar cada módulo principal, confirmar tecnologias e abordagens:

### Setup Inicial
- [ ] Confirmar: Next.js 14+ App Router? TypeScript?
- [ ] Confirmar: Tailwind CSS ou outro?
- [ ] Confirmar: Estrutura de pastas?

### Banco de Dados
- [ ] Confirmar: Estrutura das tabelas está correta?
- [ ] Confirmar: JSONB para campos flexíveis?
- [ ] Confirmar: Abordagem de RLS?

### Autenticação
- [ ] Confirmar: Supabase Auth direto ou wrapper?
- [ ] Confirmar: Middleware Next.js ou outra abordagem?

### Frontend - Leads/Kanban
- [ ] Confirmar: @dnd-kit para drag-and-drop?
- [ ] Confirmar: React Query para estado?
- [ ] Confirmar: Estrutura de componentes?

### Campanhas/IA
- [ ] Confirmar: Edge Functions ou API Routes?
- [ ] Confirmar: Estrutura de prompts?
- [ ] Confirmar: Tratamento de erros?

### Dashboard
- [ ] Confirmar: recharts para gráficos?
- [ ] Confirmar: Quais métricas priorizar?

---

## ✅ Status Geral

- [ ] Setup inicial do projeto
- [ ] Banco de dados e migrations
- [ ] Autenticação e workspaces
- [ ] Funil e etapas
- [ ] Gestão de leads
- [ ] Board Kanban
- [ ] Campanhas
- [ ] Integração com IA
- [ ] Dashboard
- [ ] Funcionalidades diferenciais
- [ ] Deploy e hospedagem
- [ ] Documentação completa

---

## 🚀 Setup Inicial

- [ ] Criar estrutura do projeto (Next.js + Supabase)
- [ ] Configurar TypeScript
- [ ] Instalar dependências base
- [ ] Configurar Supabase local/cli
- [ ] Criar arquivo .env.example
- [ ] Inicializar Git e primeiro commit

---

## 🗄️ Banco de Dados

### Migrations
- [ ] Migration: Tabela `workspaces`
- [ ] Migration: Tabela `workspace_members`
- [ ] Migration: Tabela `users` (extensão auth.users)
- [ ] Migration: Tabela `funnel_stages`
- [ ] Migration: Tabela `custom_fields`
- [ ] Migration: Tabela `leads`
- [ ] Migration: Tabela `campaigns`
- [ ] Migration: Tabela `generated_messages`
- [ ] Migration: Tabela `activity_logs` (diferencial)

### Políticas RLS
- [ ] RLS: `workspaces` - usuário só vê workspaces onde é membro
- [ ] RLS: `workspace_members` - isolamento por workspace
- [ ] RLS: `users` - acesso controlado
- [ ] RLS: `funnel_stages` - isolamento por workspace
- [ ] RLS: `custom_fields` - isolamento por workspace
- [ ] RLS: `leads` - isolamento por workspace
- [ ] RLS: `campaigns` - isolamento por workspace
- [ ] RLS: `generated_messages` - isolamento por workspace
- [ ] RLS: `activity_logs` - isolamento por workspace

### Seed Data
- [ ] Seed: Etapas padrão do funil (7 etapas)

---

## 🔐 Autenticação e Workspaces

- [ ] Configurar Supabase Auth no frontend
- [ ] Página de login/cadastro (`/auth/login`)
- [ ] Middleware de proteção de rotas
- [ ] Hook/context para gerenciar sessão
- [ ] Criar sistema de workspaces (CRUD)
- [ ] Criar sistema de membros de workspace
- [ ] Página de seleção/criação de workspace (`/workspaces`)
- [ ] Isolamento de dados por workspace (validação)
- [ ] [DIFERENCIAL] Multi-workspace (usuário em múltiplos)
- [ ] [DIFERENCIAL] Sistema de convites
- [ ] [DIFERENCIAL] Papéis (admin/member)

---

## 🎯 Funil de Pré-Vendas

- [ ] Criar sistema de etapas do funil
- [ ] Configuração de campos obrigatórios por etapa
- [ ] Validação de transição entre etapas (frontend)
- [ ] Validação de transição entre etapas (backend)
- [ ] Página de configuração do funil (`/settings/funnel`)
- [ ] [DIFERENCIAL] Edição customizável do funil (criar/editar etapas)

---

## 👥 Gestão de Leads

### CRUD Básico
- [ ] Formulário de criação de lead
- [ ] Formulário de edição de lead
- [ ] Listagem de leads
- [ ] Visualização de detalhes do lead (`/leads/[id]`)
- [ ] Exclusão de lead

### Campos Personalizados
- [ ] CRUD de campos personalizados (`/settings/custom-fields`)
- [ ] Tipos de campo: text, number, date, select
- [ ] Integração de campos personalizados no formulário de lead
- [ ] Armazenamento em `custom_data` (JSONB)

### Funcionalidades
- [ ] Atribuição de responsável ao lead
- [ ] Validação de campos obrigatórios antes de mover
- [ ] [DIFERENCIAL] Filtros de leads (responsável, etapa, etc)
- [ ] [DIFERENCIAL] Busca de leads (nome, empresa, etc)
- [ ] [DIFERENCIAL] Histórico de atividades do lead

---

## 📊 Board Kanban

- [ ] Componente KanbanBoard
- [ ] Componente LeadCard
- [ ] Integração com drag-and-drop (@dnd-kit)
- [ ] Visualização de leads por etapa
- [ ] Movimentação de leads entre etapas (drag-and-drop)
- [ ] Validação visual de campos obrigatórios
- [ ] Feedback visual ao mover lead
- [ ] Atualização em tempo real (se aplicável)

---

## 📢 Campanhas

- [ ] CRUD de campanhas
- [ ] Listagem de campanhas (`/campaigns`)
- [ ] Formulário de criação/edição (`/campaigns/[id]`)
- [ ] Campo: Nome da campanha
- [ ] Campo: Contexto (textarea rico)
- [ ] Campo: Prompt (textarea rico)
- [ ] Campo: Etapa gatilho (select)
- [ ] Campo: Ativo/Inativo
- [ ] Validação de formulário

---

## 🤖 Integração com IA (OpenAI)

### Edge Function: generate-message
- [ ] Criar Edge Function `generate-message`
- [ ] Buscar dados do lead (incluindo custom_data)
- [ ] Buscar dados da campanha (context + prompt)
- [ ] Construir prompt completo para OpenAI
- [ ] Integração com OpenAI API
- [ ] Geração de 2-3 variações de mensagem
- [ ] Salvar mensagens em `generated_messages`
- [ ] Tratamento de erros (rate limit, retry)
- [ ] Retornar mensagens geradas

### Edge Function: auto-generate
- [ ] Criar Edge Function `auto-generate`
- [ ] Trigger quando lead muda de etapa
- [ ] Verificar campanhas ativas com etapa gatilho
- [ ] Processar geração em background
- [ ] Chamar generate-message para cada campanha

### Interface de Geração
- [ ] Componente MessageGenerator
- [ ] Seleção de campanha
- [ ] Botão de gerar mensagens
- [ ] Exibição de variações geradas
- [ ] Botão de regenerar
- [ ] Botão de copiar mensagem
- [ ] Botão de enviar (simulado)
- [ ] Ação de envio: mover lead para "Tentando Contato"
- [ ] [DIFERENCIAL] Visualizar mensagens pré-geradas (auto-generate)

---

## 📈 Dashboard

- [ ] Página de dashboard (`/dashboard`)
- [ ] Card: Total de leads
- [ ] Card: Leads por etapa (gráfico)
- [ ] [DIFERENCIAL] Taxa de conversão entre etapas
- [ ] [DIFERENCIAL] Leads por período (gráfico temporal)
- [ ] [DIFERENCIAL] Mensagens geradas por campanha
- [ ] [DIFERENCIAL] Outras métricas relevantes

---

## 🎁 Funcionalidades Diferenciais

- [ ] Geração automática por etapa gatilho
- [ ] Edição customizável do funil
- [ ] Multi-workspace (usuário em múltiplos workspaces)
- [ ] Sistema de convites de usuários
- [ ] Papéis/permissões (admin/member)
- [ ] Histórico de atividades (activity_logs)
- [ ] Histórico de mensagens enviadas
- [ ] Filtros avançados de leads
- [ ] Busca de leads
- [ ] Métricas avançadas no dashboard
- [ ] RLS bem implementado (todas as tabelas)

---

## 🚀 Deploy e Hospedagem

### Frontend (Vercel)
- [ ] Criar conta/conectar Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Fazer deploy inicial
- [ ] Testar aplicação em produção
- [ ] Configurar domínio (opcional)

### Backend/DB (Supabase)
- [ ] Criar projeto no Supabase
- [ ] Aplicar migrations no Supabase
- [ ] Configurar Edge Functions no Supabase
- [ ] Configurar variáveis de ambiente (OPENAI_API_KEY)
- [ ] Testar Edge Functions em produção
- [ ] Verificar RLS em produção

### Variáveis de Ambiente
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`

---

## 📚 Documentação

### README.md
- [ ] Descrição do projeto
- [ ] Tecnologias utilizadas (lista completa)
- [ ] Decisões técnicas detalhadas:
  - [ ] Por que estrutura de banco de dados escolhida
  - [ ] Como integração com LLM foi estruturada
  - [ ] Como multi-tenancy foi implementado
  - [ ] Desafios encontrados e soluções
- [ ] Checklist de funcionalidades implementadas
- [ ] Instruções de setup local
- [ ] Instruções de deploy
- [ ] Link da aplicação deployada
- [ ] Link do vídeo de apresentação

### Documentação no Código
- [ ] Comentários explicando decisões complexas
- [ ] JSDoc/TSDoc em funções importantes
- [ ] README atualizado durante desenvolvimento

---

## 🎬 Entrega Final

- [ ] Código completo no GitHub
- [ ] Histórico de commits organizado
- [ ] README completo e detalhado
- [ ] Aplicação deployada e acessível
- [ ] Vídeo de apresentação (10 min)
- [ ] Testes manuais dos fluxos principais
- [ ] Checklist de funcionalidades no README

---

## 📝 Notas e Observações

_Use este espaço para anotar decisões importantes, problemas encontrados, ou próximos passos:_

- 

---

## 📝 Commits Planejados

Esta seção lista os commits planejados. **Importante**: Mensagens devem variar no estilo (algumas mais formais, outras mais diretas) para parecerem naturais, não super padronizadas. Seguir o requisito de "commits frequentes e com mensagens claras", mas de forma natural.

### 1. Setup Inicial

#### `chore: setup projeto Next.js e Supabase`
**Mensagem exemplo**: "chore: setup inicial do projeto com Next.js e Supabase" ou "chore: configurar estrutura base do projeto"

**O que faz**: Estrutura base do projeto
- Next.js 14+ com TypeScript
- Pastas: app/, components/, lib/, types/
- Supabase CLI e estrutura (functions, migrations)
- Arquivos de config básicos

**Por que separado**: Setup é preparação, não funcionalidade.

#### `chore: configurar TypeScript e dependências base`
**Mensagem exemplo**: "chore: adicionar dependências principais" ou "chore: instalar libs necessárias (supabase, react-query, etc)"

**O que faz**: Instala dependências principais
- @supabase/supabase-js, @tanstack/react-query, @dnd-kit/core
- recharts, zod, react-hook-form
- Tailwind CSS
- .env.example

**Por que separado**: Dependências em um commit só.

---

### 2. Banco de Dados

#### `feat: criar migrations - tabelas base (workspaces, users)`
**Mensagem exemplo**: "feat: criar tabelas base (workspaces, users, members)" ou "feat: adicionar migrations das tabelas fundamentais"

**O que faz**: Tabelas fundamentais
- `workspaces`: empresas/equipes
- `users`: perfil do usuário (extensão auth.users)
- `workspace_members`: relação usuário-workspace-papel

**Por que separado**: Base do multi-tenancy.

#### `feat: criar migrations - tabelas de leads e funil`
**O que faz**: Estrutura de leads
- `funnel_stages`: etapas do funil (required_fields JSONB)
- `custom_fields`: campos personalizados
- `leads`: dados dos leads (custom_data JSONB)

**Por que separado**: Core do sistema.

**Nota**: JSONB para flexibilidade sem mudar schema.

#### `feat: criar migrations - tabelas de campanhas e mensagens`
**O que faz**: Estrutura de campanhas
- `campaigns`: contexto, prompt, etapa gatilho
- `generated_messages`: mensagens da IA
- `activity_logs`: histórico (diferencial)

**Por que separado**: Módulo independente.

#### `feat: implementar políticas RLS para isolamento por workspace`
**O que faz**: Segurança em nível de banco
- RLS em todas as tabelas
- Isolamento por workspace_id
- Helper para verificar membership

**Por que separado**: Segurança crítica.

#### `feat: adicionar seed de etapas padrão do funil`
**O que faz**: 7 etapas padrão
- Base, Lead Mapeado, Tentando Contato, Conexão Iniciada, Desqualificado, Qualificado, Reunião Agendada

**Por que separado**: Dados iniciais separados.

---

### 3. Autenticação e Workspaces

#### `feat: implementar autenticação com Supabase Auth`
**Mensagem exemplo**: "feat: adicionar login e cadastro com Supabase" ou "feat: implementar autenticação"

**O que faz**: Login/cadastro
- Cliente Supabase
- Página `/auth/login`
- Hook useAuth
- Middleware de proteção

**Por que separado**: Pré-requisito para tudo.

#### `feat: criar sistema de workspaces e membros`
**O que faz**: CRUD de workspaces
- API criar/listar workspaces
- API membros
- Página `/workspaces`
- Validação de membership

**Por que separado**: Base do isolamento.

#### `feat: adicionar middleware de proteção de rotas`
**O que faz**: Proteção de rotas
- Verifica sessão
- Redireciona se não autenticado
- Valida workspace

**Por que separado**: Segurança separada.

---

### 4. Funil e Etapas

#### `feat: criar sistema de etapas do funil`
**O que faz**: Implementa gestão de etapas do funil
- API para listar etapas por workspace
- Visualização de etapas
- [DIFERENCIAL] CRUD de etapas customizadas

**Por que separado**: Etapas são necessárias antes de criar leads.

#### `feat: implementar configuração de campos obrigatórios`
**O que faz**: Permite configurar campos obrigatórios por etapa
- Interface para configurar required_fields
- Armazenamento em JSONB na tabela funnel_stages
- Validação ao mover lead entre etapas

**Por que separado**: Validação de campos é uma funcionalidade complexa que merece commit próprio.

**Decisão técnica**: JSONB permite flexibilidade sem alterar schema. Campos podem ser padrão ou personalizados.

#### `feat: adicionar validação de transição entre etapas`
**O que faz**: Valida campos obrigatórios antes de mover lead
- Validação no frontend (UX imediato)
- Validação no backend (segurança)
- Mensagens de erro informativas

**Por que separado**: Validação é lógica complexa que garante qualidade dos dados.

---

### 5. Leads

#### `feat: criar CRUD de leads`
**O que faz**: Operações básicas
- Formulário criar/editar
- API CRUD
- Página `/leads/[id]`
- Listagem

**Por que separado**: Base para outras funcionalidades.

#### `feat: implementar campos personalizados`
**O que faz**: Campos customizados
- CRUD em `/settings/custom-fields`
- Tipos: text, number, date, select
- Integração no form de lead
- Armazenamento em custom_data (JSONB)

**Por que separado**: Funcionalidade importante e complexa.

#### `feat: adicionar atribuição de responsável`
**O que faz**: Atribuir usuário ao lead
- Campo assigned_to
- Filtro por responsável (diferencial)
- Visualização no card

**Por que separado**: Funcionalidade específica.

---

### 6. Kanban

#### `feat: implementar board Kanban com drag-and-drop`
**Mensagem exemplo**: "feat: criar board Kanban com drag and drop" ou "feat: adicionar visualização Kanban dos leads"

**O que faz**: Board Kanban
- Componente KanbanBoard
- Componente LeadCard
- @dnd-kit para drag-and-drop
- Leads por etapa em colunas

**Por que separado**: Interface complexa.

#### `feat: adicionar movimentação de leads entre etapas`
**O que faz**: Drag-and-drop funcional
- Movimentação
- Atualiza stage_id no backend
- Feedback visual
- Validação antes de mover

**Por que separado**: Lógica crítica.

#### `feat: implementar validação visual de campos obrigatórios`
**O que faz**: Feedback visual
- Indicador no card
- Tooltip com campos faltantes
- Bloqueio ao tentar mover

**Por que separado**: Melhora UX.

---

### 7. Campanhas

#### `feat: criar CRUD de campanhas`
**O que faz**: Implementa gestão de campanhas
- Listagem de campanhas (`/campaigns`)
- Formulário de criação/edição (`/campaigns/[id]`)
- Campos: nome, contexto, prompt, etapa gatilho, ativo/inativo
- Validação de formulário

**Por que separado**: Campanhas são módulo independente necessário para geração de mensagens.

**Decisão técnica**: Contexto e prompt separados permitem reutilização e clareza na construção de prompts.

#### `feat: implementar formulário de campanha (contexto e prompt)`
**O que faz**: Interface rica para editar contexto e prompt
- Textarea rico para contexto (pode usar markdown)
- Textarea rico para prompt com instruções
- Preview de como o prompt será construído
- Validação de campos obrigatórios

**Por que separado**: Formulário de campanha é complexo e importante para qualidade das mensagens.

---

### 8. Integração IA

#### `feat: criar Edge Function para geração de mensagens`
**O que faz**: Estrutura da função
- Busca dados do lead e campanha
- Estrutura básica (sem OpenAI ainda)

**Por que separado**: Infraestrutura primeiro.

#### `feat: implementar integração com OpenAI API`
**Mensagem exemplo**: "feat: integrar OpenAI para gerar mensagens" ou "feat: adicionar geração de mensagens com IA"

**O que faz**: Integração com OpenAI
- Construção de prompt (contexto + dados do lead)
- Chamada API
- 2-3 variações
- Tratamento básico de erros

**Por que separado**: Integração externa complexa.

**Nota**: GPT-3.5-turbo por custo/velocidade.

#### `feat: adicionar construção de prompts personalizados`
**O que faz**: Melhora prompts
- Template dinâmico
- Inserção de dados do lead
- Formatação para LLM

**Por que separado**: Lógica que afeta qualidade.

#### `feat: implementar geração automática por etapa gatilho`
**O que faz**: Geração automática
- Edge Function auto-generate
- Trigger quando stage_id muda
- Verifica campanhas ativas
- Processa em background

**Por que separado**: Funcionalidade diferencial.

**Nota**: Webhooks ou trigger. Assíncrono.

#### `feat: adicionar tratamento de erros e retry logic`
**O que faz**: Robustez
- Rate limiting
- Retry com backoff
- Fallback genérico
- Logging

**Por que separado**: Importante para produção.

---

### 9. Interface de Mensagens

#### `feat: criar componente de geração de mensagens`
**O que faz**: Interface para gerar mensagens
- Componente MessageGenerator
- Seleção de campanha
- Botão de gerar
- Estrutura básica

**Por que separado**: Componente de UI é separado da lógica de geração.

#### `feat: implementar exibição de variações e regeneração`
**O que faz**: Mostra mensagens geradas
- Exibição de 2-3 variações
- Botão de regenerar
- Loading states
- Tratamento de erros na UI

**Por que separado**: UX de exibição e regeneração é funcionalidade específica.

#### `feat: adicionar ação de envio (move para etapa)`
**O que faz**: Implementa ação de "enviar" mensagem
- Botão de copiar mensagem
- Botão de enviar (simulado)
- Ao enviar, move lead para "Tentando Contato"
- [DIFERENCIAL] Registra mensagem enviada no histórico

**Por que separado**: Ação de envio é lógica de negócio importante que afeta o funil.

---

### 10. Dashboard

#### `feat: criar dashboard com métricas básicas`
**O que faz**: Dashboard inicial
- Página `/dashboard`
- Total de leads
- Leads por etapa (gráfico)
- Layout responsivo

**Por que separado**: Módulo independente.

#### `feat: adicionar gráficos de leads por etapa`
**O que faz**: Visualizações
- Gráfico barras/pizza
- recharts

**Por que separado**: Funcionalidade específica.

#### `feat: implementar métricas avançadas (diferenciais)`
**O que faz**: Métricas extras
- Taxa de conversão
- Leads por período
- Mensagens por campanha

**Por que separado**: Diferenciais.

---

### 11. Diferenciais

#### `feat: implementar multi-workspace para usuários`
**O que faz**: Usuário pode participar de múltiplos workspaces
- Seleção de workspace atual
- Troca de workspace
- Isolamento mantido

**Por que separado**: Multi-workspace é funcionalidade diferencial que melhora usabilidade.

#### `feat: adicionar sistema de convites e papéis`
**O que faz**: Convites e permissões
- Sistema de convites (por email)
- Papéis: admin/member
- Permissões baseadas em papéis
- Interface de gerenciamento

**Por que separado**: Convites e papéis são funcionalidades complexas de colaboração.

#### `feat: criar histórico de atividades`
**O que faz**: Log de ações
- Registro de movimentações
- Registro de mensagens enviadas
- Registro de edições
- Visualização no detalhe do lead

**Por que separado**: Histórico é funcionalidade diferencial importante para rastreabilidade.

#### `feat: implementar filtros e busca de leads`
**O que faz**: Filtros avançados
- Filtro por responsável
- Filtro por etapa
- Busca por nome/empresa
- Combinação de filtros

**Por que separado**: Filtros melhoram usabilidade mas são funcionalidade separada.

---

### 12. Deploy e Documentação

#### `chore: configurar deploy no Vercel`
**O que faz**: Setup de deploy
- Conectar repositório GitHub
- Configurar build
- Configurar variáveis de ambiente
- Deploy inicial

**Por que separado**: Deploy é etapa de infraestrutura separada do código.

#### `chore: configurar variáveis de ambiente`
**O que faz**: Configura variáveis em produção
- Variáveis no Vercel
- Variáveis no Supabase (Edge Functions)
- Documentação de variáveis necessárias

**Por que separado**: Configuração de ambiente é crítica e deve ser documentada.

#### `docs: criar README completo com documentação`
**O que faz**: Documentação inicial
- Descrição do projeto
- Tecnologias utilizadas
- Estrutura básica

**Por que separado**: README é entregável importante. Começar cedo e ir atualizando.

#### `docs: adicionar decisões técnicas e arquitetura`
**O que faz**: Documenta decisões
- Por que estrutura de BD
- Como integração LLM
- Como multi-tenancy
- Desafios e soluções

**Por que separado**: Decisões técnicas são parte importante da documentação.

#### `docs: documentar desafios e soluções implementadas`
**O que faz**: Documenta problemas e soluções
- Cada desafio encontrado
- Solução implementada
- Alternativas consideradas

**Por que separado**: Documentar desafios mostra raciocínio e aprendizado.

#### `docs: criar checklist de funcionalidades implementadas`
**O que faz**: Checklist final
- Lista de obrigatórios implementados
- Lista de diferenciais implementados
- Status de cada funcionalidade

**Por que separado**: Checklist é requisito do documento e facilita avaliação.

---

## 💡 Dicas para Manter Tudo Natural

### Commits
- **IMPORTANTE**: Antes de fazer qualquer commit, confirmar com você a mensagem OU passar a mensagem para você fazer o commit
- **Variação no estilo**: Alguns formais ("feat: implementar..."), outros diretos ("feat: adicionar..."), alguns com contexto ("feat: criar X para Y")
- **Não super padronizado**: Evitar sempre o mesmo formato
- **Mensagens claras mas humanas**: "fix: corrigir bug no drag" > "fix: corrigir problema de arrastar leads entre etapas do funil"
- **Evitar siglas sem contexto**: "feat: adicionar RLS" > "feat: adicionar Row Level Security (RLS) para segurança"

### Código
- **Comentários quando necessário**: Não comentar o óbvio, mas explicar decisões não óbvias
- **Nomes descritivos**: `getLeadsByStage` > `getData`
- **Estrutura clara**: Mas não super complexa desnecessariamente
- **Algumas inconsistências são ok**: Não precisa ser 100% perfeito
- **Evitar siglas em comentários sem explicar**: "// RLS policy" > "// Row Level Security: garante que usuário só vê dados do workspace dele"

### Documentação
- **Tom conversacional**: "Usamos X porque..." > "A solução implementada utiliza X devido a..."
- **Linguagem simples**: "Fizemos X" ao invés de "Implementamos X", "Adicionamos Y" ao invés de "Integramos Y"
- **Explicar o porquê**: Não só o que foi feito, mas por que escolhemos assim, de forma simples
- **Evitar jargões**: Se usar um termo técnico, explicar de forma simples na primeira vez
- **Explicar siglas na primeira vez**: "RLS (Row Level Security)" na primeira menção, depois pode usar só RLS
- **Escrever como se estivesse explicando para alguém**: Não precisa ser super formal ou técnico

### Termos Técnicos Comuns (e como explicar)
- **RLS** = Row Level Security (segurança em nível de linha do banco de dados)
- **API** = Interface de Programação de Aplicações (como o sistema se comunica com outros sistemas)
- **CRUD** = Create, Read, Update, Delete (criar, ler, atualizar, deletar)
- **JSONB** = JSON Binary (formato de dados flexível no PostgreSQL)
- **Edge Function** = Função que roda no servidor (backend)
- **Middleware** = Código que roda entre a requisição e a resposta
- **Hook** = Função reutilizável no React
- **Query** = Consulta ao banco de dados
- **Migration** = Mudança na estrutura do banco de dados
- **Seed** = Dados iniciais para popular o banco

### Geral - Regra de Ouro
- **Se você não conseguir explicar em uma call/vídeo, não usar ou explicar primeiro**
- **Linguagem do dia a dia**: Escrever como você falaria, não como um manual técnico
- **Se não entender algo**: Perguntar ou simplificar
- **Priorizar clareza**: Melhor código simples e claro que complexo e "perfeito"
- **Natural > Perfeito**: Pequenas imperfeições são humanas
- **Pensar antes de escrever**: "Eu conseguiria explicar isso para alguém?" Se não, simplificar

---

## 🔄 Próximos Passos

_Quando retomar o trabalho, começar por aqui:_

1. 
2. 
3. 

