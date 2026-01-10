-- Criar função que permite criar workspace bypassando RLS temporariamente
-- Esta é uma solução alternativa caso a política RLS não esteja funcionando

CREATE OR REPLACE FUNCTION public.create_workspace(workspace_name TEXT)
RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Criar workspace (SECURITY DEFINER bypassa RLS)
    INSERT INTO public.workspaces (name)
    VALUES (workspace_name)
    RETURNING id INTO new_workspace_id;
    
    -- Adicionar criador como admin
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, current_user_id, 'admin');
    
    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função pode ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT) TO authenticated;
