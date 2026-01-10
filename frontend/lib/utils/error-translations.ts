// Mapeamento de mensagens de erro do Supabase e sistema para português
const ERROR_TRANSLATIONS: Record<string, string> = {
  // Erros de autenticação do Supabase
  'For security purposes, you can only request this after 15 seconds.':
    'Por segurança, você só pode fazer esta solicitação após 15 segundos.',
  'Invalid login credentials': 'Credenciais inválidas',
  'Email not confirmed': 'Email não confirmado',
  'User already registered': 'Usuário já cadastrado',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'Signup is disabled': 'Cadastro desabilitado',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
  'User not found': 'Usuário não encontrado',
  'Invalid email': 'Email inválido',
  'Email already exists': 'Este email já está cadastrado',
  'Weak password': 'Senha muito fraca. Use uma senha mais forte.',
  'Token has expired or is invalid': 'Token expirado ou inválido',
  'Unable to validate email address: invalid format': 'Formato de email inválido',
  
  // Erros genéricos de rede/sistema
  'Network request failed': 'Falha na conexão. Verifique sua internet.',
  'Failed to fetch': 'Erro ao buscar dados',
  'NetworkError when attempting to fetch resource': 'Erro de conexão. Tente novamente.',
  
  // Erros de permissão
  'new row violates row-level security policy': 'Você não tem permissão para realizar esta ação',
  'permission denied': 'Permissão negada',
  'JWT expired': 'Sessão expirada. Faça login novamente.',
  
  // Erros de validação
  'null value in column': 'Campo obrigatório não preenchido',
  'duplicate key value violates unique constraint': 'Este registro já existe',
  
  // Erros de Edge Functions
  'Function not found': 'Função não encontrada',
  'Edge Function returned an error': 'Erro ao processar solicitação',
}

// Mensagens parciais para busca (quando a mensagem pode variar)
const PARTIAL_TRANSLATIONS: Array<{ pattern: RegExp; translation: string }> = [
  {
    pattern: /after (\d+) seconds?/i,
    translation: 'Por segurança, aguarde alguns segundos antes de tentar novamente.',
  },
  {
    pattern: /rate limit/i,
    translation: 'Muitas tentativas. Aguarde alguns minutos.',
  },
  {
    pattern: /not found/i,
    translation: 'Registro não encontrado',
  },
  {
    pattern: /unauthorized/i,
    translation: 'Você não tem permissão para realizar esta ação',
  },
  {
    pattern: /forbidden/i,
    translation: 'Acesso negado',
  },
  {
    pattern: /timeout/i,
    translation: 'Tempo de espera esgotado. Tente novamente.',
  },
  {
    pattern: /network/i,
    translation: 'Erro de conexão. Verifique sua internet.',
  },
]

/**
 * Traduz mensagens de erro do Supabase e sistema para português
 * @param error - Erro do Supabase, string ou null/undefined
 * @returns Mensagem traduzida em português
 */
export function translateError(
  error: Error | string | null | undefined
): string {
  if (!error) {
    return 'Erro desconhecido'
  }

  const message =
    typeof error === 'string' ? error : error.message || 'Erro desconhecido'

  if (!message) {
    return 'Ocorreu um erro. Tente novamente.'
  }

  // Buscar tradução exata
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message]
  }

  // Buscar tradução parcial usando regex
  for (const { pattern, translation } of PARTIAL_TRANSLATIONS) {
    if (pattern.test(message)) {
      return translation
    }
  }

  // Buscar tradução parcial por substring (case-insensitive)
  const messageLower = message.toLowerCase()
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (messageLower.includes(key.toLowerCase()) || key.toLowerCase().includes(messageLower)) {
      return translation
    }
  }

  // Fallback: retornar mensagem original ou genérica
  return message || 'Ocorreu um erro. Tente novamente.'
}
