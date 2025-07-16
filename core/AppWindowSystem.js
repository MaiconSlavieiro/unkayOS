// /core/AppWindowSystem.js - v2.1.0 (Com PositionManager integrado)

import { positionManager } from './PositionManager.js';
import { dragManager } from './DragManager.js';

export class AppWindowSystem {
    constructor(core, desktopElement) { // Renomeado 'desktop' para 'desktopElement' para clareza
        this.core = core;
        this.desktopElement = desktopElement; // O elemento principal (div#desktop)
        this.instanceId = core.instanceId;
        this.appName = core.app_name;
        this.namespace = `app-${core.id}-${core.instanceId}`;

        const appData = core.rawData; // Usa appData completo do AppCore

        // Propriedades iniciais da janela
        this.initialWidth = appData.width || "35vw";
        this.initialHeight = appData.height || "35vh";
        this.initialX = appData.x_position || "10vw";
        this.initialY = appData.y_position || "10vh";

        this.min_width = appData.min_width || 200; // Valor padrão para min_width
        this.min_height = appData.min_height || 100; // Valor padrão para min_height

        this.is_fullscreen = false;

        // Variáveis para armazenar a posição e tamanho atuais (em string, como no original)
        this.currentWidth = null;
        this.currentHeight = null;
        this.currentX = null;
        this.currentY = null;

        // Armazenar a posição e tamanho antes de maximizar/minimizar (em pixels)
        // Usa o PositionManager para obter posições em pixels
        const pixelPositions = positionManager.getPixelPositions(appData);
        this.restoreWidth = pixelPositions.width;
        this.restoreHeight = pixelPositions.height;
        this.restoreX = pixelPositions.x;
        this.restoreY = pixelPositions.y;

        this.isMaximized = false;
        this.isMinimized = false;

        // Binds para garantir que 'this' se refira à instância da classe nos event listeners
        this.toggleMaximize = this.toggleMaximize.bind(this);
this.emitTaskbarIconState = this.emitTaskbarIconState.bind(this);
        this.emitTaskbarIconStateIfChanged = this.emitTaskbarIconStateIfChanged.bind(this);
        this._lastTaskbarState = null;
        this.toggleVisibility = this.toggleVisibility.bind(this);
        this.namespaceCSS = this.namespaceCSS.bind(this);

        this.createWindow();
    }



    /**
     * Aplica namespace CSS ao conteúdo para evitar conflitos.
     * @param {string} css - CSS original
     * @returns {string} CSS com namespace aplicado
     */
    namespaceCSS(css) {
        if (!css) return '';
        
        // Remove comentários CSS para evitar problemas
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Para apps de system_window, sempre aplica namespace
        // pois eles precisam de isolamento
        const globalSelectors = ['html', 'body', ':root', '*', '::before', '::after'];
        
        return css.replace(/([^}]*){/g, (match, selector) => {
            // Se for um seletor global, não aplica namespace
            if (globalSelectors.some(global => selector.trim().includes(global))) {
                return match;
            }
            
            // Aplica namespace ao seletor
            const selectors = selector.split(',').map(s => {
                s = s.trim();
                if (s.startsWith('.' + this.namespace)) {
                    return s; // Já tem namespace
                }
                return `.${this.namespace} ${s}`;
            });
            
            return selectors.join(', ') + '{';
        });
    }

