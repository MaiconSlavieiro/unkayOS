// /core/AppManager.js - v1.0.25 (Atualizado para resolver icon_url)

import { AppCore } from './AppCore.js';
import { BaseApp } from './BaseApp.js';
import eventBus from './eventBus.js'; // Importa o eventBus para Pub/Sub

/**
 * Gerencia todas as instâncias de aplicativos em execução no sistema.
 * Responsável por iniciar, parar e manter o estado dos aplicativos.
 */
export class AppManager {
    /**
     * Atualiza todos os ícones da taskbar para refletir o estado real das janelas.
     */
    updateAllTaskbarIcons() {
        for (const [id, appInfo] of this.runningApps.entries()) {
            if (!appInfo.appUIInstance || appInfo.appCoreInstance.mode !== 'system_window') continue;
            let state = 'normal';
            if (id === this.activeAppInstanceId) {
                state = appInfo.appUIInstance.isMaximized ? 'maximized' : 'active';
            } else if (appInfo.appUIInstance.isMinimized) {
                state = 'minimized';
            } else if (appInfo.appUIInstance.isMaximized) {
                state = 'maximized';
            }
            eventBus.emit('app:icon:update', { instanceId: id, state });
        }
    }
    constructor(desktopElement, appsOnToolBarElement, appConfigs) {
        this.focusHistory = []; // Histórico de foco (ordem LRU)

        this.desktopElement = desktopElement;
        this.appsOnToolBarElement = appsOnToolBarElement;
        this.baseAppConfigs = appConfigs; // Lista de {id, path} do apps.json
        this.loadedAppDetails = new Map(); // Map<appId, fullAppData> onde fullAppData tem caminhos absolutos
        
        this.runningApps = new Map(); // Map<instanceId, {appCoreInstance, appUIInstance, appTaskbarIcon}>
        this.activeAppInstanceId = null;

        this.initialZIndex = 100;

        this.registerEventBusListeners(); // Garante que listeners sejam registrados ao carregar configs
    }

