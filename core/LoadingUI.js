// /core/LoadingUI.js - v1.0.0
// Interface de loading para aplicações do UnkayOS

import eventBus from './eventBus.js';

export class LoadingUI {
    constructor() {
        this.activeLoadings = new Map(); // instanceId -> loadingElement
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventBus.on('loading:state:changed', ({ instanceId, state }) => {
            this.updateLoadingUI(instanceId, state);
        });

        eventBus.on('loading:complete', ({ instanceId, loadTime, stats }) => {
            this.showCompletionMessage(instanceId, loadTime, stats);
        });

        eventBus.on('loading:error', ({ instanceId, error, resourceType }) => {
            this.showErrorMessage(instanceId, error, resourceType);
        });
    }

    createLoadingOverlay(instanceId, appName = 'Aplicação') {
        const overlay = document.createElement('div');
        overlay.className = 'unkay-loading-overlay';
        overlay.dataset.instanceId = instanceId;
        
        overlay.innerHTML = `
            <div class="unkay-loading-container">
                <div class="unkay-loading-bar">
                    <div class="unkay-loading-fill" style="width: 0%"></div>
                    <div class="unkay-loading-glow"></div>
                </div>
                <div class="unkay-loading-text">Carregando ${appName}...</div>
            </div>
        `;
        
        this.activeLoadings.set(instanceId, overlay);
        return overlay;
    }

    updateLoadingUI(instanceId, state) {
        const overlay = this.activeLoadings.get(instanceId);
        if (!overlay || !state) return;

        // Atualiza progress bar
        const fillElement = overlay.querySelector('.unkay-loading-fill');
        const textElement = overlay.querySelector('.unkay-loading-text');

        if (fillElement) {
            fillElement.style.width = `${state.progress}%`;
            fillElement.className = state.progress === 100 ? 
                'unkay-loading-fill completed' : 
                state.hasError ? 'unkay-loading-fill error' : 'unkay-loading-fill';
        }

        if (textElement && state.currentMessage) {
            textElement.textContent = state.currentMessage;
        }

        // Animação de conclusão
        if (state.progress === 100 && !state.isLoading) {
            overlay.classList.add('completed');
        }
    }

    showCompletionMessage(instanceId, loadTime, stats) {
        const overlay = this.activeLoadings.get(instanceId);
        if (!overlay) return;

        // Mostra mensagem de sucesso brevemente
        const textElement = overlay.querySelector('.unkay-loading-text');
        if (textElement) {
            textElement.textContent = 'Carregamento concluído';
        }

        // Remove o overlay após animação
        setTimeout(() => {
            this.removeLoadingOverlay(instanceId);
        }, 800);
    }

    showErrorMessage(instanceId, error, resourceType) {
        const overlay = this.activeLoadings.get(instanceId);
        if (!overlay) return;

        overlay.classList.add('error');
        const textElement = overlay.querySelector('.unkay-loading-text');
        if (textElement) {
            textElement.textContent = `Erro ao carregar aplicação`;
        }
    }

    removeLoadingOverlay(instanceId) {
        const overlay = this.activeLoadings.get(instanceId);
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.activeLoadings.delete(instanceId);
            }, 300);
        }
    }
}

// Instância global
export const loadingUI = new LoadingUI();
