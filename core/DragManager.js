// core/DragManager.js - v2.0.0

/**
 * Gerenciador de drag and drop para aplicativos do unkayOS.
 * Responsável por permitir que elementos sejam arrastados pela área de trabalho.
 * Baseado na lógica de movimento do AppWindowSystem.
 */
export class DragManager {
    constructor() {
        this.isDragging = false;
        this.currentElement = null;
        this.initialX = 0;
        this.initialY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * Verifica se um elemento deve ser excluído do drag
     * @param {HTMLElement} target - Elemento que foi clicado
     * @param {object} config - Configuração do drag com exclusões
     * @returns {boolean} - true se deve excluir, false caso contrário
     */
    shouldExcludeFromDrag(target, config) {
        // Verifica elementos específicos
        if (config.excludeElements && config.excludeElements.includes(target)) {
            return true;
        }

        // Verifica seletores CSS
        if (config.excludeSelectors && config.excludeSelectors.length > 0) {
            for (const selector of config.excludeSelectors) {
                if (target.matches(selector)) {
                    return true;
                }
                // Também verifica se o target está dentro de um elemento que corresponde ao seletor
                if (target.closest(selector)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Habilita o arrastar em um elemento usando exatamente a mesma lógica do AppWindowSystem.
     * @param {HTMLElement} element - Elemento a ser arrastado
     * @param {HTMLElement} handle - Elemento que serve como "alça" para arrastar (opcional)
     * @param {object} options - Opções de configuração
     * @param {boolean} options.constrainToParent - Se deve restringir ao elemento pai (padrão: true)
     * @param {HTMLElement} options.parentElement - Elemento pai específico para restrições
     * @param {string[]} options.excludeSelectors - Seletores CSS de elementos a excluir do drag
     * @param {HTMLElement[]} options.excludeElements - Elementos específicos a excluir do drag
     * @param {function} options.onDragStart - Callback chamado no início do drag
     * @param {function} options.onDragMove - Callback chamado durante o movimento
     * @param {function} options.onDragEnd - Callback chamado no fim do drag
     */
    enableDrag(element, handle = null, options = {}) {
        const dragHandle = handle || element;
        const config = {
            constrainToParent: options.constrainToParent !== false, // Padrão: true
            parentElement: options.parentElement || null, // Elemento pai específico para restrições
            excludeSelectors: options.excludeSelectors || [], // Seletores de elementos a excluir do drag
            excludeElements: options.excludeElements || [], // Elementos específicos a excluir do drag
            onDragStart: options.onDragStart || null,
            onDragMove: options.onDragMove || null,
            onDragEnd: options.onDragEnd || null,
           // zIndexOnDrag: options.zIndexOnDrag || 1000
        };

        const startDrag = (e) => {
            // Verifica se o clique foi em um elemento excluído do drag
            if (this.shouldExcludeFromDrag(e.target, config)) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            // Se já está arrastando outro elemento, para
            if (this.isDragging) {
                return;
            }

            this.isDragging = true;
            this.currentElement = element;

            // Garante position absolute e z-index
            element.style.position = 'absolute';
            //element.style.zIndex = config.zIndexOnDrag;

            // EXATAMENTE como o AppWindowSystem faz:
            // Captura a posição inicial do mouse
            const startX = e.clientX;
            const startY = e.clientY;
            
            // Captura a posição inicial do elemento (como AppWindowSystem)
            const startLeft = element.offsetLeft;
            const startTop = element.offsetTop;

            // console.log('[DragManager] Início do drag (AppWindowSystem style):', {
            //     startX, startY,
            //     startLeft, startTop,
            //     offsetLeft: element.offsetLeft,
            //     offsetTop: element.offsetTop
            // });

            // Adiciona classe visual durante o arrasto
            element.classList.add('dragging');

            // Chama callback de início do arrasto
            let shouldContinue = true;
            if (config.onDragStart) {
                const result = config.onDragStart(e, element);
                // Se onDragStart retornar false, cancela o arrasto
                if (result === false) {
                    shouldContinue = false;
                }
            }

            // Se o arrasto foi cancelado, para aqui
            if (!shouldContinue) {
                element.classList.remove('dragging');
                this.isDragging = false;
                this.currentElement = null;
                return;
            }

            // EXATAMENTE como o AppWindowSystem faz:
            const onMouseMove = (moveEvent) => {
                // Calcula a diferença como AppWindowSystem
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                console.log('[DragManager] Movimento (AppWindowSystem style):', {
                    dx, dy,
                    startLeft, startTop,
                    newLeft, newTop
                });

                // Aplica restrições básicas (opcional)
                if (config.constrainToParent && config.parentElement) {
                    const minX = 0;
                    const minY = 0;
                    const maxX = Math.max(0, config.parentElement.offsetWidth - element.offsetWidth);
                    const maxY = Math.max(0, config.parentElement.offsetHeight - element.offsetHeight);

                    newLeft = Math.max(minX, Math.min(newLeft, maxX));
                    newTop = Math.max(minY, Math.min(newTop, maxY));
                }

                // Aplica a nova posição em pixels
                element.style.left = newLeft + "px";
                element.style.top = newTop + "px";

                // Chama callback de movimento
                if (config.onDragMove) {
                    config.onDragMove(moveEvent, element, { x: newLeft, y: newTop });
                }
            };

            const onMouseUp = () => {
                this.isDragging = false;

                // Remove classe visual
                element.classList.remove('dragging');

                // Restaura seleção de texto
                document.body.classList.remove('dragging-disabled');

                // Remove listeners temporários
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                // Chama callback de fim do arrasto
                if (config.onDragEnd) {
                    config.onDragEnd(e, element);
                }

                // Limpa referências
                this.currentElement = null;
            };

            // Adiciona listeners temporários (como AppWindowSystem)
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            // Previne seleção de texto durante o arrasto
            document.body.classList.add('dragging-disabled');
        };

        const onMouseUp = (e) => {
            if (!this.isDragging || !this.currentElement) return;

            this.isDragging = false;

            // Remove classe visual
            this.currentElement.classList.remove('dragging');

            // Restaura seleção de texto
            document.body.style.userSelect = '';

            // Remove listeners temporários
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Chama callback de fim do arrasto
            if (config.onDragEnd) {
                config.onDragEnd(e, this.currentElement);
            }

            // Limpa referências
            this.currentElement = null;
        };

        // Adiciona listener ao handle
        dragHandle.addEventListener('mousedown', startDrag);

        // Retorna função para desabilitar o drag
        return () => {
            dragHandle.removeEventListener('mousedown', startDrag);
            // Não precisa remover os listeners de mousemove/mouseup pois eles são locais
            // e são removidos automaticamente quando o drag termina
        };
    }

    /**
     * Habilita o arrastar em múltiplos elementos.
     * @param {Array} elements - Array de objetos {element, handle, options}
     */
    enableDragMultiple(elements) {
        const cleanupFunctions = [];

        elements.forEach(({ element, handle, options }) => {
            const cleanup = this.enableDrag(element, handle, options);
            cleanupFunctions.push(cleanup);
        });

        // Retorna função para desabilitar todos
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    /**
     * Verifica se algum elemento está sendo arrastado.
     * @returns {boolean}
     */
    isCurrentlyDragging() {
        return this.isDragging;
    }

    /**
     * Para o arrasto atual (útil para cancelar programaticamente).
     */
    stopCurrentDrag() {
        if (this.isDragging && this.currentElement) {
            // Simula um mouseup
            const event = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: this.initialX,
                clientY: this.initialY
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Método de conveniência para configurar drag em janelas do sistema
     * @param {HTMLElement} windowElement - Elemento da janela
     * @param {HTMLElement} titleBar - Barra de título
     * @param {object} callbacks - Callbacks específicos da janela
     */
    enableWindowDrag(windowElement, titleBar, callbacks = {}) {
        return this.enableDrag(windowElement, titleBar, {
            excludeSelectors: [
                '.app__top_bar__close_button',
                '.app__top_bar__min_button', 
                '.app__top_bar__max_button',
                'button', // Exclui todos os botões
                'input', // Exclui campos de input
                'select', // Exclui selects
                'textarea' // Exclui textareas
            ],
            constrainToParent: true,
            ...callbacks // Permite override dos callbacks
        });
    }

    /**
     * Método de conveniência para configurar drag em elementos de UI customizada
     * @param {HTMLElement} element - Elemento a ser arrastado
     * @param {HTMLElement} handle - Handle do drag
     * @param {string[]} additionalExclusions - Seletores adicionais para excluir
     * @param {object} callbacks - Callbacks específicos
     */
    enableCustomDrag(element, handle, additionalExclusions = [], callbacks = {}) {
        const defaultExclusions = [
            'button',
            'input',
            'select', 
            'textarea',
            'a',
            '[data-no-drag]' // Atributo especial para marcar elementos não-arrastáveis
        ];

        return this.enableDrag(element, handle, {
            excludeSelectors: [...defaultExclusions, ...additionalExclusions],
            constrainToParent: false,
            ...callbacks
        });
    }
}

// Instância global do DragManager
export const dragManager = new DragManager(); 