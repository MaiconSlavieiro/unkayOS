// apps/about/main.js - v1.0.1

import { BaseApp } from '../../core/BaseApp.js';

export default class AboutApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);

        this.osNameElement = null;
        this.osVersionElement = null;
        this.kernelInfoElement = null;
        this.uptimeInfoElement = null;
        this.developerInfoElement = null;
        this.aboutDescriptionElement = null;
        this.aboutTitleElement = null;
        this.aboutIconElement = null;

        this.startTime = Date.now(); // Marca o tempo de início do aplicativo
        this.uptimeInterval = null; // Para armazenar o ID do intervalo do uptime
    }

    /**
     * Calcula e formata o tempo de atividade (uptime).
     * @returns {string} Tempo de atividade formatado.
     */
    getUptime() {
        const elapsedMilliseconds = Date.now() - this.startTime;
        const seconds = Math.floor(elapsedMilliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;

        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (remainingHours > 0) uptimeString += `${remainingHours}h `;
        if (remainingMinutes > 0) uptimeString += `${remainingMinutes}m `;
        uptimeString += `${remainingSeconds}s`;

        return uptimeString.trim();
    }

    /**
     * Atualiza o elemento de uptime no DOM.
     */
    updateUptime() {
        if (this.uptimeInfoElement) {
            this.uptimeInfoElement.textContent = this.getUptime();
        }
    }

    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] AboutApp.onRun() started. DOM should be ready.`);

        const shadowRoot = this.appContentRoot.shadowRoot;

        if (!shadowRoot) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Shadow Root não encontrado para o app!`);
            return;
        }

        // Obtém referências aos elementos dentro do Shadow DOM
        this.osNameElement = shadowRoot.querySelector('#osName');
        this.osVersionElement = shadowRoot.querySelector('#osVersion');
        this.kernelInfoElement = shadowRoot.querySelector('#kernelInfo');
        this.uptimeInfoElement = shadowRoot.querySelector('#uptimeInfo');
        this.developerInfoElement = shadowRoot.querySelector('#developerInfo');
        this.aboutDescriptionElement = shadowRoot.querySelector('#aboutDescription');
        this.aboutTitleElement = shadowRoot.querySelector('#aboutTitle');
        this.aboutIconElement = shadowRoot.querySelector('.about-icon');

        // Atualiza o texto do título e do ícone com base nos dados do appCore
        if (this.aboutTitleElement) {
            this.aboutTitleElement.textContent = `Sobre ${this.appCore.app_name}`;
        }
        if (this.aboutIconElement) {
            // O src do ícone no HTML deve ser relativo à pasta do app,
            // mas aqui podemos usar o icon_url resolvido do appCore se necessário,
            // embora para o Shadow DOM, o caminho relativo no HTML seja mais comum.
            // Para este caso, o HTML já usa "about.svg", que é resolvido pelo Shadow DOM.
            // Se o ícone viesse de um URL externo ou de outro lugar, poderíamos usar:
            // this.aboutIconElement.src = this.appCore.icon_url;
        }


        // Inicia o intervalo para atualizar o uptime a cada segundo
        this.uptimeInterval = this.setInterval(this.updateUptime.bind(this), 1000);
        this.updateUptime(); // Chama uma vez imediatamente para exibir o uptime inicial
    }

    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do AboutApp executado.`);
        if (this.uptimeInterval) {
            this.clearInterval(this.uptimeInterval); // Limpa o intervalo
            this.uptimeInterval = null;
        }
        // Limpar referências DOM para evitar vazamentos de memória
        this.osNameElement = null;
        this.osVersionElement = null;
        this.kernelInfoElement = null;
        this.uptimeInfoElement = null;
        this.developerInfoElement = null;
        this.aboutDescriptionElement = null;
        this.aboutTitleElement = null;
        this.aboutIconElement = null;
    }
}
