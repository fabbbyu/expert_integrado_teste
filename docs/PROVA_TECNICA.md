# Prova Técnica — Desenvolvedor Vibe Coding Full Stack

## Sobre este desafio

Este desafio tem como objetivo avaliar suas habilidades em desenvolvimento full stack utilizando ferramentas de desenvolvimento assistido por IA (Vibe Coding). Queremos entender como você estrutura soluções, toma decisões técnicas e utiliza as ferramentas modernas de desenvolvimento.
**Importante:** Não existe uma única solução correta. Valorizamos sua capacidade de propor uma arquitetura adequada, fazer escolhas técnicas justificadas e entregar um produto funcional.

* * *
## O Desafio: SDR CRM com Gerador de Mensagens IA

Você deve desenvolver um **Mini CRM voltado para equipes de Pré-Vendas (SDR)** com funcionalidades de geração de mensagens personalizadas utilizando Inteligência Artificial.
### Contexto de Negócio
Equipes de SDR (Sales Development Representatives) precisam gerenciar leads e realizar abordagens personalizadas em escala. O sistema deve permitir:
*   Organizar leads em um funil de pré-vendas
*   Criar campanhas de abordagem com contextos específicos (ex: Black Friday, lançamento de produto)
*   Gerar mensagens personalizadas usando IA, considerando os dados de cada lead

* * *
## Requisitos Funcionais
### 1\. Autenticação e Workspaces
*   Sistema de cadastro e login de usuários
*   Cada usuário deve poder criar um **workspace** (representa uma empresa/equipe)
*   Os dados (leads, campanhas, configurações) devem ser isolados por workspace
*   Implementar controle de acesso básico para que usuários só vejam dados do seu workspace

### 2\. Gestão de Leads
*   Cadastro de leads com campos padrão: nome, email, telefone, empresa, cargo, origem do lead, observações
*   **Campos personalizados:** o usuário deve poder criar campos adicionais para o workspace (ex: "Segmento", "Faturamento Anual", "Quantidade de Funcionários"). Esses campos devem estar disponíveis para todos os leads do workspace
*   **Responsável pelo lead:** deve ser possível atribuir um usuário do workspace como responsável pelo lead (o vínculo é opcional, ou seja, o lead pode ou não ter um responsável atribuído)
*   Visualização dos leads em formato **Kanban**, organizados por etapas do funil
*   Possibilidade de mover leads entre etapas (drag and drop ou outra interação)
*   Visualização e edição dos detalhes do lead

### 3\. Funil de Pré-Vendas
O sistema deve ter um funil com etapas que representam o processo de pré-vendas. Etapas padrão sugeridas:
1. **Base** — Lead recém cadastrado, sem tratamento
2. **Lead Mapeado** — Informações do lead preenchidas/enriquecidas
3. **Tentando Contato** — Em processo de abordagem
4. **Conexão Iniciada** — Primeiro contato realizado
5. **Desqualificado** — Lead não tem fit ou não tem interesse
6. **Qualificado** — Lead com potencial confirmado
7. **Reunião Agendada** — Próximo passo definido com o lead
O candidato pode propor variações se fizer sentido para a solução.

### 4\. Campanhas e Geração de Mensagens com IA
Este é o módulo principal de integração com LLM.

#### 4.1 Criação de Campanhas
O usuário deve poder criar campanhas de abordagem com os seguintes campos:
*   **Nome da campanha** — identificação da campanha (ex: "Black Friday 2024", "Lançamento Produto X")
*   **Contexto** — informações de base para a geração das mensagens:
    *   Descrição da campanha/oferta
    *   Informações sobre o produto ou serviço
    *   Informações sobre a empresa (se necessário)
    *   Período ou condições da oferta
    *   Outras informações relevantes que a IA precisa saber para gerar mensagens adequadas
*   **Prompt de geração** — instruções específicas para a IA gerar as mensagens:
    *   Definição da persona/personagem que está escrevendo
    *   Tom de voz desejado (formal, informal, consultivo, etc.)
    *   Formato e tamanho da mensagem
    *   Exemplos de mensagens (se desejado)
    *   Referência aos campos do lead que devem ser utilizados (campos padrão e personalizados)
    *   Outras instruções de estilo e abordagem
