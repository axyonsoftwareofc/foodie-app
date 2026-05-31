-- ============================================================================
-- Supabase Custom Access Token Hook
-- Injeta app_metadata.role no JWT a partir da tabela profiles
-- Executar no SQL Editor do Supabase: https://supabase.com/dashboard/project/_/sql/new
-- ============================================================================

-- Passo 1: Criar a funcao que sera chamada no evento de criacao de JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    claims jsonb;
    user_role text;
    user_id uuid;
BEGIN
    -- Extrai o user_id do evento
    user_id := (event->>'user_id')::uuid;

    -- Busca a role na tabela profiles
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;

    -- Se nao existir profile, assume CLIENTE
    IF user_role IS NULL THEN
        user_role := 'CLIENTE';
    END IF;

    -- Injeta a role no app_metadata do JWT
    claims := event->'claims';
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- Passo 2: Conceder permissoes para o Supabase Auth
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Passo 3: Habilitar a funcao como hook de JWT
-- Va em Supabase Dashboard → Authentication → Hooks
-- Selecione "Custom Access Token" e aponte para:
--   Schema: public
--   Function name: custom_access_token_hook
--   Hook: auth.jwt()

-- ============================================================================
-- Para invalidar sessoes quando um admin alterar a role de um usuario,
-- chame esta funcao via Server Action ou API Route:
--
--   await supabaseAdmin.auth.admin.signOut(userId)
--
-- Isso forca o usuario a fazer re-login, gerando um JWT novo com a role
-- atualizada.
-- ============================================================================
