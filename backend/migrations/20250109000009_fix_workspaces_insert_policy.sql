-- Garantir que a política de INSERT para workspaces está correta
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Usuários podem criar workspaces" ON public.workspaces;

-- Criar política que permite qualquer usuário autenticado criar workspace
CREATE POLICY "Usuários podem criar workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Verificar se RLS está habilitado
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
