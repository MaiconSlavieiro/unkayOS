// main.js - v1.0.24

import { AppManager } from './core/AppManager.js';
import { loadJSON } from './core/utils.js'; // Assumindo que loadJSON já retorna o objeto JSON parseado, não a string

class menuApps {
    constructor(desktop, manager) { // appsList será carregado dinamicamente do manager
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

    // Agora, lista os aplicativos carregados e detalhados pelo AppManager
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

async function init() {
    const desktop = document.querySelector('#desktop');
    desktop.style.backgroundImage = 'url(/assets/images/todd-trapani-L2dMFs4fdJg-unsplash.jpg)'; // Caminho absoluto

    const appsOnToolBar = document.createElement('div');
    appsOnToolBar.classList.add('tool_bar__apps_on');

    const toolBar = document.createElement('div');
    toolBar.classList.add('tool_bar');
    toolBar.id = 'tool_bar';

    const startMenuIcon = document.createElement('img');
    startMenuIcon.src = '/assets/icons/system/menu_list.svg'; // Caminho absoluto
    startMenuIcon.classList.add('tool_bar__start_menu__icon');

    const startMenu = document.createElement('div');
    startMenu.classList.add('tool_bar__start_menu');

    try {
        const response = await fetch('/apps/apps.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        const appConfigs = jsonData.app_configs || []; // Assume que a lista de apps está em 'app_configs'

        // Inicializa o AppManager com o desktopElement, o elemento para ícones da barra de tarefas e as configurações base dos apps
        window.appManager = new AppManager(desktop, appsOnToolBar, appConfigs);

        // Carrega as configurações detalhadas de cada app (os config.json individuais)
        await window.appManager.loadAppConfigs();

        // Inicializa o menuApps APÓS as configurações detalhadas terem sido carregadas
        const menu = new menuApps(desktop, window.appManager);

        startMenu.addEventListener('click', menu.onClick.bind(menu), false);
        desktop.addEventListener('click', menu.close.bind(menu), true);

        startMenu.appendChild(startMenuIcon);
        toolBar.appendChild(startMenu);
        toolBar.appendChild(appsOnToolBar);
        desktop.appendChild(toolBar);

        menu.init(); // Inicializa o menu (cria o elemento e lista os apps)

        // Inicia os aplicativos que devem ser auto-executados
        // Itera sobre os apps já carregados no AppManager
        window.appManager.initAutorunApps(); // Chama o método do AppManager para iniciar autorun
        
    } catch (error) {
        console.error('Falha ao carregar apps.json ou inicializar:', error);
    }
}

init();
