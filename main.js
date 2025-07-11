// main.js - v1.0.25

import { AppManager } from './core/AppManager.js';
import { loadJSON } from './core/utils.js';

async function init() {
    const desktop = document.querySelector('#desktop');
    desktop.style.backgroundImage = 'url(/assets/images/todd-trapani-L2dMFs4fdJg-unsplash.jpg)'; // Caminho absoluto

    try {
        const response = await fetch('/apps/apps.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        const appConfigs = jsonData.app_configs || []; // Assume que a lista de apps está em 'app_configs'

        // Inicializa o AppManager com o desktopElement e as configurações base dos apps
        // appsOnToolBar será configurado pela taskbar quando ela inicializar
        window.appManager = new AppManager(desktop, null, appConfigs);

        // Carrega as configurações detalhadas de cada app (os config.json individuais)
        await window.appManager.loadAppConfigs();

        // Inicia os aplicativos que devem ser auto-executados
        // A taskbar será iniciada automaticamente como um app de desktop
        window.appManager.initAutorunApps(); // Chama o método do AppManager para iniciar autorun
        
    } catch (error) {
        console.error('Falha ao carregar apps.json ou inicializar:', error);
    }
}

init();
