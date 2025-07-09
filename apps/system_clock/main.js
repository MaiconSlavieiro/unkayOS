// apps/system_clock/main.js - v1.0.7

import { BaseApp } from '/core/BaseApp.js'; // Caminho absoluto

/**
 * Aplicativo Relógio do Sistema.
 * Um exemplo de aplicativo custom_ui que não usa o sistema de janelas,
 * inicia com o sistema e não pode ser fechado pelo usuário.
 */
export default class SystemClockApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);
        this.timeDisplayElement = null;
        this.intervalId = null;
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * @param {function} [terminalOutputCallback=null] - Função de callback para output no terminal.
     * @param {Array<string>} [appParams=[]] - Parâmetros a serem passados para o app.
     * @param {HTMLElement} [rootElement] - O elemento DOM raiz do aplicativo (o div criado por AppCustomUI).
     */
    onRun(terminalOutputCallback = null, appParams = [], rootElement) {
        console.log(`[${this.appName} - ${this.instanceId}] SystemClockApp.onRun() iniciado.`);
        
        if (!rootElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento raiz do relógio do sistema não fornecido!`);
            return;
        }

        this.timeDisplayElement = rootElement.querySelector('#current-time');

        if (!this.timeDisplayElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento de exibição de tempo (#current-time) não encontrado no rootElement!`);
            return;
        }

        this.updateTime(); // Atualiza o tempo imediatamente
        this.intervalId = this.setInterval(() => {
            this.updateTime();
        }, 1000); // Atualiza a cada segundo
    }

    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        this.timeDisplayElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] SystemClockApp.onCleanup() executado.`);
        if (this.intervalId) {
            this.clearInterval(this.intervalId);
        }
    }
}
