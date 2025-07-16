// apps/taskbar/main.js - v2.0.0 (Refatorado sem Shadow DOM)

import { BaseApp } from '../../core/BaseApp.js';
import eventBus from '../../core/eventBus.js';

/**
 * Aplicativo de Barra de Tarefas que gerencia o menu iniciar e ícones de aplicativos ativos.
 * Este é um aplicativo desktop_ui que é parte fundamental do ambiente.
 * 
 * NOVA ESTRATÉGIA: Sem Shadow DOM - injeção direta no DOM principal
 */
export default class TaskbarApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);

        // Referências aos elementos DOM
        this.taskbarElement = null;
        this.startMenuElement = null;
        this.appsOnToolbarElement = null;
        this.systemTrayElement = null;
        this.desktopElement = null; // Referência ao desktop principal
        
        // Referência ao menu de aplicativos
        this.menuApps = null;
        
        // Bind methods
        this.handleStartMenuClick = this.handleStartMenuClick.bind(this);
        this.handleDesktopClick = this.handleDesktopClick.bind(this);
        this.createAppIcon = this.createAppIcon.bind(this);
        this.updateAppIcon = this.updateAppIcon.bind(this);
        this.removeAppIcon = this.removeAppIcon.bind(this);

        // Listeners do eventBus para ciclo de vida dos apps
        eventBus.on('app:started', ({ appId, instanceId }) => {
            this.createAppIcon(instanceId);
        });
        eventBus.on('app:stopped', ({ instanceId }) => {
            this.removeAppIcon(instanceId);
        });
        eventBus.on('app:icon:update', ({ instanceId, state }) => {
            this.updateAppIcon(instanceId, state);
        });
    }

    /**
     * Manipula o clique no botão do menu iniciar.
     */
    handleStartMenuClick() {
        console.log(`[${this.appName}] Clique no menu iniciar detectado`);
        if (this.menuApps) {
            console.log(`[${this.appName}] Menu de aplicativos encontrado, chamando onClick()`);
            this.menuApps.onClick();
        } else {
            console.warn(`[${this.appName}] Menu de aplicativos não encontrado`);
        }
    }

    /**
     * Manipula cliques no desktop para fechar o menu.
     */
    handleDesktopClick(event) {
        // Verifica se o clique foi fora da taskbar
        if (!this.taskbarElement.contains(event.target)) {
            if (this.menuApps) {
                this.menuApps.close();
            }
        }
    }

    /**
     * Cria um ícone de aplicativo na barra de tarefas.
     * @param {string} instanceId - ID da instância do aplicativo.
     * @param {string} iconUrl - URL do ícone.
     * @param {string} appName - Nome do aplicativo.
     */
    createAppIcon(instanceId) {
        if (!this.appsOnToolbarElement) return;
        // Busca instância do AppManager para acessar runningApps
        const appManager = window.appManager;
        if (!appManager || !appManager.runningApps) return;
        const appInfo = appManager.runningApps.get(instanceId);
        if (!appInfo || !appInfo.appCoreInstance) return;
        const appCore = appInfo.appCoreInstance;
        // Só cria ícone para apps 'system_window'
        if (appCore.mode !== 'system_window') return;

        const iconUrl = appCore.icon_url || '/assets/icons/apps/generic_app_icon.svg';
        const appName = appCore.app_name || 'App';

        const appIconDiv = document.createElement('div');
        appIconDiv.classList.add('taskbar__apps_on__app_icon');
        appIconDiv.dataset.instanceId = instanceId;
        appIconDiv.title = appName;

        const appIconImg = document.createElement('img');
        appIconImg.classList.add('taskbar__apps_on__app_icon__img');
        appIconImg.src = iconUrl;
        appIconImg.alt = appName;

        appIconDiv.appendChild(appIconImg);
        this.appsOnToolbarElement.appendChild(appIconDiv);

        // Adiciona evento de clique
        appIconDiv.addEventListener('click', () => {
            this.handleAppIconClick(instanceId);
        });

        console.log(`[${this.appName}] Ícone criado para app: ${appName} (${instanceId})`);
        // Garante que o ícone recém-criado reflita o foco imediatamente se for o app ativo
        if (appManager && appManager.activeAppInstanceId === instanceId) {
            this.updateAppIcon(instanceId, 'active');
        }
    }

    /**
     * Atualiza o estado de um ícone de aplicativo.
     * @param {string} instanceId - ID da instância do aplicativo.
     * @param {string} state - Estado ('active', 'minimized', 'maximized', 'normal').
     */
    updateAppIcon(instanceId, state) {
        const icon = this.appsOnToolbarElement.querySelector(`.taskbar__apps_on__app_icon[data-instance-id='${instanceId}']`);
        if (!icon) return;
        icon.classList.remove('active', 'minimized', 'normal', 'maximized');
        if (state === 'active') {
            icon.classList.add('active');
        } else if (state === 'minimized') {
            icon.classList.add('minimized');
        } else if (state === 'maximized') {
            icon.classList.add('maximized');
        } else {
            icon.classList.add('normal');
        }
    }

    /**
     * Remove um ícone de aplicativo da barra de tarefas.
     * @param {string} instanceId - ID da instância do aplicativo.
     */
    removeAppIcon(instanceId) {
        const appIcon = this.appsOnToolbarElement?.querySelector(`[data-instance-id="${instanceId}"]`);
        if (appIcon) {
            appIcon.remove();
            console.log(`[${this.appName}] Ícone removido para app: ${instanceId}`);
        }
    }

    /**
     * Manipula o clique em um ícone de aplicativo.
     * @param {string} instanceId - ID da instância do aplicativo.
     */
    handleAppIconClick(instanceId) {
        // Emite evento de intenção de ação na janela
        eventBus.emit('window:toggle', { instanceId });
    }

    /**
     * Inicializa o menu de aplicativos.
     */
    initializeMenuApps() {
        // Importa e cria o menu de aplicativos
        import('../../core/MenuApps.js').then(module => {
            const { menuApps } = module;
            // O menu é criado no desktop principal
            this.menuApps = new menuApps(this.desktopElement);
            this.menuApps.init();
            console.log(`[${this.appName}] Menu de aplicativos inicializado`);
        }).catch(error => {
            console.error(`[${this.appName}] Erro ao inicializar menu de aplicativos:`, error);
        });
    }
    

    /**
     * Inicializa o aplicativo quando é executado.
     */
    onRun() {
        console.log(`[${this.appName}] Inicializando taskbar...`);

        // Obtém referências aos elementos DOM
        this.taskbarElement = this.appContentRoot.querySelector('.taskbar');
        this.startMenuElement = this.appContentRoot.querySelector('.taskbar__start_menu');
        this.appsOnToolbarElement = this.appContentRoot.querySelector('.taskbar__apps_on');
        this.systemTrayElement = this.appContentRoot.querySelector('.taskbar__system_tray');

        // Obtém referência ao desktop principal
        this.desktopElement = document.querySelector('#desktop');
        if (!this.desktopElement) {
            console.error(`[${this.appName}] Elemento desktop não encontrado`);
            return;
        }

        // Adiciona listener para o botão do menu iniciar
        if (this.startMenuElement) {
            this.startMenuElement.addEventListener('click', this.handleStartMenuClick);
            console.log(`[${this.appName}] Listener do menu iniciar configurado`);
        } else {
            console.error(`[${this.appName}] Elemento do menu iniciar não encontrado`);
        }

        // Adiciona listener para cliques no desktop
        this.desktopElement.addEventListener('click', this.handleDesktopClick);

        // Inicializa o menu de aplicativos
        this.initializeMenuApps();

        // Toda comunicação com apps e ciclo de vida é feita via eventBus (sem dependência do AppManager)

        // Limpa ícones antigos e recria apenas os válidos
        if (this.appsOnToolbarElement) {
            this.appsOnToolbarElement.innerHTML = '';
            const appManager = window.appManager;
            if (appManager && appManager.runningApps) {
                for (const [instanceId, appInfo] of appManager.runningApps.entries()) {
                    if (appInfo && appInfo.appCoreInstance && appInfo.appCoreInstance.mode === 'system_window') {
                        this.createAppIcon(instanceId);
                    }
                }
            }
        }
        console.log(`[${this.appName}] Taskbar inicializada com sucesso`);
    }

    /**
     * Limpa recursos quando o aplicativo é encerrado.
     */
    onCleanup() {
        console.log(`[${this.appName}] Limpando recursos da taskbar...`);

        // Remove listeners
        if (this.startMenuElement) {
            this.startMenuElement.removeEventListener('click', this.handleStartMenuClick);
        }

        if (this.desktopElement) {
            this.desktopElement.removeEventListener('click', this.handleDesktopClick);
        }

        // Remove o menu de aplicativos
        if (this.menuApps) {
            this.menuApps.remove();
        }

        console.log(`[${this.appName}] Recursos da taskbar limpos`);
    }
} 