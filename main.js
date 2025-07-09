import { AppManager } from './core/AppManager.js';
import { loadJSON } from './core/utils.js'; // Assumindo que loadJSON já retorna o objeto JSON parseado, não a string

class menuApps {
  constructor(desktop, appsList, manager) {
    this.desktop = desktop;
    this.manager = manager;
    this.listOfApps = appsList.filter(app => !app.hidden);
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

  listingApps() {
    this.menuElement.innerHTML = '';
    this.listOfApps.forEach(data => {
      const app = document.createElement('div');
      app.classList.add('menu_apps__app');
      app.id = data.id + '-launcher';

      app.addEventListener('click', () => {
        this.manager.runApp(data.id); // <-- Passa apenas o ID do aplicativo
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
    const jsonData = await loadJSON('/apps/apps.json'); // Caminho absoluto para apps.json
    const appsList = jsonData.apps;
    if (!Array.isArray(appsList)) {
      throw new Error("A propriedade 'apps' no JSON não é um array válido.");
    }

    const manager = new AppManager(desktop, appsOnToolBar, appsList);
    const menu = new menuApps(desktop, appsList, manager);

    startMenu.addEventListener('click', menu.onClick.bind(menu), false);
    desktop.addEventListener('click', menu.close.bind(menu), true);

    startMenu.appendChild(startMenuIcon);
    toolBar.appendChild(startMenu);
    toolBar.appendChild(appsOnToolBar);
    desktop.appendChild(toolBar);

    menu.init();

    // Loop para iniciar aplicativos com autorun
    appsList.forEach(appData => {
      if (appData.autorun) {
        console.log(`Iniciando app com autorun: ${appData.app_name}`);
        manager.runApp(appData.id); // <-- CORREÇÃO AQUI: Passa apenas o ID do aplicativo
      }
    });

  } catch (error) {
    console.error('Falha ao carregar apps.json:', error);
  }
}

init();
