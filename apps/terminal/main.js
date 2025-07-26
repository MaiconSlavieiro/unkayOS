// apps/terminal/main.js - v2.0.0 (Refatorado sem Shadow DOM)

// Importe a classe BaseApp
import { BaseApp } from '../../core/BaseApp.js';
import { commands } from './commands.js';
import eventBus from '../../core/eventBus.js';

/**
 * Classe para o aplicativo Terminal, estendendo BaseApp.
 * Gerencia a interface e a lógica do terminal.
 * 
 * NOVA ESTRATÉGIA: Sem Shadow DOM - acesso direto aos elementos
 */
export default class TerminalApp extends BaseApp {
    /**
     * Construtor do TerminalApp.
     * @param {AppCore} CORE - A instância do AppCore.
     * @param {object} standardAPIs - APIs padrão fornecidas pelo sistema.
     */
    constructor(CORE, standardAPIs) {
        // O appContentRoot será definido pelo AppWindowSystem antes de onRun ser chamado,
        // então não o passamos aqui diretamente.
        super(CORE, standardAPIs);

        // Referências aos elementos DOM do terminal
        this.terminalAppElement = null; // O elemento div#terminal-app
        this.terminalOutputElement = null; // O principal contêiner rolável
        this.inputElement = null;
        this.terminalInputLine = null;
        this.terminalPromptElement = null;

        this.commandHistory = [];
        this.historyIndex = -1;
        this.commands = {}; // Inicializa o objeto de comandos da instância

        // Referência ao sistema de arquivos
        this.fs = window.unkayFileSystem?.fs || null;

        // Explicitamente bind methods to ensure 'this' context
        // Bind apenas os métodos que serão passados como callbacks para listeners de evento ou outras funções
        this.writeLine = this.writeLine.bind(this);
        this.clearTerminal = this.clearTerminal.bind(this); // Usado em comandos
        this.processCommand = this.processCommand.bind(this); // Usado em handleKeydown
        this.handleKeydown = this.handleKeydown.bind(this); // Usado em addEventListener
        this.scrollToBottom = this.scrollToBottom.bind(this); // Usado internamente
        this.updatePrompt = this.updatePrompt.bind(this); // Atualiza o prompt quando diretório muda
    }

    /**
     * Atualiza o prompt do terminal com usuário e diretório atual
     */
    updatePrompt() {
        if (this.terminalPromptElement) {
            const promptText = authSystem.getAPI().getUserPrompt();
            const currentDir = this.fs ? this.fs.pwd() : '~';
            const dirDisplay = currentDir === '/home/user' ? '~' : currentDir;
            this.terminalPromptElement.textContent = `${promptText}:${dirDisplay}$`;
        }
    }

    /**
     * Registra um comando no terminal.
     * @param {string} name - Nome do comando.
     * @param {function} func - Função a ser executada pelo comando.
     * @param {string} description - Descrição do comando.
     */
    registerCommand(name, func, description = 'Sem descrição.') {
        this.commands[name] = { action: func, description };
    }

    // Exemplo: comando para iniciar app via eventBus
    startAppViaEventBus(appId, params = []) {
        eventBus.emit('app:start', { appId, params });
    }

    stopAppViaEventBus(instanceId) {
        eventBus.emit('app:stop', { instanceId });
    }

    /**
     * Escreve uma linha no terminal.
     * @param {string} text - O texto a ser escrito.
     * @param {string} [type='output'] - Tipo de mensagem ('output', 'input', 'error', 'system').
     */
    writeLine(text, type = 'output') {
        if (this.terminalOutputElement) {
            const line = document.createElement('div');
            line.classList.add('terminal-line', `terminal-line--${type}`);
            line.innerHTML = text; // Usar innerHTML para permitir tags HTML no texto
            this.terminalOutputElement.appendChild(line);
            // Rola para a última linha
            this.scrollToBottom();
        } else {
            console.warn(`[${this.appName} - ${this.instanceId}] Terminal output element not found. Text: ${text}`);
        }
    }

