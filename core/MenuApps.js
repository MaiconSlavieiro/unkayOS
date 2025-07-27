// core/MenuApps.js - v2.0.0 - Mobile-Friendly

import eventBus from './eventBus.js';
import { windowLayerManager } from './WindowLayerManager.js';

/**
 * Classe para gerenciar o menu de aplicativos do sistema.
 * Versão melhorada com suporte mobile e funcionalidades modernas.
 */
export class menuApps {
    constructor(desktop) {
        this.desktop = desktop;
        this.menuElement = null;
        this.searchInput = null;
        this.appsContainer = null;
        this.visibilityFlag = false;
        this.allApps = [];
        this.filteredApps = [];
        
        // Detecta se é dispositivo touch
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleSearchKeydown = this.handleSearchKeydown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    init() {
        this.menuElement = document.createElement('div');
        this.menuElement.classList.add('menu_apps');
        this.menuElement.id = 'menu_apps';
        
        // Cria estrutura do menu
        this.createMenuStructure();
        
        this.desktop.appendChild(this.menuElement);
        
        // Define z-index correto para o menu de apps
        windowLayerManager.setSystemLayer(this.menuElement, 'APPS_MENU');
        
        // Configura eventos
        this.setupEventListeners();
        
        this.loadApps();
    }

    createMenuStructure() {
        // Header com busca
        const header = document.createElement('div');
        header.classList.add('menu_apps__header');
        
        // Container para input com ícone
        const searchContainer = document.createElement('div');
        searchContainer.classList.add('menu_apps__search-container');
        
        // Ícone de busca usando Material Icons
        const searchIcon = document.createElement('span');
        searchIcon.classList.add('material-icons', 'menu_apps__search-icon');
        searchIcon.textContent = 'search';
        
        this.searchInput = document.createElement('input');
        this.searchInput.classList.add('menu_apps__search');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Buscar aplicativos...';
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(this.searchInput);
        header.appendChild(searchContainer);
        this.menuElement.appendChild(header);
        
        // Container dos apps
        this.appsContainer = document.createElement('div');
        this.appsContainer.classList.add('menu_apps__container');
        this.menuElement.appendChild(this.appsContainer);
    }

    setupEventListeners() {
        // Busca
        this.searchInput.addEventListener('input', this.handleSearchInput);
        this.searchInput.addEventListener('keydown', this.handleSearchKeydown);
        
        // Suporte a teclado
        this.menuElement.addEventListener('keydown', this.handleKeydown);
        
        // Event bus para comunicação desacoplada
        eventBus.on('menu:apps:toggle', () => {
            this.toggle();
        });
        
        eventBus.on('menu:apps:close', () => {
            this.close();
        });
        
        eventBus.on('menu:apps:cleanup', () => {
            this.remove();
        });
        
        // Fechar menu ao clicar fora (usando event delegation)
        document.addEventListener('click', this.handleOutsideClick);
    }

    loadApps() {
        // Busca a lista de apps detalhados de uma fonte global
        const appDetailsMap = window.loadedAppDetails || new Map();
        this.allApps = Array.from(appDetailsMap.values()).filter(app => !app.hidden);
        this.filteredApps = [...this.allApps];
        
        this.renderApps();
    }

    renderApps() {
        this.appsContainer.innerHTML = '';
        
        this.filteredApps.forEach((data, index) => {
            const app = document.createElement('div');
            app.classList.add('menu_apps__app');
            app.id = data.id + '-launcher';
            app.setAttribute('tabindex', '0');
            app.setAttribute('role', 'button');
            app.setAttribute('aria-label', `Abrir ${data.app_name}`);

            // Eventos de clique/touch
            const handleActivation = () => {
                eventBus.emit('app:start', { appId: data.id });
                this.close();
            };

            app.addEventListener('click', handleActivation);
            app.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivation();
                }
            });

            // Suporte a touch com feedback visual
            if (this.isTouchDevice) {
                app.addEventListener('touchstart', () => {
                    app.classList.add('touch-active');
                });
                app.addEventListener('touchend', () => {
                    app.classList.remove('touch-active');
                });
                app.addEventListener('touchcancel', () => {
                    app.classList.remove('touch-active');
                });
            }

            const appIcon = document.createElement('img');
            appIcon.classList.add('menu_apps__app__icon');
            appIcon.src = data.icon_url || '/assets/icons/apps/generic_app_icon.svg';
            appIcon.alt = data.app_name;
            appIcon.loading = 'lazy'; // Lazy loading para melhor performance

            const appName = document.createElement('div');
            appName.classList.add('menu_apps__app__name');
            appName.innerText = data.app_name;

            app.appendChild(appIcon);
            app.appendChild(appName);
            this.appsContainer.appendChild(app);
        });
    }

    handleSearchInput(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            this.filteredApps = [...this.allApps];
        } else {
            this.filteredApps = this.allApps.filter(app => 
                app.app_name.toLowerCase().includes(query) ||
                (app.description && app.description.toLowerCase().includes(query))
            );
        }
        
        this.renderApps();
    }

    handleSearchKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        
        // Setas para navegar nos apps
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Foca no primeiro app da lista
            const firstApp = this.appsContainer.querySelector('.menu_apps__app');
            if (firstApp) {
                firstApp.focus();
            }
            return;
        }
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Foca no último app da lista
            const apps = this.appsContainer.querySelectorAll('.menu_apps__app');
            if (apps.length > 0) {
                apps[apps.length - 1].focus();
            }
            return;
        }
        
        // Enter para ativar primeiro app se houver busca
        if (e.key === 'Enter') {
            const firstApp = this.appsContainer.querySelector('.menu_apps__app');
            if (firstApp) {
                e.preventDefault();
                firstApp.click();
                return;
            }
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        
        // Navegação por setas
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateApps(e.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        
        // Enter para ativar app focado
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedApp = document.activeElement;
            if (focusedApp && focusedApp.classList.contains('menu_apps__app')) {
                e.preventDefault();
                focusedApp.click();
                return;
            }
        }
    }

    /**
     * Navega entre os apps usando setas
     */
    navigateApps(direction) {
        const apps = Array.from(this.appsContainer.querySelectorAll('.menu_apps__app'));
        if (apps.length === 0) return;
        
        const currentIndex = apps.findIndex(app => app === document.activeElement);
        let newIndex;
        
        if (currentIndex === -1) {
            // Nenhum app focado, foca no primeiro ou último
            newIndex = direction > 0 ? 0 : apps.length - 1;
        } else {
            // Calcula próximo índice com wrap-around
            newIndex = (currentIndex + direction + apps.length) % apps.length;
        }
        
        apps[newIndex].focus();
    }

    handleOutsideClick(e) {
        if (!this.visibilityFlag) return;
        
        // Se clique foi dentro do menu, não fecha
        if (this.menuElement.contains(e.target)) return;
        
        // Se clique foi no botão start, não fecha (será tratado pelo toggle)
        const startButton = document.querySelector('.taskbar__start_menu');
        if (startButton && startButton.contains(e.target)) return;
        
        this.close();
    }

    /**
     * Alterna entre mostrar/esconder o menu
     */
    toggle() {
        if (this.visibilityFlag) {
            this.close();
        } else {
            this.show();
        }
    }

    /**
     * Método público mantido para compatibilidade
     * @deprecated Use toggle() ao invés deste método
     */
    onClick() {
        this.toggle();
    }

    /**
     * Mostra o menu de aplicativos
     */
    show() {
        this.menuElement.classList.add('menu_apps--visible');
        this.visibilityFlag = true;
        this.loadApps();
        this.focusFirstElement();
    }

    /**
     * Esconde o menu de aplicativos
     */
    close() {
        this.menuElement.classList.remove('menu_apps--visible');
        this.visibilityFlag = false;
        this.clearSearch();
    }

    /**
     * Foca no primeiro elemento interativo do menu
     */
    focusFirstElement() {
        // Foca na busca primeiro para melhor UX
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 100);
        } else if (this.appsContainer) {
            const firstApp = this.appsContainer.querySelector('.menu_apps__app');
            if (firstApp) {
                setTimeout(() => firstApp.focus(), 100);
            }
        }
    }

    /**
     * Limpa a busca e restaura lista completa
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filteredApps = [...this.allApps];
            this.renderApps();
        }
    }

    /**
     * Remove o menu e limpa recursos
     */
    remove() {
        // Remove listeners
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleSearchInput);
            this.searchInput.removeEventListener('keydown', this.handleSearchKeydown);
        }
        
        if (this.menuElement) {
            this.menuElement.removeEventListener('keydown', this.handleKeydown);
        }
        
        document.removeEventListener('click', this.handleOutsideClick);
        
        // Remove do DOM
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        
        // Limpa referências
        this.menuElement = null;
        this.searchInput = null;
        this.appsContainer = null;
        this.allApps = [];
        this.filteredApps = [];
    }
} 