// /core/BaseApp.js - v1.0.19

/**
 * Classe Base para todos os aplicativos no sistema.
 * Fornece acesso à instância do AppCore e a APIs padrão como funções de timer e AppManager.
 */
export class BaseApp {
    /**
     * Construtor da classe base.
     * @param {object} appCoreInstance - A instância do AppCore associada a este aplicativo.
     * @param {object} standardAPIs - Objeto contendo APIs padrão (ex: { setTimeout, setInterval, clearTimeout, clearInterval, appManager }).
     */
    constructor(appCoreInstance, standardAPIs) {
        console.log(`[${appCoreInstance.app_name} - ${appCoreInstance.instanceId}] BaseApp constructor: standardAPIs received:`, standardAPIs);
        if (!appCoreInstance) {
            console.error("BaseApp: appCoreInstance é obrigatório.");
            throw new Error("AppCoreInstance não fornecido ao BaseApp.");
        }
        this.appCore = appCoreInstance;
        this.id = appCoreInstance.id;
        this.instanceId = appCoreInstance.instanceId;
        this.appName = appCoreInstance.app_name;

        this.setTimeout = standardAPIs.setTimeout;
        this.setInterval = standardAPIs.setInterval;
        this.clearTimeout = standardAPIs.clearTimeout;
        this.clearInterval = standardAPIs.clearInterval;
        this.appManager = standardAPIs.appManager; // Instância do AppManager

        console.log(`[${this.appName} - ${this.instanceId}] BaseApp constructor: this.setInterval after assignment:`, this.setInterval);
    }

    onRun() {
        console.warn(`[${this.appName} - ${this.instanceId}] Método 'onRun()' não implementado na classe filha.`);
    }

    onCleanup() {
        // console.log(`[${this.appName} - ${this.instanceId}] Método 'onCleanup()' padrão executado.`);
    }
}
