// apps/system-info/main.js - v2.1.0 (Com DragManager integrado)

import { BaseApp } from '../../core/BaseApp.js';
import { dragManager } from '../../core/DragManager.js';

/**
 * Widget de informações do sistema que exibe dados em tempo real.
 * Este é um exemplo de aplicativo desktop_ui que é parte fundamental do ambiente.
 * 
 * NOVA ESTRATÉGIA: Sem Shadow DOM - acesso direto aos elementos
 */
export default class SystemInfoApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);

        // Referências aos elementos DOM
        this.osInfoElement = null;
        this.activeAppsElement = null;
        this.uptimeElement = null;
        
        // Intervalos para atualização
        this.updateInterval = null;
        this.startTime = Date.now();
        
        // Drag and drop
        this.dragCleanup = null;
        
        // Bind methods
        this.updateSystemInfo = this.updateSystemInfo.bind(this);
        this.formatUptime = this.formatUptime.bind(this);
        this.getActiveAppsCount = this.getActiveAppsCount.bind(this);
    }

    /**
     * Formata o uptime do sistema.
     * @returns {string} Uptime formatado.
     */
    formatUptime() {
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const h = hours.toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        
        return `${h}:${m}:${s}`;
    }

    /**
     * Obtém o número de aplicativos ativos.
     * @returns {number} Número de aplicativos ativos.
     */
    getActiveAppsCount() {
        if (!this.appManager || !this.appManager.runningApps) {
            return 0;
        }
        
        let count = 0;
        for (const [instanceId, appInfo] of this.appManager.runningApps.entries()) {
            // Conta apenas apps que não estão minimizados
            if (appInfo.appUIInstance && !appInfo.appUIInstance.isMinimized) {
                count++;
            }
        }
        
        return count;
    }

    /**
     * Atualiza as informações do sistema.
     */
    updateSystemInfo() {
        if (this.uptimeElement) {
            this.uptimeElement.textContent = this.formatUptime();
        } else {
            console.warn(`[${this.appName}] Elemento de uptime não encontrado`);
        }
        
        if (this.activeAppsElement) {
            this.activeAppsElement.textContent = this.getActiveAppsCount().toString();
        } else {
            console.warn(`[${this.appName}] Elemento de apps ativos não encontrado`);
        }
    }

    /**
     * Método chamado quando o aplicativo é executado.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] SystemInfoApp.onRun() started.`);
        console.log(`[${this.appName} - ${this.instanceId}] appContentRoot:`, this.appContentRoot);

        // Obtém referências aos elementos diretamente do appContentRoot
        this.osInfoElement = this.appContentRoot.querySelector('#osInfo');
        this.activeAppsElement = this.appContentRoot.querySelector('#activeApps');
        this.uptimeElement = this.appContentRoot.querySelector('#uptime');

        if (!this.osInfoElement || !this.activeAppsElement || !this.uptimeElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elementos do widget não encontrados!`);
            console.error('Elementos encontrados:', {
                osInfo: this.osInfoElement,
                activeApps: this.activeAppsElement,
                uptime: this.uptimeElement
            });
            return;
        }

        // Define informações estáticas
        this.osInfoElement.textContent = 'unkayOS v1.0';

        // Atualiza informações dinâmicas imediatamente
        this.updateSystemInfo();

        // Inicia o intervalo para atualizar a cada segundo
        this.updateInterval = setInterval(this.updateSystemInfo, 1000);

        // Habilita drag and drop no widget
        this.enableDrag();

        console.log(`[${this.appName} - ${this.instanceId}] Widget de informações do sistema inicializado com sucesso.`);
    }

    /**
     * Habilita drag and drop no widget.
     */
    enableDrag() {
        // Encontra o elemento principal do widget
        const widgetElement = this.appContentRoot.querySelector('.system-info-widget');
        
        if (widgetElement && this.desktopElement) {
            // Habilita arrastar o widget pela área de trabalho
            this.dragCleanup = dragManager.enableDrag(widgetElement, null, {
                constrainToParent: false, // Desabilita restrições para testar
                parentElement: this.desktopElement, // Usa o desktop como referência
                onDragStart: () => {
                    widgetElement.style.cursor = 'grabbing';
                },
                onDragMove: (e, element, position) => {
                    // Feedback visual durante o arrasto
                    widgetElement.style.opacity = '0.9';
                },
                onDragEnd: () => {
                    widgetElement.style.cursor = 'grab';
                    widgetElement.style.opacity = '1';
                }
            });
            
            // Adiciona cursor de arrasto
            widgetElement.style.cursor = 'grab';
            widgetElement.title = 'Arraste para mover';
        }
    }

    /**
     * Método chamado quando o aplicativo é encerrado.
     */
    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do SystemInfoApp executado.`);
        
        // Limpa o drag
        if (this.dragCleanup) {
            this.dragCleanup();
            this.dragCleanup = null;
        }
        
        // Limpa o intervalo de atualização
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Limpa referências DOM para evitar vazamentos de memória
        this.osInfoElement = null;
        this.activeAppsElement = null;
        this.uptimeElement = null;
    }
} 