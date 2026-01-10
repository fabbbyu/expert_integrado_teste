-- Permitir que criadores de workspace se adicionem como admin
-- Esta política permite que um usuário se adicionar como primeiro membro de um workspace

-- Criar função helper que bypassa RLS para verificar se workspace foi criado recentemente
CREATE OR REPLACE FUNCTION public.can_add_first_member(workspace_uuid UUID, member_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    workspace_exists BOOLEAN;
    has_members BOOLEAN;
    workspace_created_recently BOOLEAN;
BEGIN
    -- Verifica se o usuário está tentando se adicionar
    IF auth.uid() != member_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Usar SECURITY DEFINER para bypassar RLS e verificar diretamente
    -- Verifica se o workspace existe e foi criado recentemente
    SELECT EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE id = workspace_uuid
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) INTO workspace_created_recently;
    
    IF NOT workspace_created_recently THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se não há membros (bypassando RLS)
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_uuid
    ) INTO has_members;
    
    -- Retorna true se workspace foi criado recentemente E não tem membros
    RETURN NOT has_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem adicionar membros" ON public.workspace_members;
DROP POLICY IF EXISTS "Usuários podem adicionar membros" ON public.workspace_members;

-- Nova política: permite que usuários se adicionem como primeiro membro
-- OU que admins adicionem outros membros
CREATE POLICY "Usuários podem adicionar membros"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        -- Se está se adicionando a si mesmo E pode ser o primeiro membro (workspace recém-criado)
        public.can_add_first_member(workspace_id, user_id)
        -- OU se já é admin do workspace (pode adicionar outros)
        OR EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_members.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );
