// main.js - v1.0.25

import { AppManager } from './core/AppManager.js';
import { AuthSystem } from './core/AuthSystem.js';

async function init() {
    const desktop = document.querySelector('#desktop');
    desktop.style.backgroundImage = 'url(/assets/images/wallpaper_01.jpg)'; // Caminho absoluto

    try {
        // Inicializa o sistema de autenticação
        console.log('[main.js] Inicializando sistema de autenticação...');
        window.authSystem = new AuthSystem();
        
        // Aguarda a inicialização do sistema de autenticação
        await new Promise(resolve => {
            const checkAuth = () => {
                if (window.authSystem) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });

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
        
        console.log('[main.js] Sistema inicializado com sucesso');
        
    } catch (error) {
        console.error('Falha ao carregar apps.json ou inicializar:', error);
    }
}

init();
