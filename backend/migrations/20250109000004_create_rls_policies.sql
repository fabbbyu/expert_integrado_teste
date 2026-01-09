-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar se usuário é membro do workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para workspaces
CREATE POLICY "Usuários só veem workspaces onde são membros"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id));

CREATE POLICY "Usuários podem criar workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para workspace_members
CREATE POLICY "Usuários veem membros dos workspaces onde participam"
    ON public.workspace_members FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins podem adicionar membros"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_members.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Políticas para users
CREATE POLICY "Usuários veem perfis de membros dos mesmos workspaces"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm1
            JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
            WHERE wm1.user_id = auth.uid()
            AND wm2.user_id = users.id
        )
    );

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para funnel_stages
CREATE POLICY "Usuários veem etapas dos workspaces onde são membros"
    ON public.funnel_stages FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem criar etapas"
    ON public.funnel_stages FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Políticas para custom_fields
CREATE POLICY "Usuários veem campos dos workspaces onde são membros"
    ON public.custom_fields FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem criar campos"
    ON public.custom_fields FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Políticas para leads
CREATE POLICY "Usuários veem leads dos workspaces onde são membros"
    ON public.leads FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem criar leads"
    ON public.leads FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem atualizar leads"
    ON public.leads FOR UPDATE
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem deletar leads"
    ON public.leads FOR DELETE
    USING (public.is_workspace_member(workspace_id));

-- Políticas para campaigns
CREATE POLICY "Usuários veem campanhas dos workspaces onde são membros"
    ON public.campaigns FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem criar campanhas"
    ON public.campaigns FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Membros podem atualizar campanhas"
    ON public.campaigns FOR UPDATE
    USING (public.is_workspace_member(workspace_id));

-- Políticas para generated_messages
CREATE POLICY "Usuários veem mensagens dos leads dos workspaces onde são membros"
    ON public.generated_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = generated_messages.lead_id
            AND public.is_workspace_member(leads.workspace_id)
        )
    );

CREATE POLICY "Membros podem criar mensagens"
    ON public.generated_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = generated_messages.lead_id
            AND public.is_workspace_member(leads.workspace_id)
        )
    );

-- Políticas para activity_logs
CREATE POLICY "Usuários veem logs dos leads dos workspaces onde são membros"
    ON public.activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = activity_logs.lead_id
            AND public.is_workspace_member(leads.workspace_id)
        )
    );

CREATE POLICY "Membros podem criar logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = activity_logs.lead_id
            AND public.is_workspace_member(leads.workspace_id)
        )
    );