    /**
     * Rola o terminal para o final.
     */
    scrollToBottom() {
        if (this.terminalOutputElement) {
            this.terminalOutputElement.scrollTop = this.terminalOutputElement.scrollHeight;
        }
    }

    /**
     * Limpa o conteúdo do terminal.
     */
    clearTerminal() {
        if (this.terminalOutputElement) {
            this.terminalOutputElement.innerHTML = '';
        }
    }

    /**
     * Processa um comando digitado no terminal.
     * @param {string} commandLine - A linha de comando digitada.
     */
    async processCommand(commandLine) {
        if (!commandLine.trim()) return;

        console.log(`[${this.appName}] Processando comando: "${commandLine}"`);

        const user = authSystem.getAPI().getUserPrompt();
        const currentDir = this.fs ? this.fs.pwd() : '~';
        const dirDisplay = currentDir === '/home/user' ? '~' : currentDir;

        this.writeLine(`<span class="terminal-prompt">${user}:${dirDisplay}$</span> ${commandLine}`, 'input');
        this.commandHistory.unshift(commandLine); // Adiciona ao início do histórico
        this.historyIndex = -1; // Reseta o índice do histórico

        const parts = commandLine.trim().split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        console.log(`[${this.appName}] Comando: "${commandName}", Args:`, args);
        console.log(`[${this.appName}] Comandos disponíveis:`, Object.keys(this.commands));

        if (this.commands[commandName]) {
            try {
                console.log(`[${this.appName}] Executando comando: ${commandName}`);
                // Passa o writeLine pré-vinculado para os comandos, e o appManager da BaseApp
                // O último argumento é a instância do AppManager (this.appManager)
                const result = await this.commands[commandName].action( // Usa .action
                    args,
                    this.writeLine, // appendToTerminal
                    this.terminalOutputElement, // terminalOutput (para comandos como 'clear')
                    null, // displayInitialMessages (não é mais usado diretamente pelos comandos)
                    this.commands, // allCommands (para o comando help)
                    this.appManager // appManager (para comandos como 'ps', 'start', 'stop')
                );
                if (result) {
                    this.writeLine(result);
                }
                
                // Atualiza o prompt após comandos que podem mudar o diretório
                this.updatePrompt();
                
                console.log(`[${this.appName}] Comando ${commandName} executado com sucesso`);
            } catch (error) {
                console.error(`[${this.appName}] Erro ao executar comando ${commandName}:`, error);
                this.writeLine(`Erro ao executar '${commandName}': ${error.message}`, 'error');
            }
        } else {
            // Novo: tentar rodar app como comando CLI
            try {
                // Procurar app nos apps carregados
                const appId = commandName;
                // Tenta encontrar o caminho do app
                const appDetails = window.appManager?.loadedAppDetails?.get(appId);
                if (appDetails && appDetails.jsFile) {
                    const module = await import(appDetails.jsFile);
                    if (module.default && typeof module.default.runCli === 'function') {
                        await module.default.runCli(args, this.writeLine);
                        return;
                    }
                }
            } catch (e) {
                // Se erro ao importar, ignora e mostra mensagem padrão
            }
            this.writeLine(`<span class="red">Comando ou app '${commandName}' não encontrado. Digite 'help' para ver os comandos.</span>`, 'error');
        }
    }

