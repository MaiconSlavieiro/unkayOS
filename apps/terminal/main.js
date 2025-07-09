// apps/terminal/main.js - v1.0.23

// Importe a classe BaseApp
import { BaseApp } from '../../core/BaseApp.js'; // Ajuste o caminho conforme a sua estrutura de pastas
import { commands } from './commands.js'; // Mantenha a importação dos comandos

/**
 * Classe para o aplicativo Terminal, estendendo BaseApp.
 * Gerencia a interface e a lógica do terminal.
 */
export default class TerminalApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs); // Chama o construtor da classe base

        // Referências aos elementos DOM do terminal
        this.terminalAppElement = null; // O elemento div#terminal-app com o ID da instância
        this.terminalOutputElement = null; // Agora é o principal contêiner rolável
        this.inputElement = null;
        this.terminalInputLine = null;
        this.terminalPromptElement = null;

        this.commandHistory = [];
        this.historyIndex = -1;
        this.commands = {}; // Inicializa o objeto de comandos da instância

        // Explicitamente bind methods to ensure 'this' context
        // Bind apenas os métodos que serão passados como callbacks para listeners de evento ou outras funções
        this.writeLine = this.writeLine.bind(this);
        this.clearTerminal = this.clearTerminal.bind(this); // Usado em comandos
        this.processCommand = this.processCommand.bind(this); // Usado em handleKeydown
        this.handleKeydown = this.handleKeydown.bind(this); // Usado em addEventListener
        this.scrollToBottom = this.scrollToBottom.bind(this); // Usado internamente
    }

    /**
     * Registra um comando no terminal.
     * @param {string} name - Nome do comando.
     * @param {function} func - Função a ser executada pelo comando.
     * @param {string} description - Descrição do comando.
     */
    registerCommand(name, func, description = 'Sem descrição.') {
        this.commands[name] = { func, description };
    }

    /**
     * Escreve uma linha no terminal.
     * @param {string} text - O texto a ser escrito.
     * @param {string} [type='output'] - Tipo de mensagem ('output', 'error', 'system').
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

        this.writeLine(`<span class="terminal-prompt">user@reversodoavesso:~$</span> ${commandLine}`, 'input');
        this.commandHistory.unshift(commandLine); // Adiciona ao início do histórico
        this.historyIndex = -1; // Reseta o índice do histórico

        const parts = commandLine.trim().split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (this.commands[commandName]) {
            try {
                // Passa o writeLine pré-vinculado para os comandos, e o appManager da BaseApp
                // O último argumento é a instância do AppManager (this.appManager)
                const result = await this.commands[commandName].func(
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
            } catch (error) {
                this.writeLine(`Erro ao executar '${commandName}': ${error.message}`, 'error');
                console.error(`Erro no comando '${commandName}':`, error);
            }
        } else {
            this.writeLine(`<span class="red">Comando '${commandName}' não encontrado. Digite 'help' para ver os comandos.</span>`, 'error');
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
     * Assume que o HTML já foi injetado no appElement pelo AppWindowSystem.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] TerminalApp.onRun() started. DOM should be ready.`);

        // O elemento raiz do terminal é o próprio appElement, que tem o ID da instância
        // Ele é acessado diretamente pelo document.getElementById(this.instanceId)
        this.terminalAppElement = document.getElementById(this.instanceId);

        if (!this.terminalAppElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento raiz do terminal não encontrado! ID: ${this.instanceId}`);
            return;
        }

        // Acessa os elementos internos do terminal a partir de this.terminalAppElement
        this.terminalOutputElement = this.terminalAppElement.querySelector('#terminalOutput');
        this.inputElement = this.terminalAppElement.querySelector('#terminalInput');
        this.terminalInputLine = this.terminalAppElement.querySelector('.terminal-input-line');
        this.terminalPromptElement = this.terminalAppElement.querySelector('#terminalPrompt'); // Usar ID para o prompt

        if (!this.terminalOutputElement || !this.inputElement || !this.terminalInputLine || !this.terminalPromptElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Um ou mais elementos do terminal (output, input, input-line, prompt) não foram encontrados!`);
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
        this.appCore.appElement.addEventListener('click', () => {
            this.inputElement.focus();
        });
    }

    /**
     * Manipula eventos de teclado no input do terminal.
     * @param {KeyboardEvent} event - O evento de teclado.
     */
    handleKeydown(event) {
        if (event.key === 'Enter') {
            const command = this.inputElement.value;
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
            if (this.commandHistory.length > 0) {
                this.historyIndex--;
                if (this.historyIndex < 0) {
                    this.historyIndex = -1; // Volta para o input vazio
                    this.inputElement.value = '';
                } else {
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                }
            }
        }
    }

    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do TerminalApp executado.`);
        if (this.inputElement) {
            this.inputElement.removeEventListener('keydown', this.handleKeydown);
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
    }
}
