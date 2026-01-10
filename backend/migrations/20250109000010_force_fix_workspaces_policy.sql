-- Forçar correção da política de INSERT para workspaces
-- Este script remove TODAS as políticas de INSERT e recria apenas a correta

-- Listar e remover TODAS as políticas de INSERT existentes (caso haja duplicatas)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'workspaces' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspaces', r.policyname);
    END LOOP;
END $$;

-- Garantir que RLS está habilitado
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Criar política que permite qualquer usuário autenticado criar workspace
-- Usando uma verificação mais explícita
CREATE POLICY "Usuários autenticados podem criar workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (
        -- Verifica se há um usuário autenticado
        auth.uid() IS NOT NULL
        AND auth.uid()::text != ''
    );

-- Verificar se a política foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspaces' 
        AND cmd = 'INSERT'
        AND policyname = 'Usuários autenticados podem criar workspaces'
    ) THEN
        RAISE EXCEPTION 'Política não foi criada corretamente';
    END IF;
END $$;