    /**
     * Carrega os arquivos config.json de cada aplicativo e resolve seus caminhos.
     */
    async loadAppConfigs() {
        const loadPromises = this.baseAppConfigs.map(async (baseConfig) => {
            try {
                const configUrl = `${baseConfig.path}config.json`;
                const response = await fetch(configUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${configUrl}`);
                }
                const appConfig = await response.json();

                // Resolve caminhos relativos para absolutos
                const fullAppData = {
                    ...appConfig,
                    id: baseConfig.id, // Garante que o ID do apps.json seja o principal
                    basePath: baseConfig.path, // Salva o caminho base para referência
                    dirApp: appConfig.dirApp ? `${baseConfig.path}${appConfig.dirApp}` : null,
                    jsFile: appConfig.jsFile ? `${baseConfig.path}${appConfig.jsFile}` : null,
                    styleFile: appConfig.styleFile ? `${baseConfig.path}${appConfig.styleFile}` : null,
                    // AGORA resolve icon_url também
                    icon_url: appConfig.icon_url ? `${baseConfig.path}${appConfig.icon_url}` : "/assets/icons/apps/generic_app_icon.svg",
                };
                this.loadedAppDetails.set(baseConfig.id, fullAppData);
                console.log(`[AppManager] Configuração do app '${baseConfig.id}' carregada e resolvida.`);
            } catch (error) {
                console.error(`[AppManager] Erro ao carregar config.json para app '${baseConfig.id}':`, error);
            }
        });
        await Promise.all(loadPromises);
        // Exponibiliza a lista detalhada de apps para módulos desacoplados (ex: menuApps)
        window.loadedAppDetails = this.loadedAppDetails;
    }

    /**
     * Registra listeners do eventBus para start/stop de apps.
     */
    registerEventBusListeners() {
        eventBus.on('app:start', ({ appId, params }) => {
            this.runApp(appId, params);
        });
        eventBus.on('app:stop', ({ instanceId }) => {
            this.stopApp(instanceId);
        });
        eventBus.on('app:taskbar:icon:clicked', ({ instanceId }) => {
            this.handleTaskbarIconClick(instanceId);
        });
        // NOVO: gerenciamento de janela via eventBus
        eventBus.on('window:focus', ({ instanceId }) => {
            this.setFirstPlaneApp(instanceId);
        });
        eventBus.on('window:minimize', ({ instanceId }) => {
            const appInfo = this.runningApps.get(instanceId);
            if (appInfo && appInfo.appUIInstance) {
                appInfo.appUIInstance.isMinimized = true;
                // Oculta a janela
                const win = appInfo.appUIInstance.appWindowElement;
                if (win) win.style.display = 'none';
                this.updateAllTaskbarIcons();
                // Remove do histórico
                this.focusHistory = this.focusHistory.filter(id => id !== instanceId);
                // Busca próxima janela não minimizada no histórico
                let nextActive = this.focusHistory.find(id => {
                    const info = this.runningApps.get(id);
                    return info && info.appUIInstance && !info.appUIInstance.isMinimized && info.appCoreInstance.mode === 'system_window';
                });
                if (nextActive) {
                    this.setFirstPlaneApp(nextActive);
                } else {
                    this.activeAppInstanceId = null;
                    this.updateAllTaskbarIcons();
                }
            }
        });
        eventBus.on('window:restore', ({ instanceId }) => {
            const appInfo = this.runningApps.get(instanceId);
            if (appInfo && appInfo.appUIInstance) {
                appInfo.appUIInstance.isMinimized = false;
                this.setFirstPlaneApp(instanceId);
            }
        });
        eventBus.on('window:maximize', ({ instanceId }) => {
            const appInfo = this.runningApps.get(instanceId);
            if (appInfo && appInfo.appUIInstance) {
                appInfo.appUIInstance.isMaximized = true;
                // Salva posição/tamanho atuais
                const win = appInfo.appUIInstance.appWindowElement;
                if (win) {
                    appInfo._restoreWin = {
                        width: win.style.width,
                        height: win.style.height,
                        left: win.style.left,
                        top: win.style.top
                    };
                    win.style.left = '0px';
                    win.style.top = '0px';
                    win.style.width = this.desktopElement.offsetWidth + 'px';
                    win.style.height = this.desktopElement.offsetHeight + 'px';
                    win.classList.add('maximized');
                }
                this.setFirstPlaneApp(instanceId);
            }
        });
        eventBus.on('window:unmaximize', ({ instanceId }) => {
            const appInfo = this.runningApps.get(instanceId);
            if (appInfo && appInfo.appUIInstance) {
                appInfo.appUIInstance.isMaximized = false;
                // Restaura posição/tamanho salvos
                const win = appInfo.appUIInstance.appWindowElement;
                if (win && appInfo._restoreWin) {
                    win.style.width = appInfo._restoreWin.width;
                    win.style.height = appInfo._restoreWin.height;
                    win.style.left = appInfo._restoreWin.left;
                    win.style.top = appInfo._restoreWin.top;
                    win.classList.remove('maximized');
                }
                this.setFirstPlaneApp(instanceId);
            }
        });
        // Handler central de clique na taskbar
        eventBus.on('window:toggle', ({ instanceId }) => {
            const appInfo = this.runningApps.get(instanceId);
            if (!appInfo || !appInfo.appUIInstance) return;
            // Se minimizada, restaurar e focar
            if (appInfo.appUIInstance.isMinimized) {
                appInfo.appUIInstance.isMinimized = false;
                this.setFirstPlaneApp(instanceId);
            } else if (this.activeAppInstanceId === instanceId) {
                // Se já está ativa, minimizar
                appInfo.appUIInstance.isMinimized = true;
                this.updateAllTaskbarIcons();
            } else {
                // Se está aberta mas não ativa, focar
                this.setFirstPlaneApp(instanceId);
            }
        });
        // Novo: fechar app via evento
        eventBus.on('window:close', ({ instanceId }) => {
            this.stopApp(instanceId);
        });
    }

    /**
     * Ativa ou minimiza o app ao clicar no ícone da taskbar (eventBus-driven)
     */
    handleTaskbarIconClick(instanceId) {
        const appInfo = this.runningApps.get(instanceId);
        if (!appInfo || !appInfo.appUIInstance) return;

        if (appInfo.appUIInstance.isMinimized) {
            // Se o app está minimizado, restaura e traz para o primeiro plano
            appInfo.appUIInstance.toggleVisibility();
            eventBus.emit('app:icon:update', { instanceId, state: 'active' });
            this.setFirstPlaneApp(instanceId);
        } else if (this.activeAppInstanceId === instanceId) {
            // Se o app é o ativo, minimiza
            appInfo.appUIInstance.toggleVisibility();
            eventBus.emit('app:icon:update', { instanceId, state: 'minimized' });
        } else {
            // Se o app não está minimizado e não é o ativo, traz para o primeiro plano
            this.setFirstPlaneApp(instanceId);
            eventBus.emit('app:icon:update', { instanceId, state: 'active' });
        }
    
    }

    /**
     * Inicia os aplicativos marcados como autorun.
     */
    initAutorunApps() {
        console.log('[AppManager] Iniciando apps com autorun...');
        this.loadedAppDetails.forEach(appData => {
            if (appData.autorun) {
                console.log(`[AppManager] Iniciando app com autorun: ${appData.app_name} (${appData.mode})`);
                this.runApp(appData.id);
            }
        });
        console.log('[AppManager] Apps com autorun iniciados.');
    }

    /**
     * Inicia um aplicativo pelo seu ID.
     * @param {string} appId - O ID do aplicativo a ser iniciado (conforme apps.json).
     * @param {Array<string>} [appParams=[]] - Parâmetros a serem passados ao iniciar o app.
     * @returns {string|null} O instanceId do aplicativo iniciado, ou null se falhar.
     */
    async runApp(appId, appParams = []) {
        // Emite evento de tentativa de start
        eventBus.emit('app:starting', { appId, params: appParams });

        console.log(`[AppManager] Tentando iniciar app: ${appId}`);
        const appData = this.loadedAppDetails.get(appId);
        if (!appData) {
            console.error(`[AppManager] App '${appId}' não encontrado nas configs carregadas.`);
            eventBus.emit('app:start:error', { appId, reason: 'not_found' });
            return;
        }
        console.log(`[AppManager] App encontrado: ${appData.app_name} (${appData.mode})`);

        // Para apps custom_ui, desktop_ui ou headless, verifica se já está rodando
        if ((appData.mode === 'custom_ui' || appData.mode === 'desktop_ui' || appData.mode === 'headless') && this.isAppRunning(appId)) {
            console.warn(`Aplicativo '${appId}' (${appData.mode}) já está em execução. Não iniciando nova instância.`);
            eventBus.emit('app:start:error', { appId, reason: 'already_running' });
            return;
        }
        console.log(`[AppManager] App ${appData.app_name} não está rodando, prosseguindo com inicialização...`);

        const appCoreInstance = new AppCore(appData);

        try {
            // Passa o desktopElement (agora 'screenElement' no AppWindowSystem)
            const appUIInstance = await appCoreInstance.run(this.desktopElement, null, appParams);

            this.runningApps.set(appCoreInstance.instanceId, {
                appCoreInstance: appCoreInstance,
                appUIInstance: appUIInstance,
                appTaskbarIcon: null
            });

            if (appData.mode === 'system_window' && appUIInstance) {
                this.createIcon(appCoreInstance);
                // Emite evento para garantir que o app recém-iniciado seja focado corretamente
                eventBus.emit('window:focus', { instanceId: appCoreInstance.instanceId });
            }

            console.log(`Aplicativo '${appData.app_name}' (instanceId: ${appCoreInstance.instanceId}) iniciado no modo: ${appData.mode}`);
            eventBus.emit('app:started', { appId, instanceId: appCoreInstance.instanceId });
            return appCoreInstance.instanceId;

        }
        catch (error) {
            console.error(`Erro ao iniciar o aplicativo '${appData.app_name}' (ID: ${appId}):`, error);
            eventBus.emit('app:start:error', { appId, reason: 'error' });
            this.runningApps.delete(appCoreInstance.instanceId);
            return null;
        }
    }

    /**
     * Verifica se um aplicativo específico (pelo seu appId) já está em execução.
     * @param {string} appId - O ID do aplicativo.
     * @returns {boolean} True se o aplicativo está em execução, false caso contrário.
     */
    isAppRunning(appId) {
        for (const [instanceId, appInfo] of this.runningApps.entries()) {
            if (appInfo.appCoreInstance.id === appId) {
                console.log(`[AppManager] App ${appId} já está rodando (instanceId: ${instanceId})`);
                return true;
            }
        }
        console.log(`[AppManager] App ${appId} não está rodando`);
        return false;
    }

    /**
     * Cria e anexa o ícone de um aplicativo à barra de tarefas.
     * @param {object} appCoreInstance - A instância do AppCore do aplicativo.
     */
    createIcon(appCoreInstance) {
        if (appCoreInstance.mode !== 'system_window') return;
        
        // Se a taskbar ainda não foi inicializada, não cria o ícone
        if (!this.appsOnToolBarElement) {
            console.warn(`[AppManager] Taskbar não inicializada. Ícone para ${appCoreInstance.app_name} será criado quando a taskbar estiver pronta.`);
            return;
        }
        
        console.log(`[AppManager] Criando ícone para ${appCoreInstance.app_name} na taskbar`);

        const appIconDiv = document.createElement('div');
        appIconDiv.classList.add('taskbar__apps_on__app_icon'); // Este div será o elemento clicável
        appIconDiv.dataset.instanceId = appCoreInstance.instanceId;

        const appIconImg = document.createElement('img');
        appIconImg.classList.add('taskbar__apps_on__app_icon__img'); // A imagem dentro do div
        appIconImg.src = appCoreInstance.icon_url; // appCoreInstance.icon_url já é absoluto

        appIconDiv.appendChild(appIconImg); // Adiciona a imagem ao div do ícone
        this.appsOnToolBarElement.appendChild(appIconDiv); // Adiciona o div do ícone à barra de tarefas

        // Adiciona evento de clique para trazer a janela para o primeiro plano ou minimizar/restaurar
        appIconDiv.addEventListener('click', () => {
            const appInfo = this.runningApps.get(appIconDiv.dataset.instanceId);
            if (appInfo && appInfo.appUIInstance) {
                if (appInfo.appUIInstance.isMinimized) {
                    // Se o app está minimizado, restaura e traz para o primeiro plano
                    appInfo.appUIInstance.toggleVisibility(); // Restaura a janela
                    appIconDiv.classList.remove('minimized'); // Remove o estado minimizado do ícone
                    this.setFirstPlaneApp(appIconDiv.dataset.instanceId);
                } else if (this.activeAppInstanceId === appIconDiv.dataset.instanceId) {
                    // Se o app é o ativo, minimiza
                    appInfo.appUIInstance.toggleVisibility(); // Minimiza a janela
                    appIconDiv.classList.add('minimized'); // Adiciona o estado minimizado ao ícone
                } else {
                    // Se o app não está minimizado e não é o ativo, traz para o primeiro plano
                    this.setFirstPlaneApp(appIconDiv.dataset.instanceId);
                    // Se a janela estava oculta por algum motivo (mas não marcada como minimized),
                    // garante que ela seja exibida ao ser focada.
                    if (appInfo.appUIInstance.appWindowElement.style.display === 'none') {
                        appInfo.appUIInstance.appWindowElement.style.display = 'block';
                    }
                }
            }
        });

        const appInfo = this.runningApps.get(appCoreInstance.instanceId);
        if (appInfo) {
            appInfo.appTaskbarIcon = appIconDiv;
        }
        
        console.log(`[AppManager] Ícone criado para ${appCoreInstance.app_name}:`, appIconDiv);
    }

    /**
     * Traz uma janela de aplicativo para o primeiro plano (maior z-index).
     * @param {string} instanceId - O instanceId do aplicativo a ser ativado.
     */
    setFirstPlaneApp(instanceId) {
        console.log('[AppManager] Foco para:', instanceId);
        // Atualiza histórico de foco
        this.focusHistory = this.focusHistory.filter(id => id !== instanceId);
        this.focusHistory.unshift(instanceId);

        // Centraliza atualização de estado e DOM de todas as janelas
        let zIndex = this.initialZIndex;
        for (const [id, appInfo] of this.runningApps.entries()) {
            if (!appInfo.appUIInstance || appInfo.appCoreInstance.mode !== 'system_window') continue;
            const win = appInfo.appUIInstance.appWindowElement;
            if (!win) continue;

            if (id === instanceId) {
                // Ativa: mostra, z-index alto, classe active, estado visual correto
                win.style.display = '';
                win.classList.add('active-app');
                win.style.zIndex = this.initialZIndex + 100;
                if (appInfo.appUIInstance.isMaximized) {
                    win.classList.add('maximized');
                } else {
                    win.classList.remove('maximized');
                }
                if (appInfo.appUIInstance.isMinimized) {
                    appInfo.appUIInstance.isMinimized = false;
                }
                eventBus.emit('app:icon:update', { instanceId: id, state: appInfo.appUIInstance.isMaximized ? 'maximized' : 'active' });
            } else {
                // Não ativa: tira active, z-index baixo, mostra/oculta conforme estado
                win.classList.remove('active-app');
                win.style.zIndex = zIndex;
                if (appInfo.appUIInstance.isMinimized) {
                    win.style.display = 'none';
                    eventBus.emit('app:icon:update', { instanceId: id, state: 'minimized' });
                } else if (appInfo.appUIInstance.isMaximized) {
                    win.style.display = '';
                    win.classList.add('maximized');
                    eventBus.emit('app:icon:update', { instanceId: id, state: 'maximized' });
                } else {
                    win.style.display = '';
                    win.classList.remove('maximized');
                    eventBus.emit('app:icon:update', { instanceId: id, state: 'normal' });
                }
                zIndex++;
            }
        }
        // Define o novo aplicativo ativo
        this.activeAppInstanceId = instanceId;
    }

    /**
     * Remove um aplicativo em execução pelo seu instanceId.
     * @param {string} instanceId - O instanceId do aplicativo a ser removido.
     */
    stopApp(instanceId) {
        // Emite evento de tentativa de stop
        eventBus.emit('app:stopping', { instanceId });
        console.log(`[AppManager] removeApp chamado para instanceId: ${instanceId}`);
        console.log(`[AppManager] runningApps:`, this.runningApps);
        
        const appInfo = this.runningApps.get(instanceId);
        if (!appInfo) {
            console.warn(`Aplicativo com instanceId '${instanceId}' não encontrado para remoção.`);
            eventBus.emit('app:stop:error', { instanceId, reason: 'not_found' });
            return;
        }

        // Apps custom_ui e desktop_ui (apps de sistema) não podem ser fechados pelo usuário
        if (appInfo.appCoreInstance.mode === "custom_ui" || appInfo.appCoreInstance.mode === "desktop_ui") {
            console.warn(`[AppManager] Tentativa de remover aplicativo de sistema (${appInfo.appCoreInstance.mode}) '${appInfo.appCoreInstance.app_name}' (ID: ${instanceId}). Não permitido.`);
            eventBus.emit('app:stop:error', { instanceId, reason: 'system_app' });
            return;
        }

        // Chama o método stop() do AppCore para limpeza
        appInfo.appCoreInstance.stop();

        // Se o aplicativo tem uma UI, chama o método remove() para limpeza adequada
        if (appInfo.appUIInstance && typeof appInfo.appUIInstance.remove === 'function') {
            appInfo.appUIInstance.remove();
        } else {
            // Fallback para remoção manual se o método remove() não existir
            if (appInfo.appUIInstance && appInfo.appUIInstance.appWindowElement) { // Para system_window
                appInfo.appUIInstance.appWindowElement.remove();
            } else if (appInfo.appUIInstance && appInfo.appUIInstance.appElement) { // Para custom_ui
                appInfo.appUIInstance.appElement.remove();
            }
        }

        // Remove o ícone da barra de tarefas, se existir
        if (appInfo.appTaskbarIcon) {
            appInfo.appTaskbarIcon.remove();
        }

        // Remove o aplicativo do mapa de aplicativos em execução
        this.runningApps.delete(instanceId);

        // Se o app removido era o ativo, limpa o estado
        if (this.activeAppInstanceId === instanceId) {
            this.activeAppInstanceId = null;
        }

        eventBus.emit('app:stopped', { instanceId });
        console.log(`Aplicativo (instanceId: ${instanceId}) removido.`);
    }

    /**
     * Encerra todos os aplicativos em execução (exceto custom_ui e desktop_ui, que são considerados de sistema).
     */
    killAll() {
        const instanceIdsToKill = [];
        for (const [instanceId, appInfo] of this.runningApps.entries()) {
            if (appInfo.appCoreInstance.mode !== 'custom_ui' && appInfo.appCoreInstance.mode !== 'desktop_ui') {
                instanceIdsToKill.push(instanceId);
            }
        }

        instanceIdsToKill.forEach(instanceId => {
            this.removeApp(instanceId);
        });

        console.log(`Todos os aplicativos de janela e headless foram encerrados.`);
    }
}
