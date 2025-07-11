// apps/clock/main.js - v2.1.0 (Com DragManager integrado)

import { BaseApp } from '../../core/BaseApp.js';
import { dragManager } from '../../core/DragManager.js';

/**
 * Aplicativo de relógio de desktop que exibe hora e data em tempo real.
 * Este é um exemplo de aplicativo desktop_ui que é parte fundamental do ambiente.
 * 
 * NOVA ESTRATÉGIA: Sem Shadow DOM - acesso direto aos elementos
 */
export default class ClockApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);

        // Referências aos elementos DOM
        this.timeElement = null;
        this.dateElement = null;
        
        // Intervalo para atualização do relógio
        this.clockInterval = null;
        
        // Drag and drop
        this.dragCleanup = null;
        
        // Bind methods
        this.updateClock = this.updateClock.bind(this);
        this.formatTime = this.formatTime.bind(this);
        this.formatDate = this.formatDate.bind(this);
    }

    /**
     * Formata a hora atual no formato HH:MM:SS.
     * @param {Date} date - Data/hora a ser formatada.
     * @returns {string} Hora formatada.
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Formata a data atual no formato DD/MM/YYYY.
     * @param {Date} date - Data a ser formatada.
     * @returns {string} Data formatada.
     */
    formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Atualiza o display do relógio com a hora e data atuais.
     */
    updateClock() {
        const now = new Date();
        
        if (this.timeElement) {
            this.timeElement.textContent = this.formatTime(now);
        } else {
            console.warn(`[${this.appName}] Elemento de tempo não encontrado`);
        }
        
        if (this.dateElement) {
            this.dateElement.textContent = this.formatDate(now);
        } else {
            console.warn(`[${this.appName}] Elemento de data não encontrado`);
        }
    }

    /**
     * Método chamado quando o aplicativo é executado.
     */
    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] ClockApp.onRun() started.`);

        // Obtém referências aos elementos diretamente do appContentRoot
        this.timeElement = this.appContentRoot.querySelector('#clockTime');
        this.dateElement = this.appContentRoot.querySelector('#clockDate');

        if (!this.timeElement || !this.dateElement) {
            console.error(`[${this.appName} - ${this.instanceId}] Erro: Elementos do relógio não encontrados!`);
            console.error('Elementos encontrados:', {
                timeElement: this.timeElement,
                dateElement: this.dateElement
            });
            return;
        }

        // Atualiza o relógio imediatamente
        this.updateClock();

        // Inicia o intervalo para atualizar a cada segundo
        this.clockInterval = setInterval(this.updateClock, 1000);

        // Habilita drag and drop no widget
        this.enableDrag();

        console.log(`[${this.appName} - ${this.instanceId}] Relógio de desktop inicializado com sucesso.`);
    }

    /**
     * Habilita drag and drop no widget.
     */
    enableDrag() {
        // Encontra o elemento principal do widget
        const widgetElement = this.appContentRoot.querySelector('.clock-widget');
        
        if (widgetElement && this.desktopElement) {
            // Habilita arrastar o widget pela área de trabalho
            this.dragCleanup = dragManager.enableDrag(widgetElement, null, {
                constrainToParent: false, // Desabilita restrições para testar
                parentElement: this.desktopElement, // Usa o desktop como referência
                onDragStart: () => {
                    widgetElement.style.cursor = 'grabbing';
                },
                onDragMove: (e, element, position) => {
                    // Feedback visual durante o arrasto
                    widgetElement.style.opacity = '0.9';
                },
                onDragEnd: () => {
                    widgetElement.style.cursor = 'grab';
                    widgetElement.style.opacity = '1';
                }
            });
            
            // Adiciona cursor de arrasto
            widgetElement.style.cursor = 'grab';
            widgetElement.title = 'Arraste para mover';
        }
    }

    /**
     * Método chamado quando o aplicativo é encerrado.
     */
    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do ClockApp executado.`);
        
        // Limpa o drag
        if (this.dragCleanup) {
            this.dragCleanup();
            this.dragCleanup = null;
        }
        
        // Limpa o intervalo do relógio
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }

        // Limpa referências DOM para evitar vazamentos de memória
        this.timeElement = null;
        this.dateElement = null;
    }
} 