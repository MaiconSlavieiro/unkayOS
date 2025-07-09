// /core/AppManager.js - v1.0.23

import { AppCore } from './AppCore.js';

/**
 * Gerencia todas as instâncias de aplicativos em execução no sistema.
 * Responsável por iniciar, parar e manter o estado dos aplicativos.
 */
export class AppManager {
    constructor(desktopElement, appsOnToolBarElement, appConfigs) { 
        this.desktopElement = desktopElement; 
        this.appsOnToolBarElement = appsOnToolBarElement; 
        this.baseAppConfigs = appConfigs; // Lista de {id, path} do apps.json
        this.loadedAppDetails = new Map(); // Map<appId, fullAppData> onde fullAppData tem caminhos absolutos
        
        this.runningApps = new Map(); // Map<instanceId, {appCoreInstance, appUIInstance, appTaskbarIcon}>
        this.activeAppInstanceId = null; 

        this.initialZIndex = 100; 

        window.appManager = this; // Garante acesso global
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
                    // Outras propriedades como icon_url já devem ser absolutas ou serão resolvidas na AppCore/UI
                };
                this.loadedAppDetails.set(baseConfig.id, fullAppData);
                console.log(`[AppManager] Configuração do app '${baseConfig.id}' carregada e resolvida.`);
            } catch (error) {
                console.error(`[AppManager] Erro ao carregar config.json para app '${baseConfig.id}':`, error);
            }
        });
        await Promise.all(loadPromises);
    }

    /**
     * Inicia os aplicativos marcados como autorun.
     */
    initAutorunApps() {
        this.loadedAppDetails.forEach(appData => {
            if (appData.autorun) {
                this.runApp(appData.id);
            }
        });
    }

    /**
     * Inicia um aplicativo pelo seu ID.
     * @param {string} appId - O ID do aplicativo a ser iniciado (conforme apps.json).
     * @param {function} [terminalOutputCallback=null] - Função de callback para enviar output para o terminal.
     * @param {Array<string>} [appParams=[]] - Parâmetros a serem passados ao iniciar o app.
     * @returns {string|null} O instanceId do aplicativo iniciado, ou null se falhar.
     */
    async runApp(appId, terminalOutputCallback = null, appParams = []) {
        const appData = this.loadedAppDetails.get(appId);
        if (!appData) {
            console.error(`Aplicativo com ID '${appId}' não encontrado ou não carregado.`);
            return null;
        }

        // Para apps custom_ui ou headless, verifica se já está rodando
        if ((appData.mode === 'custom_ui' || appData.mode === 'headless') && this.isAppRunning(appId)) {
            console.warn(`Aplicativo '${appId}' (${appData.mode}) já está em execução. Não iniciando nova instância.`);
            return null;
        }

        const appCoreInstance = new AppCore(appData);

        try {
            // Passa o desktopElement (agora 'screenElement' no AppWindowSystem)
            const appUIInstance = await appCoreInstance.run(this.desktopElement, terminalOutputCallback, appParams); 

            this.runningApps.set(appCoreInstance.instanceId, {
                appCoreInstance: appCoreInstance,
                appUIInstance: appUIInstance, 
                appTaskbarIcon: null 
            });

            if (appData.mode === 'system_window' && appUIInstance) {
                this.createIcon(appCoreInstance);
                this.setFirstPlaneApp(appCoreInstance.instanceId);
            }

            console.log(`Aplicativo '${appData.app_name}' (instanceId: ${appCoreInstance.instanceId}) iniciado no modo: ${appData.mode}`);
            return appCoreInstance.instanceId;

        }
        catch (error) {
            console.error(`Erro ao iniciar o aplicativo '${appData.app_name}' (ID: ${appId}):`, error);
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
                return true;
            }
        }
        return false;
    }

    /**
     * Cria e anexa o ícone de um aplicativo à barra de tarefas.
     * @param {object} appCoreInstance - A instância do AppCore do aplicativo.
     */
    createIcon(appCoreInstance) {
        if (appCoreInstance.mode !== 'system_window') return; 

        const appIconDiv = document.createElement('div');
        appIconDiv.classList.add('tool_bar__apps_on__app_icon'); // Este div será o elemento clicável
        appIconDiv.dataset.instanceId = appCoreInstance.instanceId; 

        const appIconImg = document.createElement('img');
        appIconImg.classList.add('tool_bar__apps_on__app_icon__img'); // A imagem dentro do div
        appIconImg.src = appCoreInstance.icon_url;

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
    }

    /**
     * Traz uma janela de aplicativo para o primeiro plano (maior z-index).
     * @param {string} instanceId - O instanceId do aplicativo a ser ativado.
     */
    setFirstPlaneApp(instanceId) {
        const appInfoToActivate = this.runningApps.get(instanceId);

        if (!appInfoToActivate || !appInfoToActivate.appUIInstance || appInfoToActivate.appCoreInstance.mode !== 'system_window') {
            console.warn(`Tentativa de ativar app não-janela ou inexistente: ${instanceId}`);
            return;
        }

        // Remove a classe 'active' de todos os ícones da barra de tarefas
        this.appsOnToolBarElement.querySelectorAll('.tool_bar__apps_on__app_icon').forEach(icon => {
            icon.classList.remove('active');
        });

        // Remove a classe 'active-app' e reinicia z-index para todas as janelas
        this.desktopElement.querySelectorAll('.app').forEach(appElement => { 
            appElement.classList.remove('active-app');
            appElement.style.zIndex = this.initialZIndex; 
        });

        // Define o novo aplicativo ativo
        this.activeAppInstanceId = instanceId;
        const appWindowElement = appInfoToActivate.appUIInstance.appWindowElement;

        if (appWindowElement) {
            appWindowElement.classList.add('active-app');
            appWindowElement.style.zIndex = this.initialZIndex + 1; 

            // Ativa o ícone correspondente na barra de tarefas
            if (appInfoToActivate.appTaskbarIcon) {
                appInfoToActivate.appTaskbarIcon.classList.add('active');
            }
        }
    }

    /**
     * Remove um aplicativo em execução pelo seu instanceId.
     * @param {string} instanceId - O instanceId do aplicativo a ser removido.
     */
    removeApp(instanceId) {
        const appInfo = this.runningApps.get(instanceId);
        if (!appInfo) {
            console.warn(`Aplicativo com instanceId '${instanceId}' não encontrado para remoção.`);
            return;
        }

        // Apps custom_ui (apps de sistema) não podem ser fechados pelo usuário
        if (appInfo.appCoreInstance.mode === "custom_ui") {
            console.warn(`[AppManager] Tentativa de remover aplicativo de sistema (custom_ui) '${appInfo.appCoreInstance.app_name}' (ID: ${instanceId}). Não permitido.`);
            return; 
        }

        // Chama o método stop() do AppCore para limpeza
        appInfo.appCoreInstance.stop();

        // Se o aplicativo tem uma UI (AppWindowSystem ou AppCustomUI), remove seu elemento DOM
        if (appInfo.appUIInstance && appInfo.appUIInstance.appWindowElement) { // Para system_window
            appInfo.appUIInstance.appWindowElement.remove();
        } else if (appInfo.appUIInstance && appInfo.appUIInstance.appElement) { // Para custom_ui (embora não seja removível por aqui)
             appInfo.appUIInstance.appElement.remove();
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

        console.log(`Aplicativo (instanceId: ${instanceId}) removido.`);
    }

    /**
     * Encerra todos os aplicativos em execução (exceto custom_ui, que são considerados de sistema).
     */
    killAll() {
        const instanceIdsToKill = [];
        for (const [instanceId, appInfo] of this.runningApps.entries()) {
            if (appInfo.appCoreInstance.mode !== 'custom_ui') {
                instanceIdsToKill.push(instanceId);
            }
        }

        instanceIdsToKill.forEach(instanceId => {
            this.removeApp(instanceId);
        });

        console.log(`Todos os aplicativos de janela e headless foram encerrados.`);
    }
}