    /**
     * Inicializa os comandos do terminal a partir do objeto 'commands' importado.
     */
    initializeCommands() {
        this.commands = {}; // Reinicializa para garantir que não há comandos antigos

        // Loop através dos comandos importados e registra-os
        for (const cmdName in commands) {
            if (commands.hasOwnProperty(cmdName)) {
                this.registerCommand(cmdName, commands[cmdName].action, commands[cmdName].description);
            }
        }
        console.log(`[${this.appName} - ${this.instanceId}] Comandos inicializados:`, Object.keys(this.commands));
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * Assume que o HTML já foi injetado no appContentRoot.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] TerminalApp.onRun() started. DOM should be ready.`);

        // Acessa os elementos internos do terminal diretamente do appContentRoot usando utilitários padronizados
        this.terminalAppElement = this.$('#terminal-app');
        this.terminalOutputElement = this.$('#terminalOutput');
        this.inputElement = this.$('#terminalInput');
        this.terminalInputLine = this.$('.terminal-input-line');
        this.terminalPromptElement = this.$('#terminalPrompt');

        // Atualiza o prompt dinamicamente com o valor do AuthSystem e diretório atual
        this.updatePrompt();

        // Listener para mudanças de autenticação
        const api = authSystem.getAPI();
        if (api && typeof api.on === 'function') {
            this._authChangeHandler = () => {
                this.updatePrompt();
            };
            api.on('change', this._authChangeHandler);
        }

        if (!this.terminalAppElement || !this.terminalOutputElement || !this.inputElement || !this.terminalInputLine || !this.terminalPromptElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Um ou mais elementos do terminal não foram encontrados!`);
            console.error('Elementos encontrados:', {
                terminalApp: this.terminalAppElement,
                output: this.terminalOutputElement,
                input: this.inputElement,
                inputLine: this.terminalInputLine,
                prompt: this.terminalPromptElement
            });
            return;
        }

        this.initializeCommands(); // Popula this.commands

        this.inputElement.addEventListener('keydown', this.handleKeydown);

        this.writeLine('Bem-vindo ao Terminal OS! Digite "help" para começar.');
        this.inputElement.focus(); // Foca o input na inicialização
        this.scrollToBottom(); // Garante que o terminal esteja no final

        // Adiciona um listener de clique ao elemento da janela para refocar o input
        // Isso é importante para que o usuário possa clicar em qualquer lugar da janela do terminal
        // e o foco volte para o input.
        this.appContentRoot.addEventListener('click', () => {
            this.inputElement.focus();
        });

        // Adiciona listeners para feedback de apps
        eventBus.on('app:started', ({ appId, instanceId }) => {
            this.writeLine(`<span class='green'>Aplicativo '${appId}' iniciado com sucesso. Instance ID: ${instanceId}</span>`);
        });
        eventBus.on('app:start:error', ({ appId, reason }) => {
            this.writeLine(`<span class='red'>Erro ao iniciar aplicativo '${appId}': ${reason}</span>`, 'error');
        });
        eventBus.on('app:killall:done', ({ count }) => {
            this.writeLine(`<span class='green'>Comando killall executado. ${count} aplicativo(s) encerrado(s).</span>`);
        });

        console.log(`[${this.appName} - ${this.instanceId}] Terminal inicializado com sucesso`);
    }

    /**
     * Manipula eventos de teclado no input do terminal.
     * @param {KeyboardEvent} event - O evento de teclado.
     */
    handleKeydown(event) {
        console.log(`[${this.appName}] Tecla pressionada: ${event.key}`);

        if (event.key === 'Enter') {
            const command = this.inputElement.value;
            console.log(`[${this.appName}] Comando digitado: "${command}"`);
            this.inputElement.value = '';
            this.processCommand(command);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault(); // Previne o movimento do cursor no input
            if (this.commandHistory.length > 0) {
                this.historyIndex = (this.historyIndex + 1) % this.commandHistory.length;
                this.inputElement.value = this.commandHistory[this.historyIndex];
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault(); // Previne o movimento do cursor no input
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputElement.value = this.commandHistory[this.historyIndex];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1; // Volta para o input vazio
                this.inputElement.value = '';
            }
        }
    }

    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do TerminalApp executado.`);
        if (this.inputElement) {
            this.inputElement.removeEventListener('keydown', this.handleKeydown);
        }
        if (this.appContentRoot) {
            // Remove o listener de clique do elemento da janela
            this.appContentRoot.removeEventListener('click', () => {
                this.inputElement.focus();
            });
        }
        // Limpar referências DOM para evitar vazamentos de memória
        this.terminalAppElement = null;
        this.terminalOutputElement = null;
        this.inputElement = null;
        this.terminalInputLine = null;
        this.terminalPromptElement = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.commands = {}; // Limpar comandos também

        // Remove listener de mudança de autenticação
        const api = authSystem.getAPI();
        if (api && typeof api.off === 'function' && this._authChangeHandler) {
            api.off('change', this._authChangeHandler);
        }
    }
}
