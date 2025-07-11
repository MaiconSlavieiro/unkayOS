// core/MenuApps.js - v1.0.1

/**
 * Classe para gerenciar o menu de aplicativos do sistema.
 * Agora é um módulo separado para ser usado pela taskbar.
 */
export class menuApps {
    constructor(desktop, manager) {
        this.desktop = desktop;
        this.manager = manager;
        this.menuElement = null;
        this.visibilityFlag = false;
    }

    init() {
        this.menuElement = document.createElement('div');
        this.menuElement.classList.add('menu_apps');
        this.menuElement.id = 'menu_apps';
        this.desktop.appendChild(this.menuElement);
        this.listingApps();
    }

    // Lista os aplicativos carregados e detalhados pelo AppManager
    listingApps() {
        this.menuElement.innerHTML = '';
        // Pega a lista de apps detalhados do AppManager
        const listOfApps = Array.from(this.manager.loadedAppDetails.values()).filter(app => !app.hidden);

        listOfApps.forEach(data => {
            const app = document.createElement('div');
            app.classList.add('menu_apps__app');
            app.id = data.id + '-launcher';

            app.addEventListener('click', () => {
                this.manager.runApp(data.id);
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