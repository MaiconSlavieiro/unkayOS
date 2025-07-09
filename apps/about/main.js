// apps/about/main.js

import { BaseApp } from '../../core/BaseApp.js'; // Ajuste o caminho conforme a sua estrutura de pastas

/**
 * Aplicativo "About" para exibir informações sobre o UnkayOS.
 */
export default class AboutApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);
        console.log(`[${this.appName} - ${this.instanceId}] Construtor do AboutApp executado.`);

        // Referências aos elementos DOM que serão preenchidos
        this.aboutAppElement = null;
        this.uptimeInfoElement = null;
        this.developerInfoElement = null;
        this.intervalId = null; // Para o timer do uptime
    }

    /**
     * Método chamado quando o aplicativo é executado.
     * Preenche as informações dinamicamente.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] AboutApp.onRun() iniciado.`);

        // O elemento raiz do app é o div com o ID da instância da janela
        this.aboutAppElement = document.getElementById(this.instanceId);

        if (!this.aboutAppElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elemento raiz do AboutApp não encontrado! ID: ${this.instanceId}`);
            return;
        }

        // Obtém referências aos elementos internos
        this.uptimeInfoElement = this.aboutAppElement.querySelector("#uptimeInfo");
        this.developerInfoElement = this.aboutAppElement.querySelector("#developerInfo");

        if (!this.uptimeInfoElement || !this.developerInfoElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Um ou mais elementos do AboutApp (uptime, developer) não foram encontrados!`);
            return;
        }

        // Define o nome do desenvolvedor (pode ser configurável no apps.json ou em outro lugar)
        this.developerInfoElement.textContent = "Maicon Slavieiro / Reverso do Avesso"; // Altere para seu nome/organização

        // Inicia o contador de uptime
        this.startUptimeCounter();
    }

    /**
     * Inicia um contador de uptime simulado.
     */
    startUptimeCounter() {
        let seconds = 0;
        // Tenta recuperar o uptime de uma sessão anterior se houver um GlobalStore
        if (this.globalStore) {
            const storedUptime = this.globalStore.get('unkayosUptimeSeconds');
            if (storedUptime) {
                seconds = parseInt(storedUptime, 10);
                console.log(`[${this.appName} - ${this.instanceId}] Uptime recuperado do GlobalStore: ${seconds} segundos.`);
            }
        }

        const updateUptime = () => {
            seconds++;
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;

            const format = (num) => String(num).padStart(2, '0');

            if (this.uptimeInfoElement) {
                this.uptimeInfoElement.textContent = `${format(hours)}h ${format(minutes)}m ${format(remainingSeconds)}s`;
            }

            // Atualiza o GlobalStore a cada 10 segundos (ou outra frequência)
            if (this.globalStore && seconds % 10 === 0) {
                this.globalStore.setState({ unkayosUptimeSeconds: seconds });
            }
        };

        // Chama imediatamente para exibir 00h 00m 00s ou o valor recuperado
        updateUptime(); 
        // Usa o setInterval gerenciado pelo AppCore
        this.intervalId = this.setInterval(updateUptime, 1000);
    }

    /**
     * Método chamado quando o aplicativo é encerrado.
     * Limpa os recursos.
     */
    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do AboutApp executado.`);
        if (this.intervalId) {
            this.clearInterval(this.intervalId); // Limpa o intervalo de uptime
            this.intervalId = null;
        }
        this.uptimeInfoElement = null;
        this.developerInfoElement = null;
        this.aboutAppElement = null;
    }
}
