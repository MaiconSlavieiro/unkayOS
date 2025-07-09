// apps/my_headless_app/main.js - v1.0.7

import { BaseApp } from '/core/BaseApp.js'; // Caminho absoluto

/**
 * Exemplo de aplicativo Headless que estende BaseApp.
 * A lógica principal é definida no método onRun().
 */
export default class MyHeadlessApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs); 
        this.counter = 0;
        this.intervalId = null; 
        this.terminalOutput = null; // Será definido em onRun
        this.params = []; // Será definido em onRun
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * Contém a lógica principal do aplicativo headless.
     * @param {function} [appendToTerminalCallback] - Função para enviar output para o terminal.
     * @param {Array<string>} [appParams] - Parâmetros passados ao iniciar o app.
     * @param {HTMLElement} [rootElement=null] - O elemento DOM raiz do aplicativo (será null para apps headless).
     */
    onRun(appendToTerminalCallback = null, appParams = [], rootElement = null) { 
        this.terminalOutput = appendToTerminalCallback;
        this.params = appParams;

        if (this.terminalOutput) {
            this.terminalOutput(`[${this.appName} - ${this.instanceId}] Método onRun() iniciado! Parâmetros recebidos: [${this.params.join(', ')}]`);
        } else {
            console.log(`[${this.appName} - ${this.instanceId}] Método onRun() iniciado! Parâmetros recebidos: [${this.params.join(', ')}] (Sem output para terminal)`);
        }

        const delay = this.params.includes('fast') ? 1000 : 3000;

        this.intervalId = this.setInterval(() => {
            this.counter++;
            const message = `[${this.appName} - ${this.instanceId}] Executando lógica headless... Contador: ${this.counter}`;
            if (this.terminalOutput) {
                this.terminalOutput(message);
            } else {
                console.log(message);
            }

            if (this.counter >= 10) {
                const stopMessage = `[${this.appName} - ${this.instanceId}] Parando execução após 10 ciclos.`;
                if (this.terminalOutput) {
                    this.terminalOutput(stopMessage);
                } else {
                    console.log(stopMessage);
                }
                this.clearInterval(this.intervalId);

                if (this.appManager) {
                    if (this.terminalOutput) {
                        this.terminalOutput(`[${this.appName} - ${this.instanceId}] Auto-encerrando e chamando removeApp.`);
                    }
                    this.appManager.removeApp(this.instanceId);
                }
            }
        }, delay);
    }

    /**
     * Método chamado quando o aplicativo é encerrado (pelo AppCore.stop()).
     * Use para qualquer lógica de limpeza específica do aplicativo.
     */
    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do MyHeadlessApp executado.`);
        if (this.intervalId) {
            this.clearInterval(this.intervalId);
        }
    }
}
