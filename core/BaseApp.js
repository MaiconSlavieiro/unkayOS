// core/BaseApp.js - v1.0.1 (Nova classe base para aplicativos)

/**
 * Classe base para todos os aplicativos do sistema.
 * Fornece acesso ao AppCore, APIs padrão e ao elemento raiz do conteúdo do aplicativo.
 */
export class BaseApp {
        /**
     * Construtor da BaseApp.
     * @param {AppCore} appCoreInstance - A instância do AppCore associada a este aplicativo.
     * @param {object} standardAPIs - Objeto contendo APIs padrão (setTimeout, setInterval, appManager, etc.).
     * @param {HTMLElement} [appContentRoot=null] - O elemento raiz onde o conteúdo do app é renderizado.
     * @param {HTMLElement} [desktopElement=null] - O elemento desktop para referência de posicionamento.
     */
    constructor(appCoreInstance, standardAPIs, appContentRoot = null, desktopElement = null) {
        this.appCore = appCoreInstance;
        this.instanceId = appCoreInstance.instanceId;
        this.appName = appCoreInstance.app_name;
        
        // APIs padrão fornecidas pelo sistema
        this.appManager = standardAPIs.appManager;
        this.setTimeout = standardAPIs.setTimeout;
        this.setInterval = standardAPIs.setInterval;
        this.clearTimeout = standardAPIs.clearTimeout;
        this.clearInterval = standardAPIs.clearInterval;

        // O elemento HTML que contém o conteúdo do aplicativo.
        // Os apps que estendem BaseApp devem usar este elemento para consultar o DOM interno.
        this.appContentRoot = appContentRoot;
        
        // O elemento desktop para referência de posicionamento e drag and drop
        this.desktopElement = desktopElement;
    }

    /**
     * Método a ser sobrescrito pelos aplicativos.
     * É chamado quando o aplicativo é executado e seu DOM está pronto.
     * @param {function} [terminalOutputCallback=null] - Callback para enviar saída para o terminal (usado por apps headless).
     * @param {Array<string>} [appParams=[]] - Parâmetros passados ao iniciar o app.
     */
    onRun(terminalOutputCallback = null, appParams = []) {
        console.warn(`[${this.appName} - ${this.instanceId}] Método onRun() não implementado na classe base. Por favor, implemente-o em sua classe de aplicativo.`);
    }

    /**
     * Método a ser sobrescrito pelos aplicativos para limpeza de recursos.
     * É chamado quando o aplicativo é encerrado.
     */
    onCleanup() {
        console.warn(`[${this.appName} - ${this.instanceId}] Método onCleanup() não implementado na classe base. Considere limpar listeners e recursos aqui.`);
    }
}
