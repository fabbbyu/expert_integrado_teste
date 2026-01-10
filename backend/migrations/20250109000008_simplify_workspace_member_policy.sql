-- Solução simplificada: permitir que qualquer usuário autenticado se adicione como primeiro membro
-- OU que admins adicionem outros membros

-- Remover todas as políticas de INSERT existentes
DROP POLICY IF EXISTS "Admins podem adicionar membros" ON public.workspace_members;
DROP POLICY IF EXISTS "Usuários podem adicionar membros" ON public.workspace_members;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.can_add_first_member(UUID, UUID);

-- Criar função que verifica se workspace não tem membros (bypassa RLS)
CREATE OR REPLACE FUNCTION public.workspace_has_no_members(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    member_count INTEGER;
BEGIN
    -- SECURITY DEFINER permite bypassar RLS
    SELECT COUNT(*) INTO member_count
    FROM public.workspace_members
    WHERE workspace_id = workspace_uuid;
    
    RETURN member_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nova política: permite INSERT se:
-- 1. O usuário está se adicionando a si mesmo E workspace não tem membros
-- 2. OU o usuário já é admin do workspace
CREATE POLICY "Usuários podem adicionar membros"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        -- Caso 1: Usuário se adicionando a si mesmo E workspace não tem membros
        (
            auth.uid() = user_id
            AND public.workspace_has_no_members(workspace_id)
        )
        -- Caso 2: Usuário já é admin do workspace (pode adicionar outros)
        OR (
            EXISTS (
                SELECT 1 FROM public.workspace_members
                WHERE workspace_id = workspace_members.workspace_id
                AND user_id = auth.uid()
                AND role = 'admin'
            )
        )
    );
