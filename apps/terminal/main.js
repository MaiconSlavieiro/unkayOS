// apps/terminal/main.js

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
        this.terminalAppElement = null;
        this.terminalOutput = null; // Agora é o principal contêiner rolável
        this.terminalInput = null;
        this.terminalInputLine = null;
        this.terminalPromptElement = null;

        this.commandHistory = [];
        this.historyIndex = -1;

        // Explicitly bind methods to ensure 'this' context
        this.appendToTerminal = this.appendToTerminal.bind(this);
        this.displayInitialMessages = this.displayInitialMessages.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this); // Bind também o scroll
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * Contém a lógica principal de inicialização do terminal.
     * Este método agora é chamado pelo AppWindowSystem APÓS o DOM estar pronto.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] TerminalApp.onRun() started. DOM should be ready.`);

        this.terminalAppElement = document.getElementById(this.instanceId);

        if (!this.terminalAppElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento raiz do terminal não encontrado! ID: ${this.instanceId}`);
            return;
        }

        this.terminalOutput = this.terminalAppElement.querySelector("#terminalOutput");
        this.terminalInput = this.terminalAppElement.querySelector("#terminalInput");
        this.terminalInputLine = this.terminalAppElement.querySelector(".terminal-input-line");
        this.terminalPromptElement = this.terminalAppElement.querySelector(".terminal-prompt");

        if (!this.terminalOutput || !this.terminalInput || !this.terminalInputLine || !this.terminalPromptElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Um ou mais elementos do terminal (output, input, input-line, prompt) não foram encontrados!`);
            return;
        }

        this.terminalInput.addEventListener('keydown', this.handleKeydown);

        this.displayInitialMessages();
        this.terminalInput.focus(); // Foca o input na inicialização
        this.scrollToBottom(); // Garante que o terminal esteja no final
    }

    /**
     * Rola o terminal para o final.
     */
    scrollToBottom() {
        if (this.terminalOutput) {
            this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
        }
    }

    /**
     * Método para adicionar texto ao terminal.
     * Insere novas linhas no final do terminalOutput.
     * @param {string} text - O texto HTML a ser adicionado.
     */
    appendToTerminal(text) {
        if (!this.terminalOutput) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: terminalOutput não está disponível para appendToTerminal.`);
            return;
        }
        const lineElement = document.createElement('span');
        lineElement.innerHTML = text;
        this.terminalOutput.appendChild(lineElement);
        this.scrollToBottom();
    }

    /**
     * Exibe as mensagens iniciais no terminal.
     */
    displayInitialMessages() {
        const messages = [
            '<span class="green">Bem-vindo a reversodoavesso.online</span>',
            '<span class="yellow">Iniciando conexão segura...</span>',
            '<span class="blue">Pronto para comandos.</span>',
            '<span class="yellow">Digite \'help\' para ver os comandos disponíveis.</span>',
            ''
        ];
        messages.forEach(msg => {
            this.appendToTerminal(msg);
        });
    }

    /**
     * Manipula eventos de teclado no input do terminal.
     * @param {KeyboardEvent} event - O evento de teclado.
     */
    handleKeydown(event) {
        if (event.key === 'Enter') {
            const commandLine = this.terminalInput.value.trim();
            this.appendToTerminal(`<span class="terminal-prompt">user@reversodoavesso:~$</span> ${commandLine}`);
            this.terminalInput.value = '';

            if (commandLine) {
                this.commandHistory.push(commandLine);
                this.historyIndex = this.commandHistory.length;
            }

            const parts = commandLine.split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            if (commands[command]) {
                const result = commands[command].action(
                    args,
                    this.appendToTerminal,
                    this.terminalOutput,
                    this.displayInitialMessages,
                    commands,
                    this.appManager
                );
                if (result) {
                    this.appendToTerminal(result);
                }
            } else if (commandLine) {
                this.appendToTerminal(`<span class="red">Comando '${command}' não encontrado. Digite 'help' para ver os comandos.</span>`);
            }
            this.terminalInput.focus();
            this.scrollToBottom();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.terminalInput.value = this.commandHistory[this.historyIndex];
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (this.historyIndex < this.commandHistory.length) {
                this.historyIndex++;
                if (this.historyIndex < this.commandHistory.length) {
                    this.terminalInput.value = this.commandHistory[this.historyIndex];
                } else {
                    this.terminalInput.value = '';
                }
            }
        }
    }

    /**
     * Método chamado quando o aplicativo é encerrado.
     * Use para qualquer lógica de limpeza específica do aplicativo.
     */
    onCleanup() {
        if (this.terminalInput) {
            this.terminalInput.removeEventListener('keydown', this.handleKeydown);
        }
    }
}