*   **Etapa gatilho (diferencial)** — ver seção 4.3

#### 4.2 Geração de Mensagens
Ao acessar um lead, o usuário deve poder:
1. Selecionar uma campanha ativa
2. Gerar sugestões de mensagens personalizadas (recomendado: 2 a 3 variações)
3. As mensagens devem ser geradas considerando:
    *   O **contexto** da campanha (informações da oferta/produto)
    *   O **prompt** da campanha (instruções de estilo e formato)
    *   Os **dados do lead** (campos padrão e personalizados)
4. Visualizar as opções geradas
5. **Regenerar mensagens** — o usuário pode gerar novas sugestões a qualquer momento (ex: após atualizar dados do lead ou ajustar a campanha)
6. Copiar a mensagem escolhida ou clicar em "Enviar" (simulado)
**Ação de envio:** Ao clicar para enviar a mensagem (mesmo que simulado), o sistema deve automaticamente mover o lead para a etapa **"Tentando Contato"**, registrando que uma abordagem foi iniciada.

#### 4.3 Geração Automática por Etapa Gatilho (diferencial)
Este é um recurso avançado que automatiza a geração de mensagens.

**Como funciona:**
Na configuração da campanha, o usuário pode vincular a campanha a uma **etapa gatilho** do funil. Quando essa configuração está ativa:
*   Sempre que um lead for **movido para a etapa gatilho**, ou
*   Sempre que um lead for **criado diretamente na etapa gatilho**
O sistema deve **gerar automaticamente** as sugestões de mensagens para aquele lead, utilizando o contexto e prompt da campanha vinculada.

**Exemplo de uso:**
1. Usuário cria a campanha "Black Friday 2024"
2. Configura a etapa gatilho como "Lead Mapeado"
3. Quando um lead é movido para "Lead Mapeado" (ou criado nessa etapa), significa que suas informações já estão preenchidas
4. O sistema gera automaticamente as mensagens personalizadas em background
5. Quando o usuário acessar o lead, as mensagens já estarão disponíveis para visualização e envio

**Comportamento esperado:**
*   A geração pode ocorrer em background (processamento assíncrono)
*   As mensagens geradas ficam salvas/associadas ao lead
*   O usuário pode visualizar as mensagens pré-geradas ao acessar o lead
*   O usuário ainda pode optar por regenerar novas opções se desejar

**Observação:** Pode haver mais de uma campanha ativa com a mesma etapa gatilho. Nesse caso, o sistema pode gerar mensagens para todas as campanhas vinculadas, ou o candidato pode propor uma solução alternativa (ex: permitir apenas uma campanha por etapa gatilho).

### 5\. Regras de Transição entre Etapas
O sistema deve permitir configurar **campos obrigatórios** para que um lead possa entrar em determinadas etapas do funil.

**Como funciona:**
*   Na configuração do funil (ou de cada etapa), o usuário define quais campos são obrigatórios para aquela etapa
*   Quando alguém tentar mover um lead para uma etapa, o sistema valida se os campos obrigatórios estão preenchidos
*   Se algum campo obrigatório estiver vazio, o sistema impede a movimentação e informa quais campos precisam ser preenchidos

**Exemplo de uso:**
Para a etapa "Lead Mapeado", o usuário configura como obrigatórios:
*   Nome
*   Empresa
*   Telefone
*   Cargo
Se tentar mover um lead que não tem o campo "Cargo" preenchido, o sistema bloqueia e exibe uma mensagem indicando o campo faltante.

**Por que isso é importante:**
Essa configuração garante a qualidade dos dados antes da geração de mensagens. Se a campanha está configurada com gatilho na etapa "Lead Mapeado", o sistema terá certeza de que os campos necessários estão preenchidos para gerar mensagens personalizadas de qualidade.

**Observação:** A configuração de campos obrigatórios deve considerar tanto os campos padrão quanto os campos personalizados criados pelo usuário.

### 6\. Dashboard
*   Visão geral com métricas básicas do workspace:
    *   Quantidade de leads por etapa do funil
    *   Total de leads cadastrados
    *   Outras métricas que você considerar relevantes
