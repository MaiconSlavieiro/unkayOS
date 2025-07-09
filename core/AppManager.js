// /core/AppManager.js - v1.0.18

import { AppCore } from './AppCore.js';

export class AppManager {
    constructor(desktop, iconsLocality, allAppsData) {
        this.desktop = desktop;
        this.iconsLocality = iconsLocality;
        this.allAppsData = allAppsData;
        this.runningApps = [];
        this.runningHeadlessApps = [];
        this.firstPlaneApp = null;
        this.currentZIndex = 100;

        window.appManager = this;
    }

    get apps() {
        return this.runningApps;
    }

    /**
     * Executa uma nova instância de um aplicativo com base no seu ID.
     * @param {string} appId - O ID único do aplicativo a ser executado.
     * @param {function} [terminalOutputCallback=null] - Função de callback para enviar output para o terminal (opcional).
     * @param {Array<string>} [appParams=[]] - Array de parâmetros a serem passados para o aplicativo (opcional).
     * @returns {Promise<object|null>} A instância da janela do aplicativo (AppWindowSystem/AppCustomUI) ou null se for headless.
     */
    async runApp(appId, terminalOutputCallback = null, appParams = []) { // NOVO: terminalOutputCallback e appParams
        const appData = this.allAppsData.find(app => app.id === appId);

        if (!appData) {
            console.error(`Erro: Aplicativo com ID '${appId}' não encontrado.`);
            return null;
        }

        // Passa terminalOutputCallback e appParams para o construtor do AppCore
        const appCore = new AppCore(appData);
        // O AppCore é responsável por decidir como passar esses parâmetros para o appInstance
        const appInstance = await appCore.run(this.desktop, terminalOutputCallback, appParams); 

        if (appInstance) {
            this.runningApps.push(appInstance);
            this.createIcon(appInstance);
            this.setFirstPlaneApp(appInstance);
        } else {
            this.runningHeadlessApps.push(appCore);
        }

        return appInstance;
    }

    createIcon(appInstance) {
        const iconInstance = document.createElement('div');
        iconInstance.classList.add('tool_bar__apps_on__app_icon');
        iconInstance.id = appInstance.instanceId + 'i';

        iconInstance.addEventListener('click', () => {
            if (this.firstPlaneApp && this.firstPlaneApp.instanceId === appInstance.instanceId) {
                if (appInstance.toggleVisibility) {
                    appInstance.toggleVisibility();
                } else if (appInstance.visibilitySwitch) { // Caso para AppCustomUI
                    appInstance.visibilitySwitch();
                }
            } else {
                this.setFirstPlaneApp(appInstance);
            }
        });

        const iconImg = document.createElement('img');
        iconImg.classList.add('tool_bar__apps_on__app_icon__img');
        iconImg.src = appInstance.core?.icon_url || '/assets/icons/apps/generic_app_icon.svg';

        iconInstance.appendChild(iconImg);
        this.iconsLocality.appendChild(iconInstance);

        appInstance.iconInstance = iconInstance;
    }

    setFirstPlaneApp(appInstance) {
        if (this.firstPlaneApp && this.firstPlaneApp.instanceId !== appInstance.instanceId) {
            if (this.firstPlaneApp.iconInstance) {
                this.firstPlaneApp.iconInstance.classList.remove('active');
            }
            if (this.firstPlaneApp.appElement) {
                this.firstPlaneApp.appElement.classList.remove('active-app');
                this.firstPlaneApp.appElement.classList.remove('first_plane');
            }
        }

        if (appInstance.iconInstance) {
            appInstance.iconInstance.classList.add('active');
        }

        this.firstPlaneApp = appInstance;

        if (this.firstPlaneApp.appElement) {
            this.currentZIndex++;
            this.firstPlaneApp.appElement.style.zIndex = this.currentZIndex;
            this.firstPlaneApp.appElement.classList.add('active-app');
            this.firstPlaneApp.appElement.classList.add('first_plane');
        }
    }

    removeApp(instanceId) {
        let index = this.runningApps.findIndex(app => app.instanceId === instanceId);
        if (index !== -1) {
            const app = this.runningApps[index];

            // Chamar onCleanup na instância do AppCore antes de remover a janela
            if (app.core && app.core.stop && typeof app.core.stop === 'function') {
                app.core.stop();
            }

            if (app.close && typeof app.close === 'function') {
                app.close(); // Isso remove o appElement
            }

            if (app.iconInstance && this.iconsLocality.contains(app.iconInstance)) {
                this.iconsLocality.removeChild(app.iconInstance);
            }

            this.runningApps.splice(index, 1);

            if (this.firstPlaneApp && this.firstPlaneApp.instanceId === instanceId) {
                this.firstPlaneApp = null;
            }

            if (!this.firstPlaneApp && this.runningApps.length > 0) {
                this.setFirstPlaneApp(this.runningApps[this.runningApps.length - 1]);
            }
            return;
        }

        index = this.runningHeadlessApps.findIndex(appCore => appCore.instanceId === instanceId);
        if (index !== -1) {
            const appCore = this.runningHeadlessApps[index];
            if (appCore.stop && typeof appCore.stop === 'function') {
                appCore.stop();
            }
            this.runningHeadlessApps.splice(index, 1);
            return;
        }
        console.warn(`[AppManager] Tentativa de remover app com instanceId '${instanceId}' que não foi encontrado.`);
    }

    killAll() {
        // Copia os arrays para evitar problemas de modificação durante a iteração
        const appsToKillUI = [...this.runningApps];
        appsToKillUI.forEach(app => {
            // Certifica-se de chamar o stop do AppCore para limpeza de timeouts/intervals
            if (app.core && app.core.stop && typeof app.core.stop === 'function') {
                app.core.stop();
            }
            if (app.close && typeof app.close === 'function') {
                app.close(); // Isso remove o appElement
            }
        });
        this.runningApps = []; // Limpa o array após remover todos

        const appsToKillHeadless = [...this.runningHeadlessApps];
        appsToKillHeadless.forEach(appCore => {
            if (appCore.stop && typeof appCore.stop === 'function') {
                appCore.stop();
            }
        });
        this.runningHeadlessApps = []; // Limpa o array após remover todos

        // Remove os ícones da barra de tarefas
        this.iconsLocality.innerHTML = '';

        this.firstPlaneApp = null;
        this.currentZIndex = 100;
        console.log(`Todos os aplicativos (não-sistema) foram encerrados.`);
    }

    logStatus() {
        const uiApps = this.runningApps.map(a => a.instanceId);
        const headlessApps = this.runningHeadlessApps.map(a => a.instanceId);
        console.log('--- Status dos Aplicativos ---');
        console.log('Aplicativos com UI em execução:', uiApps);
        console.log('Aplicativos Headless em execução:', headlessApps);
        console.log('------------------------------');
    }
}
