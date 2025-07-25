// core/MenuApps.js - v1.0.2

import eventBus from './eventBus.js';
import { windowLayerManager } from './WindowLayerManager.js';

/**
 * Classe para gerenciar o menu de aplicativos do sistema.
 * Agora é um módulo separado para ser usado pela taskbar.
 */
export class menuApps {
    constructor(desktop) {
        this.desktop = desktop;
        this.menuElement = null;
        this.visibilityFlag = false;
    }

    init() {
        this.menuElement = document.createElement('div');
        this.menuElement.classList.add('menu_apps');
        this.menuElement.id = 'menu_apps';
        this.desktop.appendChild(this.menuElement);
        
        // Define z-index correto para o menu de apps
        windowLayerManager.setSystemLayer(this.menuElement, 'APPS_MENU');
        
        this.listingApps();
    }

    // Lista os aplicativos carregados e detalhados pelo sistema
    listingApps() {
        this.menuElement.innerHTML = '';
        // Busca a lista de apps detalhados de uma fonte global (window.loadedAppDetails)
        const appDetailsMap = window.loadedAppDetails || new Map();
        const listOfApps = Array.from(appDetailsMap.values()).filter(app => !app.hidden);

        listOfApps.forEach(data => {
            const app = document.createElement('div');
            app.classList.add('menu_apps__app');
            app.id = data.id + '-launcher';

            app.addEventListener('click', () => {
                eventBus.emit('app:start', { appId: data.id });
                this.close();
            }, true);

            const appIcon = document.createElement('img');
            appIcon.classList.add('menu_apps__app__icon');
            appIcon.src = data.icon_url || '/assets/icons/apps/generic_app_icon.svg';

            const appName = document.createElement('div');
            appName.classList.add('menu_apps__app__name');
            appName.innerText = data.app_name;

            app.appendChild(appIcon);
            app.appendChild(appName);
            this.menuElement.appendChild(app);
        });
    }

    onClick() {
        if (this.visibilityFlag) this.close();
        else this.show();
    }

    show() {
        this.menuElement.classList.add('show');
        this.visibilityFlag = true;
        this.listingApps(); // Atualiza a lista de apps sempre que o menu é aberto
    }

    close() {
        this.menuElement.classList.remove('show');
        this.visibilityFlag = false;
    }
} 