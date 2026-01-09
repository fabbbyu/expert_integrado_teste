-- Criar tabela de convites para workspaces
CREATE TABLE IF NOT EXISTS public.workspace_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);

-- Política RLS para convites
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Admins podem ver convites do workspace
CREATE POLICY "Admins veem convites do workspace"
    ON public.workspace_invites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_invites.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins podem criar convites
CREATE POLICY "Admins podem criar convites"
    ON public.workspace_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_invites.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Qualquer usuário autenticado pode ver convites pendentes (para aceitar)
CREATE POLICY "Usuários podem ver convites pendentes"
    ON public.workspace_invites FOR SELECT
    USING (accepted_at IS NULL AND expires_at > NOW());

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT)
RETURNS UUID AS $$
DECLARE
    v_workspace_id UUID;
    v_user_id UUID;
    v_role TEXT;
BEGIN
    -- Buscar convite válido
    SELECT workspace_id, role INTO v_workspace_id, v_role
    FROM public.workspace_invites
    WHERE token = invite_token
    AND expires_at > NOW()
    AND accepted_at IS NULL;

    IF v_workspace_id IS NULL THEN
        RAISE EXCEPTION 'Convite inválido ou expirado';
    END IF;

    v_user_id := auth.uid();

    -- Adicionar usuário ao workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, v_user_id, v_role)
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    -- Marcar convite como aceito
    UPDATE public.workspace_invites
    SET accepted_at = NOW()
    WHERE token = invite_token;

    RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