    /**
     * Cria o elemento DIV da janela do aplicativo e o anexa ao DOM.
     */
    async createWindow() {
        this.appWindowElement = document.createElement('div');
        this.appWindowElement.classList.add('app', this.namespace);
        this.appWindowElement.id = this.instanceId; // Define o ID da instância na janela
        this.appWindowElement.dataset.appType = 'system_window';

        // Aplica dimensões e posição iniciais em pixels
        this.appWindowElement.style.width = `${this.restoreWidth}px`;
        this.appWindowElement.style.height = `${this.restoreHeight}px`;
        this.appWindowElement.style.left = `${this.restoreX}px`;
        this.appWindowElement.style.top = `${this.restoreY}px`;

        // Barra de título
        const topBar = document.createElement('div');
        topBar.classList.add('app__top_bar');

        const appNameSpan = document.createElement('span');
        appNameSpan.classList.add('app__top_bar__app_name');
        appNameSpan.textContent = this.appName; // Usa appName da instância
        topBar.appendChild(appNameSpan);

        // Habilita o arrastar na barra de título usando DragManager
        this.dragCleanup = dragManager.enableDrag(this.appWindowElement, topBar, {
            onDragStart: () => {
                // Foca a janela quando começa a arrastar
                import('./eventBus.js').then(({ default: eventBus }) => {
                    eventBus.emit('window:focus', { instanceId: this.instanceId });
                });
            },
            onDragEnd: () => {
                // Atualiza posição de restauração
                const rect = this.appWindowElement.getBoundingClientRect();
                this.restoreX = rect.left;
                this.restoreY = rect.top;
            }
        });

        // Botões de controle (minimizar, maximizar, fechar)
        const minButton = document.createElement('div');
        minButton.classList.add('app__top_bar__min_button');
        minButton.title = 'Minimizar';
        minButton.addEventListener('click', (e) => {
            e.stopPropagation();
            import('./eventBus.js').then(({ default: eventBus }) => {
                eventBus.emit('window:minimize', { instanceId: this.instanceId });
            });
        });
        topBar.appendChild(minButton);

        const maxButton = document.createElement('div');
        maxButton.classList.add('app__top_bar__max_button');
        maxButton.title = 'Maximizar/Restaurar';
        maxButton.addEventListener('click', (e) => {
            e.stopPropagation();
            import('./eventBus.js').then(({ default: eventBus }) => {
                if (this.isMaximized) {
                    eventBus.emit('window:unmaximize', { instanceId: this.instanceId });
                } else {
                    eventBus.emit('window:maximize', { instanceId: this.instanceId });
                }
            });
        });
        topBar.appendChild(maxButton);

        const closeButton = document.createElement('div');
        closeButton.classList.add('app__top_bar__close_button');
        closeButton.title = 'Fechar';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            import('./eventBus.js').then(({ default: eventBus }) => {
                eventBus.emit('window:close', { instanceId: this.instanceId });
            });
        });
        topBar.appendChild(closeButton);

        this.appWindowElement.appendChild(topBar);

        // Área de conteúdo (onde o HTML do app será carregado)
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('app__content');
        this.appWindowElement.appendChild(contentDiv);

        // *** NOVA ESTRATÉGIA: Sem Shadow DOM - injeção direta ***
        this.appContentRoot = contentDiv; // O elemento de conteúdo direto

        // Bordas de redimensionamento
        this.createResizeHandles();

        // Anexa a janela ao div#desktop
        this.desktopElement.appendChild(this.appWindowElement);

        // Adiciona listener para focar a janela ao clicar em qualquer lugar nela
        this.appWindowElement.addEventListener('mousedown', () => {
            import('./eventBus.js').then(({ default: eventBus }) => {
                eventBus.emit('window:focus', { instanceId: this.instanceId });
            });
            this.emitTaskbarIconStateIfChanged('active');
        });

        // Carrega o conteúdo HTML e CSS do aplicativo DENTRO do elemento de conteúdo
        await this.loadAppContent();

        // Chama onRun() na instância do aplicativo APÓS o elemento da janela ser anexado ao DOM
        // e o conteúdo HTML/CSS carregado.
        if (this.core.appInstance && typeof this.core.appInstance.onRun === "function") {
            // Define o appContentRoot na instância do aplicativo para que ele possa acessar seu próprio DOM
            this.core.appInstance.appContentRoot = this.appContentRoot;
            this.core.appInstance.onRun();
        } else {
            console.warn(`[${this.appName} - ${this.instanceId}] Nenhuma instância de app ou método onRun encontrado para chamar após renderização.`);
        }
    }

    /**
     * Cria as alças de redimensionamento nas bordas da janela.
     */
    createResizeHandles() {
        const borders = [
            ["app__board_right", this.enableResizeRight.bind(this)],
            ["app__board_left", this.enableResizeLeft.bind(this)],
            ["app__board_top", this.enableResizeTop.bind(this)],
            ["app__board_bottom", this.enableResizeBottom.bind(this)]
        ];

        borders.forEach(([cls, fn]) => {
            const el = document.createElement("div");
            el.classList.add(cls);
            el.addEventListener('mousedown', fn);
            this.appWindowElement.appendChild(el);
        });

        // Adicionar alças de canto para redimensionamento diagonal
        const corners = [
            ["app__board_top-left", this.enableResizeCorner.bind(this, 'nw')],
            ["app__board_top-right", this.enableResizeCorner.bind(this, 'ne')],
            ["app__board_bottom-left", this.enableResizeCorner.bind(this, 'sw')],
            ["app__board_bottom-right", this.enableResizeCorner.bind(this, 'se')]
        ];
        corners.forEach(([cls, fn]) => {
            const el = document.createElement("div");
            el.classList.add(cls);
            el.addEventListener('mousedown', fn);
            this.appWindowElement.appendChild(el);
        });
    }

    /**
     * Carrega o conteúdo HTML e CSS do aplicativo no elemento de conteúdo da janela.
     */
    async loadAppContent() {
        // Carrega o HTML do aplicativo
        if (this.core.dirApp) {
            try {
                const htmlResponse = await fetch(this.core.dirApp);
                if (!htmlResponse.ok) {
                    throw new Error(`HTTP error! status: ${htmlResponse.status} for ${this.core.dirApp}`);
                }
                const html = await htmlResponse.text();
                this.appContentRoot.innerHTML = html; // Injeta diretamente no elemento de conteúdo
            } catch (e) {
                this.appContentRoot.innerHTML = `<p style="color: red; text-align: center; padding-top: 20px;">Erro ao carregar conteúdo HTML: ${e.message}</p>`;
                console.error(`Erro carregando HTML do app ${this.appName}:`, e);
            }
        } else {
            console.warn(`[${this.appName}] Nenhuma URL dirApp fornecida para o conteúdo da janela.`);
            this.appContentRoot.innerHTML = '<p style="color: white; text-align: center; padding-top: 20px;">Nenhum conteúdo HTML para este aplicativo.</p>';
        }

        // Carrega o CSS do aplicativo (se styleFile estiver definido)
        if (this.core.styleFile) {
            try {
                const styleResponse = await fetch(this.core.styleFile);
                if (!styleResponse.ok) {
                    throw new Error(`HTTP error! status: ${styleResponse.status} for ${this.core.styleFile}`);
                }
                const styleText = await styleResponse.text();
                
                // Aplica namespace ao CSS
                const namespacedCSS = this.namespaceCSS(styleText);
                
                // Cria elemento de estilo no head do documento
                const styleElement = document.createElement('style');
                styleElement.id = `style-${this.namespace}`;
                styleElement.textContent = namespacedCSS;
                document.head.appendChild(styleElement);
                
                console.log(`[AppWindowSystem] CSS carregado e namespaced para ${this.appName}`);
                
            } catch (e) {
                console.error(`Erro carregando CSS do app ${this.appName}:`, e);
            }
        }
    }



    // Emite evento para atualizar o ícone da taskbar
    emitTaskbarIconState(state) {
        import('./eventBus.js').then(({ default: eventBus }) => {
            eventBus.emit('app:icon:update', { instanceId: this.instanceId, state });
        });
    }

    // Emite evento só se o estado mudou
    emitTaskbarIconStateIfChanged(state) {
        if (this._lastTaskbarState !== state) {
            this.emitTaskbarIconState(state);
            this._lastTaskbarState = state;
        }
    }

    // Métodos de redimensionamento (baseados no original)

    enableResizeRight(bord) {
        bord.addEventListener('mousedown', e => {
            if (this.isMaximized) return;
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = this.appWindowElement.offsetWidth;

            const onMouseMove = e => {
                const newWidth = startWidth + (e.clientX - startX);
                if (newWidth > this.min_width) {
                    this.appWindowElement.style.width = newWidth + "px";
                    this.currentWidth = this.appWindowElement.style.width;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    enableResizeLeft(bord) {
        bord.addEventListener('mousedown', e => {
            if (this.isMaximized) return;
            e.preventDefault();
            const startX = e.clientX;
            const startLeft = this.appWindowElement.offsetLeft;
            const startWidth = this.appWindowElement.offsetWidth;

            const onMouseMove = e => {
                const dx = startX - e.clientX;
                const newWidth = startWidth + dx;
                if (newWidth > this.min_width) {
                    this.appWindowElement.style.width = newWidth + "px";
                    this.appWindowElement.style.left = (startLeft - dx) + "px";
                    this.currentWidth = this.appWindowElement.style.width;
                    this.currentX = this.appWindowElement.style.left;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    enableResizeTop(bord) {
        bord.addEventListener('mousedown', e => {
            if (this.isMaximized) return;
            e.preventDefault();
            const startY = e.clientY;
            const startTop = this.appWindowElement.offsetTop;
            const startHeight = this.appWindowElement.offsetHeight;

            const onMouseMove = e => {
                const dy = startY - e.clientY;
                const newHeight = startHeight + dy;
                if (newHeight > this.min_height) {
                    this.appWindowElement.style.height = newHeight + "px";
                    this.appWindowElement.style.top = (startTop - dy) + "px";
                    this.currentHeight = this.appWindowElement.style.height;
                    this.currentY = this.appWindowElement.style.top;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    enableResizeBottom(bord) {
        bord.addEventListener('mousedown', e => {
            if (this.isMaximized) return;
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = this.appWindowElement.offsetHeight;

            const onMouseMove = e => {
                const newHeight = startHeight + (e.clientY - startY);
                if (newHeight > this.min_height) {
                    this.appWindowElement.style.height = newHeight + "px";
                    this.currentHeight = this.appWindowElement.style.height;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    enableResizeCorner(direction, e) {
        if (this.isMaximized) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = this.appWindowElement.offsetWidth;
        const startHeight = this.appWindowElement.offsetHeight;
        const startLeft = this.appWindowElement.offsetLeft;
        const startTop = this.appWindowElement.offsetTop;

        const onMouseMove = (moveEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (direction.includes('e')) { // Right
                newWidth = startWidth + (moveEvent.clientX - startX);
            }
            if (direction.includes('w')) { // Left
                const dx = startX - moveEvent.clientX;
                newWidth = startWidth + dx;
                newLeft = startLeft - dx;
            }
            if (direction.includes('s')) { // Bottom
                newHeight = startHeight + (moveEvent.clientY - startY);
            }
            if (direction.includes('n')) { // Top
                const dy = startY - moveEvent.clientY;
                newHeight = startHeight + dy;
                newTop = startTop - dy;
            }

            if (newWidth > this.min_width) {
                this.appWindowElement.style.width = newWidth + "px";
                if (direction.includes('w')) this.appWindowElement.style.left = newLeft + "px";
                this.currentWidth = this.appWindowElement.style.width;
                this.currentX = this.appWindowElement.style.left;
            }
            if (newHeight > this.min_height) {
                this.appWindowElement.style.height = newHeight + "px";
                if (direction.includes('n')) this.appWindowElement.style.top = newTop + "px";
                this.currentHeight = this.appWindowElement.style.height;
                this.currentY = this.appWindowElement.style.top;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    toggleMaximize() {
        // Emite evento para a taskbar atualizar o estado do ícone
        this.emitTaskbarIconStateIfChanged(this.isMaximized ? 'normal' : 'maximized');
        import('./eventBus.js').then(({ default: eventBus }) => {
            if (this.isMaximized) {
                eventBus.emit('window:unmaximize', { instanceId: this.instanceId });
            } else {
                eventBus.emit('window:maximize', { instanceId: this.instanceId });
            }
        });
        // Não altera DOM nem propriedades locais!
    }

    toggleVisibility() {
        // Emite evento para a taskbar atualizar o estado do ícone
        this.emitTaskbarIconStateIfChanged(this.isMinimized ? 'active' : 'minimized');
        import('./eventBus.js').then(({ default: eventBus }) => {
            if (this.isMinimized) {
                eventBus.emit('window:restore', { instanceId: this.instanceId });
            } else {
                eventBus.emit('window:minimize', { instanceId: this.instanceId });
            }
        });
        // Não altera DOM nem propriedades locais!
    }

    /**
     * Remove a janela e limpa recursos associados.
     */
    remove() {
        // Limpa o drag se existir
        if (this.dragCleanup) {
            this.dragCleanup();
        }
        
        // Remove o elemento da janela
        if (this.appWindowElement && this.appWindowElement.parentNode) {
            this.appWindowElement.remove();
        }
        
        // Remove o CSS namespaced
        const styleElement = document.getElementById(`style-${this.namespace}`);
        if (styleElement) {
            styleElement.remove();
        }
        
        console.log(`[AppWindowSystem] Janela '${this.appName}' removida e recursos limpos`);
    }
}
