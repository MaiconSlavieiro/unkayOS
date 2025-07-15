// /core/AuthSystem.js - Sistema de Autenticação unkayOS

import { AUTHENTIK_ENDPOINTS, getAuthConfig, validateAuthConfig } from './configs/auth-config.js';
import { generateCodeVerifier, generateCodeChallenge } from './utils/generateCodeVerifier.js';


/**
 * Sistema de Autenticação unkayOS
 * Gerencia autenticação SSO com Authentik e fornece APIs para outras aplicações
 */
export class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authToken = null;
        this.refreshToken = null;
        
        // Carrega configuração do arquivo de configuração
        this.authentikConfig = getAuthConfig();
        
        // Valida a configuração
        if (!validateAuthConfig(this.authentikConfig)) {
            console.error('[AuthSystem] Configuração inválida. Verifique o arquivo auth-config.js');
        }
        
        this.eventListeners = new Map();
        this.init();
    }

    /**
     * Inicializa o sistema de autenticação
     */
    async init() {
        // Verifica se há tokens salvos
        this.loadStoredTokens();
        
        // Se há token, valida ele
        if (this.authToken) {
            await this.validateToken();
        }
        
        // Configura listener para mensagens de autenticação
        this.setupMessageListener();
        
        console.log('[AuthSystem] Sistema de autenticação inicializado');
    }

    /**
     * Carrega tokens salvos no localStorage
     */
    loadStoredTokens() {
        try {
            this.authToken = localStorage.getItem('unkayos_auth_token');
            this.refreshToken = localStorage.getItem('unkayos_refresh_token');
            const userData = localStorage.getItem('unkayos_user_data');
            
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
            }
        } catch (error) {
            console.error('[AuthSystem] Erro ao carregar tokens salvos:', error);
            this.clearStoredTokens();
        }
    }

    /**
     * Salva tokens no localStorage
     */
    saveTokens(token, refreshToken, userData) {
        try {
            localStorage.setItem('unkayos_auth_token', token);
            localStorage.setItem('unkayos_refresh_token', refreshToken);
            localStorage.setItem('unkayos_user_data', JSON.stringify(userData));
        } catch (error) {
            console.error('[AuthSystem] Erro ao salvar tokens:', error);
        }
    }

    /**
     * Limpa tokens salvos
     */
    clearStoredTokens() {
        localStorage.removeItem('unkayos_auth_token');
        localStorage.removeItem('unkayos_refresh_token');
        localStorage.removeItem('unkayos_user_data');
    }

    /**
     * Inicia o processo de login SSO
     */
    async login() {
        // Gera code_verifier e code_challenge (PKCE)
        const codeVerifier = generateCodeVerifier();
        localStorage.setItem('unkayos_code_verifier', codeVerifier);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        const state = this.generateState();
        localStorage.setItem('unkayos_oauth_state', state);

        const authUrl = new URL(AUTHENTIK_ENDPOINTS.authorize, this.authentikConfig.baseUrl);
        authUrl.searchParams.set('client_id', this.authentikConfig.clientId);
        authUrl.searchParams.set('redirect_uri', this.authentikConfig.redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', this.authentikConfig.scope);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        // Abre a janela de autenticação
        const authWindow = window.open(
            authUrl.toString(),
            'unkayos_auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Salva referência da janela para fechar depois
        this.authWindow = authWindow;

        console.log('[AuthSystem] Redirecionando para autenticação SSO (PKCE):', authUrl.toString());
    }

    /**
     * Processa o callback de autenticação
     */
    async handleAuthCallback(code, state) {
        try {
            // Troca o código por tokens
            const tokenResponse = await this.exchangeCodeForTokens(code);
            
            if (tokenResponse.access_token) {
                this.authToken = tokenResponse.access_token;
                this.refreshToken = tokenResponse.refresh_token;
                
                // Obtém informações do usuário
                const userInfo = await this.getUserInfo();
                this.currentUser = userInfo;
                this.isAuthenticated = true;
                
                // Salva tokens
                this.saveTokens(this.authToken, this.refreshToken, this.currentUser);
                
                // Emite evento de login
                this.emit('login', this.currentUser);
                // Emite evento de mudança de estado
                this.emit('change', this.currentUser);
                
                console.log('[AuthSystem] Login realizado com sucesso:', this.currentUser);
                return true;
            }
        } catch (error) {
            console.error('[AuthSystem] Erro no callback de autenticação:', error);
            this.emit('login_error', error);
            return false;
        }
    }

    /**
     * Troca código de autorização por tokens
     */
    async exchangeCodeForTokens(code) {
        const tokenUrl = new URL(AUTHENTIK_ENDPOINTS.token, this.authentikConfig.baseUrl);

        // Recupera o code_verifier salvo
        const codeVerifier = localStorage.getItem('unkayos_code_verifier');
        if (!codeVerifier) {
            throw new Error('Code verifier PKCE não encontrado no localStorage.');
        }
        // Remove após uso
        localStorage.removeItem('unkayos_code_verifier');

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.authentikConfig.clientId,
            redirect_uri: this.authentikConfig.redirectUri,
            code: code,
            code_verifier: codeVerifier
        });

        const response = await fetch(tokenUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na troca de tokens: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Obtém informações do usuário autenticado
     */
    async getUserInfo() {
        if (!this.authToken) {
            throw new Error('Token de acesso não disponível');
        }
        
        const userInfoUrl = new URL(AUTHENTIK_ENDPOINTS.userinfo, this.authentikConfig.baseUrl);
        
        const response = await fetch(userInfoUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao obter informações do usuário: ${response.status} - ${errorText}`);
        }
        
        return await response.json();
    }

    /**
     * Valida o token atual
     */
    async validateToken() {
        try {
            const userInfo = await this.getUserInfo();
            this.currentUser = userInfo;
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.warn('[AuthSystem] Token inválido, tentando refresh:', error);
            return await this.refreshAccessToken();
        }
    }

    /**
     * Renova o token de acesso
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return false;
        }
        
        try {
            const tokenUrl = new URL(AUTHENTIK_ENDPOINTS.token, this.authentikConfig.baseUrl);
            
            const response = await fetch(tokenUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: this.authentikConfig.clientId,
                    refresh_token: this.refreshToken
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro no refresh do token: ${response.status} - ${errorText}`);
            }
            
            const tokenResponse = await response.json();
            this.authToken = tokenResponse.access_token;
            
            if (tokenResponse.refresh_token) {
                this.refreshToken = tokenResponse.refresh_token;
            }
            
            // Atualiza informações do usuário
            const userInfo = await this.getUserInfo();
            this.currentUser = userInfo;
            
            // Salva tokens atualizados
            this.saveTokens(this.authToken, this.refreshToken, this.currentUser);
            
            console.log('[AuthSystem] Token renovado com sucesso');
            return true;
        } catch (error) {
            console.error('[AuthSystem] Erro ao renovar token:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Realiza logout
     */
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authToken = null;
        this.refreshToken = null;
        
        this.clearStoredTokens();
        this.emit('logout');
        // Emite evento de mudança de estado
        this.emit('change', null);
        
        console.log('[AuthSystem] Logout realizado');
    }

    /**
     * Verifica se o usuário tem uma permissão específica
     */
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }
        
        // Verifica permissões no objeto do usuário
        const permissions = this.currentUser.permissions || [];
        return permissions.includes(permission);
    }

    /**
     * Verifica se o usuário tem um papel específico
     */
    hasRole(role) {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }
        
        // Verifica roles no objeto do usuário
        const roles = this.currentUser.roles || [];
        return roles.includes(role);
    }

    /**
     * Gera um estado aleatório para segurança
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Configura listener para mensagens de autenticação
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Verifica se a mensagem é do nosso domínio
            if (event.origin !== window.location.origin) {
                return;
            }
            
            console.log('[AuthSystem] Mensagem recebida:', event.data.type);
            
            if (event.data.type === 'AUTH_CALLBACK') {
                this.handleAuthCallback(event.data.code, event.data.state);
                
                // Fecha a janela de autenticação
                if (this.authWindow) {
                    this.authWindow.close();
                    this.authWindow = null;
                }
            } else if (event.data.type === 'AUTH_ERROR') {
                // Trata erros de autenticação
                console.error('[AuthSystem] Erro de autenticação:', event.data.error, event.data.errorDescription);
                
                // Emite evento de erro
                this.emit('login_error', {
                    error: event.data.error,
                    description: event.data.errorDescription
                });
                
                // Fecha a janela de autenticação
                if (this.authWindow) {
                    this.authWindow.close();
                    this.authWindow = null;
                }
            }
        });
    }

    /**
     * Sistema de eventos para notificar mudanças de autenticação
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove listener de evento
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emite evento
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AuthSystem] Erro no callback do evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * API pública para outras aplicações
     */
    getAPI() {
        return {
            // Estado da autenticação
            isAuthenticated: () => this.isAuthenticated,
            getCurrentUser: () => this.currentUser,
            
            // Novo método para obter o prompt do usuário
            getUserPrompt: () => {
                if (this.isAuthenticated && this.currentUser) {
                    const user = this.currentUser;
                    return `${user.preferred_username || user.nickname || 'usuário'}@reversodoavesso`;
                }
                return 'guest@reversodoavesso';
            },

            // Ações de autenticação
            login: () => this.login(),
            logout: () => this.logout(),
            
            // Verificações de permissão
            hasPermission: (permission) => this.hasPermission(permission),
            hasRole: (role) => this.hasRole(role),
            
            // Eventos
            on: (event, callback) => this.on(event, callback),
            off: (event, callback) => this.off(event, callback),
            
            // Token para requisições
            getAuthToken: () => this.authToken,
            
            // Requisição autenticada
            authenticatedRequest: async (url, options = {}) => {
                if (!this.isAuthenticated) {
                    throw new Error('Usuário não autenticado');
                }
                
                const headers = {
                    'Authorization': `Bearer ${this.authToken}`,
                    ...options.headers
                };
                
                const response = await fetch(url, {
                    ...options,
                    headers
                });
                
                // Se receber 401, tenta renovar o token
                if (response.status === 401) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        // Tenta novamente com o novo token
                        headers.Authorization = `Bearer ${this.authToken}`;
                        return await fetch(url, {
                            ...options,
                            headers
                        });
                    }
                }
                
                return response;
            }
        };
    }
} 