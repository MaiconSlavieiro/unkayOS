// apps/browser/main.js - v1.0.3

import { BaseApp } from '../../core/BaseApp.js';
import eventBus from '../../core/eventBus.js';
// Exemplo: para reagir a eventos globais, use eventBus.on('app:started', ...)

/**
 * Classe para o aplicativo TheOrb, estendendo BaseApp.
 * Gerencia a interface e a lógica do navegador web com restrições de domínio.
 */
export default class TheOrbApp extends BaseApp {
    /**
     * Construtor do TheOrbApp.
     * @param {AppCore} appCoreInstance - A instância do AppCore.
     * @param {object} standardAPIs - APIs padrão fornecidas pelo sistema.
     */
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);

        // Referências aos elementos DOM do browser
        this.browserAppElement = null; // O elemento host do conteúdo do app (div.app__content)
        this.urlInput = null;
        this.goBtn = null;
        this.backBtn = null;
        this.forwardBtn = null;
        this.reloadBtn = null;
        this.homeBtn = null;
        this.newTabBtn = null;
        this.bookmarksBtn = null;
        this.tabsContainer = null;
        this.contentArea = null;

        // Estado do browser
        this.tabs = [];
        this.activeTabId = null;
        this.tabCounter = 1;
        this.bookmarks = [
            { name: 'Google', url: 'https://www.google.com' },
            { name: 'GitHub', url: 'https://www.github.com' },
            { name: 'Wikipedia', url: 'https://www.wikipedia.org' }
        ];

        // Allowlist de domínios permitidos (vazia por padrão)
        this.allowedDomains = [
            // Domínios internos do sistema (mesmo domínio)
            window.location.hostname,
            // Adicione aqui outros domínios permitidos se necessário
        ];

        // Sites que suportam OEmbed (mantido para funcionalidade extra)
        this.oembedSites = [
            'youtube.com',
            'vimeo.com',
            'twitter.com',
            'instagram.com', // Nota: Instagram OEmbed é restrito e geralmente não funciona sem autenticação
            'flickr.com',
            'soundcloud.com',
            'spotify.com',
            'github.com', // GitHub pode ter embeds para gists, etc.
            'stackoverflow.com',
            'reddit.com',
            'medium.com',
            'dev.to',
            'codepen.io',
            'jsfiddle.net',
            'replit.com'
        ];

        // Bind methods
        this.handleUrlSubmit = this.handleUrlSubmit.bind(this);
        this.handleBackClick = this.handleBackClick.bind(this);
        this.handleForwardClick = this.handleForwardClick.bind(this);
        this.handleReloadClick = this.handleReloadClick.bind(this);
        this.handleHomeClick = this.handleHomeClick.bind(this);
        this.handleNewTabClick = this.handleNewTabClick.bind(this);
        this.handleBookmarksClick = this.handleBookmarksClick.bind(this);
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleTabClose = this.handleTabClose.bind(this);
        this.navigateToUrl = this.navigateToUrl.bind(this);
        this.addToHistory = this.addToHistory.bind(this);
        this.showWelcomePage = this.showWelcomePage.bind(this);
        this.showErrorPage = this.showErrorPage.bind(this);
        this.isDomainAllowed = this.isDomainAllowed.bind(this);
        this.showBlockedPage = this.showBlockedPage.bind(this);
    }

    /**
     * Verifica se um domínio está na allowlist.
     * @param {string} url - URL para verificar.
     * @returns {boolean} True se o domínio é permitido.
     */
    isDomainAllowed(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            
            // Verifica se o domínio está na allowlist
            return this.allowedDomains.some(allowedDomain => {
                // Nenhuma dependência direta de appManager ou globals
                return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
            });
        } catch (e) {
            console.warn(`[${this.appName}] URL inválida: ${url}`);
            return false;
        }
    }

    /**
     * Mostra a página de bloqueio com mensagem engraçada.
     * @param {string} url - URL que foi bloqueada.
     */
    showBlockedPage(url) {
        this.contentArea.innerHTML = `
            <div class="blocked-page">
                <div class="blocked-content">
                    <div class="blocked-icon">
                        <span class="theorb-icon theorb-icon-blocked material-icons-outlined xlarge">block</span>
                    </div>
                    <h2>🚀 Navegador dentro do Navegador! 🚀</h2>
                    <p class="blocked-message">
                        Ei, você está tentando acessar <strong>${url}</strong> de dentro de um navegador que está dentro de outro navegador! 
                        Isso é tipo... navegadorception? 🤯
                    </p>
                    <p class="blocked-suggestion">
                        Acho que você não precisa acessar esse site por aqui, quer que eu abra em uma nova aba para você?
                    </p>
                    <div class="blocked-actions">
                        <button class="blocked-btn primary" onclick="window.open('${url}', '_blank')" title="Abrir em nova aba">
                            <span class="theorb-icon theorb-icon-action material-icons-outlined small">open_in_new</span>
                            Abrir em Nova Aba
                        </button>
                        <button class="blocked-btn" onclick="window.appManager.getAppInstance('${this.instanceId}').showWelcomePage()" title="Voltar ao início">
                            <span class="theorb-icon theorb-icon-action material-icons-outlined small">home</span>
                            Voltar ao Início
                        </button>
                    </div>
                    <div class="blocked-info">
                        <p><small>💡 Dica: O TheOrb é projetado para acessar apenas arquivos internos do sistema e domínios específicos da allowlist.</small></p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * Assume que o HTML já foi injetado no appContentRoot pelo AppWindowSystem.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] TheOrbApp.onRun() started. DOM should be ready.`);

        // O appContentRoot é o elemento de conteúdo direto (o div.app__content)
        this.browserAppElement = this.appContentRoot;

        if (!this.browserAppElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento raiz do browser (appContentRoot) não encontrado!`);
            return;
        }

        // Acessa os elementos internos do browser a partir do appContentRoot
        this.urlInput = this.browserAppElement.querySelector('#urlInput');
        this.goBtn = this.browserAppElement.querySelector('#goBtn');
        this.backBtn = this.browserAppElement.querySelector('#backBtn');
        this.forwardBtn = this.browserAppElement.querySelector('#forwardBtn');
        this.reloadBtn = this.browserAppElement.querySelector('#reloadBtn');
        this.homeBtn = this.browserAppElement.querySelector('#homeBtn');
        this.newTabBtn = this.browserAppElement.querySelector('#newTabBtn');
        this.bookmarksBtn = this.browserAppElement.querySelector('#bookmarksBtn');
        this.tabsContainer = this.browserAppElement.querySelector('#tabsContainer');
        this.contentArea = this.browserAppElement.querySelector('#contentArea');

        if (!this.urlInput || !this.goBtn || !this.tabsContainer || !this.contentArea) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Um ou mais elementos essenciais do browser não foram encontrados!`);
            return;
        }

        // Adiciona event listeners
        this.goBtn.addEventListener('click', this.handleUrlSubmit);
        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleUrlSubmit();
            }
        });
        this.backBtn.addEventListener('click', this.handleBackClick);
        this.forwardBtn.addEventListener('click', this.handleForwardClick);
        this.reloadBtn.addEventListener('click', this.handleReloadClick);
        this.homeBtn.addEventListener('click', this.handleHomeClick);
        this.newTabBtn.addEventListener('click', this.handleNewTabClick);
        this.bookmarksBtn.addEventListener('click', this.handleBookmarksClick);

        // Cria a primeira aba ao iniciar
        this.createTab();
        this.setActiveTab(this.tabs[0].id);
        this.showWelcomePage(); // Mostra a página de boas-vindas na primeira aba
    }

    /**
     * Cria uma nova aba.
     * @param {string} url - URL inicial da aba (opcional).
     * @returns {string} ID da nova aba.
     */
    createTab(url = null) {
        const tabId = `tab${this.tabCounter++}`;
        const tab = {
            id: tabId,
            url: url || '',
            title: 'Nova Aba',
            history: [],
            currentHistoryIndex: -1
        };

        this.tabs.push(tab);

        // Cria o elemento da aba
        const tabElement = document.createElement('div'); // Usar document.createElement
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tabId);
        tabElement.innerHTML = `
            <span class="tab-title">${tab.title}</span>
            <button class="tab-close" title="Fechar Aba">
                <span class="theorb-icon theorb-icon-close material-icons-outlined small">close</span>
            </button>
        `;

        // Adiciona event listeners
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.handleTabClick(tabId);
            }
        });

        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTabClose(tabId);
        });

        this.tabsContainer.appendChild(tabElement);

        // Se for a primeira aba, define como ativa
        if (this.tabs.length === 1) {
            this.setActiveTab(tabId);
        }

        return tabId;
    }

    /**
     * Define uma aba como ativa.
     * @param {string} tabId - ID da aba a ser ativada.
     */
    setActiveTab(tabId) {
        // Remove a classe active de todas as abas
        this.tabsContainer.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Adiciona a classe active à aba selecionada
        const activeTabElement = this.tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if (activeTabElement) {
            activeTabElement.classList.add('active');
        }

        this.activeTabId = tabId;
        this.updateContentArea();
        this.updateAddressBar();
        this.updateNavigationButtons();
    }

    /**
     * Atualiza a área de conteúdo baseada na aba ativa.
     */
    updateContentArea() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        if (activeTab.url) {
            this.showPageContent(activeTab.url);
        } else {
            this.showWelcomePage();
        }
    }

    /**
     * Atualiza a barra de endereços com a URL da aba ativa.
     */
    updateAddressBar() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab) {
            this.urlInput.value = activeTab.url;
        }
    }

    /**
     * Atualiza os botões de navegação baseado no histórico da aba ativa.
     */
    updateNavigationButtons() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        this.backBtn.disabled = activeTab.currentHistoryIndex <= 0;
        this.forwardBtn.disabled = activeTab.currentHistoryIndex >= activeTab.history.length - 1;
    }

    /**
     * Mostra a página de boas-vindas.
     */
    showWelcomePage() {
        this.contentArea.innerHTML = `
            <div id="welcomePage" class="welcome-page">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <span class="theorb-icon theorb-icon-welcome material-icons-outlined xlarge">public</span>
                    </div>
                    <h1>Bem-vindo ao TheOrb</h1>
                    <p>Digite um endereço na barra acima para começar a navegar.</p>
                    <div class="welcome-info">
                        <p><small>💡 O TheOrb acessa apenas arquivos internos do sistema e domínios específicos da allowlist.</small></p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Mostra o conteúdo de uma página usando OEmbed ou iframe.
     * @param {string} url - URL da página a ser exibida.
     */
    async showPageContent(url) {
        // Verifica se o domínio é permitido
        if (!this.isDomainAllowed(url)) {
            this.showBlockedPage(url);
            return;
        }

        this.contentArea.innerHTML = ''; // Limpa o conteúdo anterior
        this.showLoadingIndicator(); // Mostra indicador de carregamento

        // Tenta OEmbed primeiro se o site suporta
        if (this.supportsOEmbed(url)) {
            console.log(`[${this.appName}] Tentando OEmbed para: ${url}`);
            try {
                const oembedData = await this.fetchOEmbedData(url);
                if (oembedData) {
                    this.hideLoadingIndicator();
                    this.showOEmbedContent(url, oembedData);
                    return;
                }
            } catch (error) {
                console.warn(`[${this.appName}] OEmbed falhou, tentando iframe:`, error);
            }
        }

        // Se OEmbed não funcionou, tenta iframe
        this.showPageWithIframe(url);
    }

    /**
     * Mostra o conteúdo usando iframe.
     * @param {string} url - URL da página a ser exibida.
     */
    showPageWithIframe(url) {
        // Remove qualquer iframe existente para evitar múltiplos iframes
        this.contentArea.querySelectorAll('iframe').forEach(iframe => iframe.remove());
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = 'browser-iframe';
        iframe.title = `Página: ${url}`;
        iframe.style.display = 'none'; // Esconde até carregar
        // Não há mais timeout de carregamento
        iframe.addEventListener('load', () => {
            console.log(`[${this.appName}] Página carregada: ${url}`);
            this.hideLoadingIndicator();
            iframe.style.display = 'block';
            this.updateNavigationButtons();
        });
        iframe.addEventListener('error', () => {
            console.error(`[${this.appName}] Erro ao carregar página no iframe: ${url}`);
            this.hideLoadingIndicator();
            this.showErrorPage(url);
        });
        this.contentArea.appendChild(iframe);
    }

    /**
     * Mostra o indicador de carregamento.
     */
    showLoadingIndicator() {
        // Não há mais timeout para limpar
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Carregando página...</p>
        `;
        this.contentArea.appendChild(loadingDiv);
    }

    /**
     * Esconde o indicador de carregamento.
     */
    hideLoadingIndicator() {
        const loadingIndicator = this.contentArea.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    /**
     * Mostra uma página de erro genérica.
     * @param {string} url - URL que falhou ao carregar.
     */
    showErrorPage(url) {
        this.contentArea.innerHTML = `
            <div class="error-page">
                <div class="error-content">
                    <div class="error-icon">
                        <span class="theorb-icon theorb-icon-error material-icons-outlined large">error_outline</span>
                    </div>
                    <h2>Erro ao Carregar Página</h2>
                    <p><strong>URL:</strong> ${url}</p>
                    <p>Não foi possível carregar esta página. Verifique se a URL está correta e tente novamente.</p>
                    <div class="error-actions">
                        <button class="error-btn" onclick="window.appManager.getAppInstance('${this.instanceId}').handleReloadClick()">
                            <span class="theorb-icon theorb-icon-action material-icons-outlined small">refresh</span>
                            Tentar Novamente
                        </button>
                        <button class="error-btn" onclick="window.appManager.getAppInstance('${this.instanceId}').showWelcomePage()">
                            <span class="theorb-icon theorb-icon-action material-icons-outlined small">home</span>
                            Página Inicial
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Navega para uma URL.
     * @param {string} url - URL para navegar.
     */
    navigateToUrl(url) {
        if (!url.trim()) return;

        // Adiciona protocolo padrão se não existir
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        // Adiciona ao histórico da aba ativa
        this.addToHistory(url);

        // Atualiza a aba
        activeTab.url = url;
        activeTab.title = this.extractDomain(url); // Ou um título mais genérico se o domínio for muito longo

        // Atualiza o título da aba no DOM
        const tabElement = this.tabsContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
        if (tabElement) {
            tabElement.querySelector('.tab-title').textContent = activeTab.title;
        }

        this.updateContentArea();
        this.updateAddressBar();
        this.updateNavigationButtons();
    }

    /**
     * Extrai o domínio de uma URL.
     * @param {string} url - URL para extrair o domínio.
     * @returns {string} Domínio extraído.
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return 'Página Inválida';
        }
    }

    /**
     * Verifica se um site suporta OEmbed.
     * @param {string} url - URL para verificar.
     * @returns {boolean} True se o site suporta OEmbed.
     */
    supportsOEmbed(url) {
        const domain = this.extractDomain(url);
        return this.oembedSites.some(oembedSite =>
            domain.includes(oembedSite) || oembedSite.includes(domain)
        );
    }

    /**
     * Obtém a URL do endpoint OEmbed para um site.
     * @param {string} url - URL original.
     * @returns {string|null} URL do endpoint OEmbed ou null se não suportado.
     */
    getOEmbedEndpoint(url) {
        const domain = this.extractDomain(url);

        // Mapeamento de domínios para endpoints OEmbed
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
            return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        }
        if (domain.includes('twitter.com') || domain.includes('x.com')) {
            return `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('vimeo.com')) {
            return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('instagram.com')) {
            console.warn(`[${this.appName}] Instagram OEmbed geralmente requer autenticação. Não suportado diretamente.`);
            return null;
        }
        if (domain.includes('github.com') && url.includes('/gist.github.com/')) {
            return `https://gist.github.com/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('stackoverflow.com')) {
            return `https://stackoverflow.com/api/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('reddit.com')) {
            return `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('medium.com')) {
            return `https://medium.com/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('dev.to')) {
            return `https://dev.to/api/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('codepen.io')) {
            return `https://codepen.io/api/oembed?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('jsfiddle.net')) {
            return `https://jsfiddle.net/api/oembed/?url=${encodeURIComponent(url)}`;
        }
        if (domain.includes('replit.com')) {
            return `https://replit.com/api/oembed?url=${encodeURIComponent(url)}`;
        }

        return null;
    }

    /**
     * Busca dados OEmbed para uma URL.
     * @param {string} url - URL para buscar dados OEmbed.
     * @returns {Promise<object|null>} Dados OEmbed ou null se falhar.
     */
    async fetchOEmbedData(url) {
        try {
            const endpoint = this.getOEmbedEndpoint(url);
            if (!endpoint) {
                return null;
            }

            console.log(`[${this.appName}] Buscando OEmbed: ${endpoint}`);

            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[${this.appName}] OEmbed data:`, data);
            return data;

        } catch (error) {
            console.warn(`[${this.appName}] Erro ao buscar OEmbed:`, error);
            return null;
        }
    }

    /**
     * Mostra conteúdo OEmbed.
     * @param {string} url - URL original.
     * @param {object} oembedData - Dados OEmbed.
     */
    showOEmbedContent(url, oembedData) {
        const domain = this.extractDomain(url);
        let content = '';

        switch (oembedData.type) {
            case 'video':
                content = this.renderOEmbedVideo(oembedData);
                break;
            case 'photo':
                content = this.renderOEmbedPhoto(oembedData);
                break;
            case 'rich':
                content = this.renderOEmbedRich(oembedData);
                break;
            case 'link':
            default:
                content = this.renderOEmbedLink(oembedData);
                break;
        }

        this.contentArea.innerHTML = `
            <div class="oembed-page">
                <div class="oembed-header">
                    <div class="oembed-site-info">
                        <span class="oembed-site-name">${domain}</span>
                        <span class="oembed-badge">OEmbed</span>
                    </div>
                    <div class="oembed-actions">
                        <button class="oembed-btn" onclick="window.open('${url}', '_blank')" title="Abrir no site original">
                            <span class="theorb-icon theorb-icon-oembed material-icons-outlined small">open_in_new</span>
                        </button>
                        <button class="oembed-btn" onclick="window.appManager.getAppInstance('${this.instanceId}').showPageWithIframe('${url}')" title="Abrir em iframe">
                            <span class="theorb-icon theorb-icon-oembed material-icons-outlined small">fullscreen</span>
                        </button>
                    </div>
                </div>
                <div class="oembed-content">
                    ${content}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza conteúdo OEmbed do tipo vídeo.
     * @param {object} data - Dados OEmbed.
     * @returns {string} HTML do vídeo.
     */
    renderOEmbedVideo(data) {
        return `
            <div class="oembed-video">
                <div class="oembed-video-container">
                    ${data.html || `<div class="oembed-placeholder">Vídeo não disponível</div>`}
                </div>
                ${data.title ? `<h2 class="oembed-title">${data.title}</h2>` : ''}
                ${data.author_name ? `<p class="oembed-author">por ${data.author_name}</p>` : ''}
                ${data.description ? `<p class="oembed-description">${data.description}</p>` : ''}
            </div>
        `;
    }

    /**
     * Renderiza conteúdo OEmbed do tipo foto.
     * @param {object} data - Dados OEmbed.
     * @returns {string} HTML da foto.
     */
    renderOEmbedPhoto(data) {
        return `
            <div class="oembed-photo">
                <img src="${data.url}" alt="${data.title || 'Foto'}" class="oembed-image">
                ${data.title ? `<h2 class="oembed-title">${data.title}</h2>` : ''}
                ${data.author_name ? `<p class="oembed-author">por ${data.author_name}</p>` : ''}
            </div>
        `;
    }

    /**
     * Renderiza conteúdo OEmbed do tipo rich.
     * @param {object} data - Dados OEmbed.
     * @returns {string} HTML do conteúdo rich.
     */
    renderOEmbedRich(data) {
        return `
            <div class="oembed-rich">
                ${data.html || `<div class="oembed-placeholder">Conteúdo não disponível</div>`}
                ${data.title ? `<h2 class="oembed-title">${data.title}</h2>` : ''}
                ${data.author_name ? `<p class="oembed-author">por ${data.author_name}</p>` : ''}
                ${data.description ? `<p class="oembed-description">${data.description}</p>` : ''}
            </div>
        `;
    }

    /**
     * Renderiza conteúdo OEmbed do tipo link.
     * @param {object} data - Dados OEmbed.
     * @returns {string} HTML do link.
     */
    renderOEmbedLink(data) {
        return `
            <div class="oembed-link">
                ${data.thumbnail_url ? `<img src="${data.thumbnail_url}" alt="Thumbnail" class="oembed-thumbnail">` : ''}
                <div class="oembed-link-content">
                    ${data.title ? `<h2 class="oembed-title">${data.title}</h2>` : ''}
                    ${data.author_name ? `<p class="oembed-author">por ${data.author_name}</p>` : ''}
                    ${data.description ? `<p class="oembed-description">${data.description}</p>` : ''}
                    <a href="${data.url || data.link}" target="_blank" class="oembed-link-btn">
                        <span class="theorb-icon theorb-icon-oembed material-icons-outlined small">open_in_new</span> Visitar Página
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Adiciona uma URL ao histórico da aba ativa.
     * @param {string} url - URL a ser adicionada ao histórico.
     */
    addToHistory(url) {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        // Remove URLs futuras se navegou para uma nova URL
        activeTab.history = activeTab.history.slice(0, activeTab.currentHistoryIndex + 1);

        // Adiciona a nova URL
        activeTab.history.push(url);
        activeTab.currentHistoryIndex = activeTab.history.length - 1;
    }

    /**
     * Manipula o envio da URL.
     */
    handleUrlSubmit() {
        const url = this.urlInput.value.trim();
        if (url) {
            this.navigateToUrl(url);
        }
    }

    /**
     * Manipula o clique no botão voltar.
     */
    handleBackClick() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab || activeTab.currentHistoryIndex <= 0) return;

        activeTab.currentHistoryIndex--;
        const url = activeTab.history[activeTab.currentHistoryIndex];
        activeTab.url = url;
        activeTab.title = this.extractDomain(url);

        this.updateContentArea();
        this.updateAddressBar();
        this.updateNavigationButtons();
    }

    /**
     * Manipula o clique no botão avançar.
     */
    handleForwardClick() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab || activeTab.currentHistoryIndex >= activeTab.history.length - 1) return;

        activeTab.currentHistoryIndex++;
        const url = activeTab.history[activeTab.currentHistoryIndex];
        activeTab.url = url;
        activeTab.title = this.extractDomain(url);

        this.updateContentArea();
        this.updateAddressBar();
        this.updateNavigationButtons();
    }

    /**
     * Manipula o clique no botão recarregar.
     */
    handleReloadClick() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab || !activeTab.url) return; // Só recarrega se houver uma URL

        this.navigateToUrl(activeTab.url); // Navega para a URL atual novamente
    }

    /**
     * Manipula o clique no botão home.
     */
    handleHomeClick() {
        this.showWelcomePage();
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab) {
            activeTab.url = ''; // Limpa a URL da aba ativa
            activeTab.title = 'Nova Aba';
            activeTab.history = []; // Limpa o histórico da aba
            activeTab.currentHistoryIndex = -1;
            this.updateAddressBar();
            this.updateNavigationButtons();
            const tabElement = this.tabsContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
            if (tabElement) {
                tabElement.querySelector('.tab-title').textContent = activeTab.title;
            }
        }
    }

    /**
     * Manipula o clique no botão nova aba.
     */
    handleNewTabClick() {
        const newTabId = this.createTab();
        this.setActiveTab(newTabId);
        this.showWelcomePage();
    }

    /**
     * Manipula o clique no botão favoritos.
     * Implementação futura: Abrir um modal ou menu de favoritos.
     */
    handleBookmarksClick() {
        console.log(`[${this.appName}] Botão Favoritos clicado. Favoritos atuais:`, this.bookmarks);
        // Implementação futura: Mostrar uma lista de favoritos em um modal
        alert('Funcionalidade de Favoritos em desenvolvimento!');
    }

    /**
     * Manipula o clique em uma aba.
     * @param {string} tabId - ID da aba clicada.
     */
    handleTabClick(tabId) {
        if (this.activeTabId !== tabId) {
            this.setActiveTab(tabId);
        }
    }

    /**
     * Manipula o fechamento de uma aba.
     * @param {string} tabId - ID da aba a ser fechada.
     */
    handleTabClose(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        // Remove o elemento DOM da aba
        const tabElement = this.tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // Remove a aba do array
        this.tabs.splice(tabIndex, 1);

        if (this.tabs.length === 0) {
            // Se não há mais abas, cria uma nova e mostra a página de boas-vindas
            this.createTab();
            this.setActiveTab(this.tabs[0].id);
            this.showWelcomePage();
        } else if (this.activeTabId === tabId) {
            // Se a aba fechada era a ativa, ativa a próxima ou a anterior
            const newActiveTabIndex = Math.min(tabIndex, this.tabs.length - 1);
            this.setActiveTab(this.tabs[newActiveTabIndex].id);
        } else {
            // Se a aba fechada não era a ativa, apenas atualiza a UI
            this.updateNavigationButtons();
        }
    }

    /**
     * Método chamado quando o aplicativo é encerrado.
     * Limpa event listeners e referências.
     */
    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do TheOrbApp executado.`);
        // Remove event listeners
        if (this.goBtn) this.goBtn.removeEventListener('click', this.handleUrlSubmit);
        if (this.urlInput) this.urlInput.removeEventListener('keydown', this.handleUrlSubmit);
        if (this.backBtn) this.backBtn.removeEventListener('click', this.handleBackClick);
        if (this.forwardBtn) this.forwardBtn.removeEventListener('click', this.handleForwardClick);
        if (this.reloadBtn) this.reloadBtn.removeEventListener('click', this.handleReloadClick);
        if (this.homeBtn) this.homeBtn.removeEventListener('click', this.handleHomeClick);
        if (this.newTabBtn) this.newTabBtn.removeEventListener('click', this.handleNewTabClick);
        if (this.bookmarksBtn) this.bookmarksBtn.removeEventListener('click', this.handleBookmarksClick);

        // Limpar referências DOM
        this.browserAppElement = null;
        this.urlInput = null;
        this.goBtn = null;
        this.backBtn = null;
        this.forwardBtn = null;
        this.reloadBtn = null;
        this.homeBtn = null;
        this.newTabBtn = null;
        this.bookmarksBtn = null;
        this.tabsContainer = null;
        this.contentArea = null;

        // Limpar arrays de estado
        this.tabs = [];
        this.activeTabId = null;
        this.bookmarks = [];
    }
}