* * *
## Requisitos Técnicos Obrigatórios
### Stack Tecnológica

| Camada | Requisito |
| ---| --- |
| Frontend | Desenvolvido utilizando plataforma de Vibe Coding (Lovable, [Bolt.new](http://Bolt.new), v0, Replit, ou similar) |
| Backend | Supabase Edge Functions (TypeScript/JavaScript) |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Integração IA | API de LLM à sua escolha (OpenAI, Google AI, Anthropic, ou outra) |
| Versionamento | Git + GitHub (repositório público ou privado com acesso) |

### Boas Práticas
*   Código organizado e legível
*   Commits com mensagens descritivas
*   Tratamento básico de erros
*   Variáveis de ambiente para chaves sensíveis (API keys)
* * *
## Requisitos Diferenciais (não obrigatórios)
Os itens abaixo não são obrigatórios, mas serão considerados positivamente na avaliação:
*   **Geração automática por gatilho:** campanha vinculada a uma etapa do funil para geração automática de mensagens (conforme seção 4.3)
*   **Edição de funil:** permitir criar novas etapas ou editar as etapas existentes do funil
*   **Multi-workspace:** usuário poder participar de múltiplos workspaces
*   **Convite de usuários:** convidar outros usuários para o workspace com diferentes papéis (admin/membro)
*   **Histórico de atividades:** log de ações no lead (movimentações, mensagens enviadas, edições)
*   **Histórico de mensagens enviadas:** registrar as mensagens que foram efetivamente "enviadas" para cada lead
*   **Filtros e busca:** filtrar leads por responsável, etapa, ou buscar por nome/empresa
*   **Métricas avançadas:** taxa de conversão entre etapas, leads por período, mensagens geradas por campanha
*   **Row Level Security (RLS):** políticas de segurança bem implementadas no Supabase
* * *
## Entregáveis
### 1\. Repositório GitHub
*   Código fonte completo do projeto
*   Histórico de commits demonstrando a evolução do desenvolvimento

### 2\. Documentação
O README deve conter:
*   **Descrição do projeto:** breve explicação do que foi desenvolvido
*   **Tecnologias utilizadas:** lista de ferramentas, frameworks e serviços usados
*   **Decisões técnicas:** explicação das principais escolhas de arquitetura e tecnologia, incluindo:
    *   Por que escolheu determinada estrutura de banco de dados
    *   Como estruturou a integração com LLM
    *   Como implementou o multi-tenancy
    *   Desafios encontrados e como resolveu
*   **Funcionalidades implementadas:** checklist do que foi entregue (obrigatórios e diferenciais)

### 3\. Aplicação Publicada
*   **Link para a aplicação funcionando (deploy)**
*   O avaliador deve conseguir acessar o link e realizar o cadastro na plataforma para testar as funcionalidades
*   Certifique-se de que a aplicação estará disponível durante o período de avaliação

### 4\. Apresentação em Vídeo (obrigatório)
*   Vídeo de **até 10 minutos** demonstrando:
    *   Visão geral da aplicação e funcionalidades implementadas
    *   Fluxo principal: cadastro → criar lead → gerar mensagem com IA
    *   Decisões técnicas relevantes
    *   Diferenciais implementados (se houver)
*   Pode usar Loom, Google Drive, YouTube (não listado), ou qualquer plataforma de sua preferência
*   O link do vídeo deve estar no README ou ser enviado junto com a entrega

* * *
## Dicas e Recomendações
1. **Priorize o MVP:** implemente primeiro todos os requisitos obrigatórios antes de partir para os diferenciais
2. **Documente suas decisões:** queremos entender seu raciocínio, não apenas ver o código funcionando
3. **Não reinvente a roda:** use bibliotecas e componentes prontos quando fizer sentido
4. **Teste sua aplicação:** antes de entregar, teste os fluxos principais como se fosse um usuário real
5. **Git:** faça commits frequentes e com mensagens claras. Queremos ver a evolução do projeto

**Boa sorte! Estamos ansiosos para ver sua solução.** 🚀