// /core/configs/auth-config.js - Configuração do Sistema de Autenticação unkayOS

/**
 * Configuração do sistema de autenticação
 * 
 * IMPORTANTE: Atualize estas configurações de acordo com seu servidor Authentik
 */
export const AUTH_CONFIG = {
    // URL base do seu servidor Authentik
    // Exemplo: 'https://auth.seudominio.com' ou 'http://localhost:9000' (para desenvolvimento)
    baseUrl: 'https://auth.reversodoavesso.online',

    // ID do cliente OAuth2 (será criado no admin do Authentik)
    clientId: 'unkayos-client',

    // URI de redirecionamento (deve ser configurado no Authentik)
    redirectUri: window.location.origin + '/auth/callback.html',

    // Escopo das permissões solicitadas
    scope: 'openid profile email',

    // Configurações adicionais
    settings: {
        // Tempo de expiração do token (em segundos)
        tokenExpiry: 3600,

        // Tempo de expiração do refresh token (em segundos)
        refreshTokenExpiry: 86400,

        // Nome da aplicação no Authentik
        appName: 'unkayOS',

        // Descrição da aplicação
        appDescription: 'Sistema Operacional Web unkayOS'
    }
};

/**
 * URLs das APIs do Authentik
 */
export const AUTHENTIK_ENDPOINTS = {
    // Endpoint de autorização
    authorize: '/application/o/authorize/',

    // Endpoint de token
    token: '/application/o/token/',

    // Endpoint de informações do usuário
    userinfo: '/application/o/userinfo/',

    // Endpoint de logout
    logout: '/application/o/logout/',

    // Endpoint de discovery (OpenID Connect)
    discovery: '/application/o/.well-known/openid_configuration/'
};

/**
 * Configurações de desenvolvimento
 */
export const DEV_CONFIG = {
    // Habilitar logs detalhados
    debug: true,

    // URL de desenvolvimento (se diferente da produção)
    devBaseUrl: 'https://auth.reversodoavesso.online',

    // Cliente de desenvolvimento
    devClientId: 'dev-unkayos-client'
};

/**
 * Função para obter a configuração baseada no ambiente
 */
export function getAuthConfig() {
    const isDevelopment = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'http:';

    if (isDevelopment && DEV_CONFIG.debug) {
        console.log('[AuthConfig] Modo de desenvolvimento detectado');
        return {
            ...AUTH_CONFIG,
            baseUrl: DEV_CONFIG.devBaseUrl,
            clientId: DEV_CONFIG.devClientId
        };
    }

    return AUTH_CONFIG;
}

/**
 * Função para validar a configuração
 */
export function validateAuthConfig(config) {
    const errors = [];

    if (!config.baseUrl) {
        errors.push('baseUrl não configurada');
    }

    if (!config.clientId) {
        errors.push('clientId não configurado');
    }

    if (!config.redirectUri) {
        errors.push('redirectUri não configurada');
    }

    if (errors.length > 0) {
        console.error('[AuthConfig] Erros de configuração:', errors);
        return false;
    }

    console.log('[AuthConfig] Configuração válida:', config);
    return true;
} 