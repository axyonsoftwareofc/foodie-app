-- ============================================================================
-- Supabase Custom Access Token Hook (versão resiliente)
-- Injeta app_metadata.role no JWT a partir da tabela profiles
-- ============================================================================

-- Passo 1: Remover hook antigo se existir (vai no Dashboard → Authentication → Hooks e remove)
-- Depois executar este SQL completo no SQL Editor

-- Passo 2: Criar a função com proteção contra edge cases
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
    -- Proteção: se não tem user_id no evento, retorna sem modificar
    IF event->>'user_id' IS NULL THEN
        RETURN event;
    END IF;

    BEGIN
        user_id := (event->>'user_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- UUID inválido, retorna sem modificar
        RETURN event;
    END;

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

-- Passo 3: Conceder permissões
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;

-- ============================================================================
-- Passo 4: Configurar o Hook no Dashboard
-- Vá em: Supabase Dashboard → Authentication → Hooks
-- Clique "Add Hook"
--   Schema: public
--   Function name: custom_access_token_hook
--   Hook: Custom Access Token
-- ============================================================================
