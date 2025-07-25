// core/BaseApp.js - v1.0.2 

/**
 * Classe base para todos os aplicativos do sistema.
 * Padrão obrigatório:
 * - Todo acesso ao DOM deve ser feito a partir de this.appContentRoot (nunca do document global).
 * - IDs em HTML dos apps são apenas para escopo local.
 * - Métodos de ciclo de vida: onRun() para inicialização, onCleanup() para limpeza.
 * - Use os utilitários this.$(selector) e this.$$(selector) para acessar elementos do DOM local.
 */
export class BaseApp {
    /**
     * Construtor da BaseApp.
     * @param {AppCore} CORE - A instância do AppCore associada a este aplicativo.
     * @param {object} standardAPIs - Objeto contendo APIs padrão (setTimeout, setInterval, appManager, etc.).
     * @param {HTMLElement} [appContentRoot=null] - O elemento raiz onde o conteúdo do app é renderizado.
     * @param {HTMLElement} [desktopElement=null] - O elemento desktop para referência de posicionamento.
     */
    constructor(CORE, standardAPIs, appContentRoot = null, desktopElement = null) {
        this.appCore = CORE;
        this.instanceId = CORE.instanceId;
        this.appName = CORE.app_name;
        // APIs padrão fornecidas pelo sistema
        this.setTimeout = standardAPIs.setTimeout;
        this.setInterval = standardAPIs.setInterval;
        this.clearTimeout = standardAPIs.clearTimeout;
        this.clearInterval = standardAPIs.clearInterval;
        // O elemento HTML que contém o conteúdo do aplicativo.
        this.appContentRoot = appContentRoot;
        // O elemento desktop para referência de posicionamento e drag and drop
        this.desktopElement = desktopElement;
        // Adiciona parâmetro help ao schema se não existir
        const ctor = this.constructor;
        if (!ctor.parameters) ctor.parameters = {};
        if (!ctor.parameters.help) {
            ctor.parameters.help = {
                type: 'boolean',
                required: false,
                description: 'Exibe esta mensagem de ajuda com os parâmetros aceitos pelo app.'
            };
        }
    }

    /**
     * Utilitário para buscar um elemento dentro do DOM local da instância.
     * @param {string} selector - Seletor CSS.
     * @returns {Element|null}
     */
    $(selector) {
        return this.appContentRoot ? this.appContentRoot.querySelector(selector) : null;
    }

    /**
     * Utilitário para buscar todos os elementos dentro do DOM local da instância.
     * @param {string} selector - Seletor CSS.
     * @returns {NodeListOf<Element>}
     */
    $$(selector) {
        return this.appContentRoot ? this.appContentRoot.querySelectorAll(selector) : [];
    }

    /**
     * Método a ser sobrescrito pelos aplicativos.
     * É chamado quando o aplicativo é executado e seu DOM está pronto.
     * @param {function} [terminalOutputCallback=null] - Callback para enviar saída para o terminal (usado por apps headless).
     * @param {object} [appParams={}] - Parâmetros nomeados passados ao iniciar o app.
     */
    onRun(terminalOutputCallback = null, appParams = {}) {
        if (appParams.help) {
            const helpText = this.getHelpText();
            if (typeof terminalOutputCallback === 'function') {
                terminalOutputCallback(helpText);
            } else {
                alert(helpText);
            }
            return;
        }
        console.warn(`[${this.appName} - ${this.instanceId}] Método onRun() não implementado na classe base. Por favor, implemente-o em sua classe de aplicativo.`);
    }

    /**
     * Método a ser sobrescrito pelos aplicativos para limpeza de recursos.
     * É chamado quando o aplicativo é encerrado.
     */
    onCleanup() {
        console.warn(`[${this.appName} - ${this.instanceId}] Método onCleanup() não implementado na classe base. Considere limpar listeners e recursos aqui.`);
    }

    /**
     * Retorna o texto de ajuda formatado com base no schema de parâmetros.
     */
    getHelpText() {
        const schema = this.constructor.parameters || {};
        let help = `Parâmetros aceitos por ${this.appName}:\n`;
        for (const [key, def] of Object.entries(schema)) {
            help += `- ${key} (${def.type})${def.required ? ' [obrigatório]' : ''}: ${def.description || ''}\n`;
        }
        return help;
    }
}
