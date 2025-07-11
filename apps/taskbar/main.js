// apps/taskbar/main.js - v2.0.0 (Refatorado sem Shadow DOM)

import { BaseApp } from '../../core/BaseApp.js';

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
    createAppIcon(instanceId, iconUrl, appName) {
        if (!this.appsOnToolbarElement) return;

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
    }

    /**
     * Atualiza o estado de um ícone de aplicativo.
     * @param {string} instanceId - ID da instância do aplicativo.
     * @param {string} state - Estado ('active', 'minimized', 'normal').
     */
    updateAppIcon(instanceId, state) {
        const appIcon = this.appsOnToolbarElement?.querySelector(`[data-instance-id="${instanceId}"]`);
        if (!appIcon) return;

        // Remove classes de estado anteriores
        appIcon.classList.remove('active', 'minimized');

        // Adiciona a nova classe de estado
        if (state === 'active') {
            appIcon.classList.add('active');
        } else if (state === 'minimized') {
            appIcon.classList.add('minimized');
        }

        console.log(`[${this.appName}] Estado atualizado para app ${instanceId}: ${state}`);
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
        if (!this.appManager) return;

        const appInfo = this.appManager.runningApps.get(instanceId);
        if (!appInfo || !appInfo.appUIInstance) return;

        if (appInfo.appUIInstance.isMinimized) {
            // Se o app está minimizado, restaura e traz para o primeiro plano
            appInfo.appUIInstance.toggleVisibility();
            this.updateAppIcon(instanceId, 'active');
            this.appManager.setFirstPlaneApp(instanceId);
        } else if (this.appManager.activeAppInstanceId === instanceId) {
            // Se o app é o ativo, minimiza
            appInfo.appUIInstance.toggleVisibility();
            this.updateAppIcon(instanceId, 'minimized');
        } else {
            // Se o app não está minimizado e não é o ativo, traz para o primeiro plano
            this.appManager.setFirstPlaneApp(instanceId);
            this.updateAppIcon(instanceId, 'active');
        }
    }

    /**
     * Inicializa o menu de aplicativos.
     */
    initializeMenuApps() {
        // Importa e cria o menu de aplicativos
        import('../../core/MenuApps.js').then(module => {
            const { menuApps } = module;
            // O menu é criado no desktop principal
            this.menuApps = new menuApps(this.desktopElement, this.appManager);
            this.menuApps.init();
            console.log(`[${this.appName}] Menu de aplicativos inicializado`);
        }).catch(error => {
            console.error(`[${this.appName}] Erro ao inicializar menu de aplicativos:`, error);
        });
    }

    /**
     * Configura os listeners para eventos do AppManager.
     */
    setupAppManagerListeners() {
        if (!this.appManager) return;

        // Intercepta a remoção de apps para limpeza adequada
        const originalRemoveApp = this.appManager.removeApp.bind(this.appManager);
        this.appManager.removeApp = (instanceId) => {
            // Chama o método original primeiro
            originalRemoveApp(instanceId);
        };

        // Intercepta a mudança de app ativo para atualizar estados
        const originalSetFirstPlaneApp = this.appManager.setFirstPlaneApp.bind(this.appManager);
        this.appManager.setFirstPlaneApp = (instanceId) => {
            // Chama o método original primeiro
            originalSetFirstPlaneApp(instanceId);
            
            // Atualiza os estados dos ícones após a mudança
            setTimeout(() => {
                for (const [id, appInfo] of this.appManager.runningApps.entries()) {
                    if (appInfo.appTaskbarIcon) {
                        if (id === instanceId) {
                            appInfo.appTaskbarIcon.classList.add('active');
                            appInfo.appTaskbarIcon.classList.remove('minimized');
                        } else {
                            appInfo.appTaskbarIcon.classList.remove('active');
                            if (appInfo.appUIInstance?.isMinimized) {
                                appInfo.appTaskbarIcon.classList.add('minimized');
                            } else {
                                appInfo.appTaskbarIcon.classList.remove('minimized');
                            }
                        }
                    }
                }
            }, 0);
        };

        console.log(`[${this.appName}] Listeners do AppManager configurados`);
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

        // Obtém referência ao AppManager
        this.appManager = window.appManager;
        if (!this.appManager) {
            console.error(`[${this.appName}] AppManager não encontrado`);
            return;
        }

        // Configura o elemento de apps da taskbar no AppManager
        this.appManager.appsOnToolBarElement = this.appsOnToolbarElement;
        console.log(`[${this.appName}] Elemento de apps configurado no AppManager:`, this.appsOnToolbarElement);

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

        // Configura os listeners do AppManager
        this.setupAppManagerListeners();

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