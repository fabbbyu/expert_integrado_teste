-- Função para criar etapas padrão quando um workspace é criado
CREATE OR REPLACE FUNCTION public.create_default_stages()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.funnel_stages (workspace_id, name, "order", required_fields)
    VALUES
        (NEW.id, 'Base', 1, '[]'::jsonb),
        (NEW.id, 'Lead Mapeado', 2, '["name", "company"]'::jsonb),
        (NEW.id, 'Tentando Contato', 3, '["name", "email", "phone"]'::jsonb),
        (NEW.id, 'Conexão Iniciada', 4, '[]'::jsonb),
        (NEW.id, 'Desqualificado', 5, '[]'::jsonb),
        (NEW.id, 'Qualificado', 6, '[]'::jsonb),
        (NEW.id, 'Reunião Agendada', 7, '[]'::jsonb);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar etapas padrão automaticamente
CREATE TRIGGER create_default_stages_trigger
    AFTER INSERT ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_stages();

