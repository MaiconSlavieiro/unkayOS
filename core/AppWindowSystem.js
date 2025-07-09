// /core/AppWindowSystem.js - v1.0.23

export class AppWindowSystem {
  constructor(core, desktopElement) { // Renomeado 'desktop' para 'desktopElement' para clareza
    this.core = core;
    this.desktopElement = desktopElement; // O elemento principal (div#desktop)
    this.instanceId = core.instanceId;
    this.appName = core.app_name;

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
    // Converte vw/vh para px para armazenar valores iniciais em pixels
    this.restoreWidth = this.convertVwVhToPx(this.initialWidth, 'width');
    this.restoreHeight = this.convertVwVhToPx(this.initialHeight, 'height');
    this.restoreX = this.convertVwVhToPx(this.initialX, 'width');
    this.restoreY = this.convertVwVhToPx(this.initialY, 'height');

    this.isMaximized = false; 
    this.isMinimized = false; 

    // Binds para garantir que 'this' se refira à instância da classe nos event listeners
    this.toggleMaximize = this.toggleMaximize.bind(this);
    this.toggleVisibility = this.toggleVisibility.bind(this);

    this.createWindow();
  }

  /**
   * Converte valores de vw/vh para pixels.
   * @param {string} value - O valor CSS (ex: "10vw", "200px").
   * @param {string} type - 'width' para vw, 'height' para vh.
   * @returns {number} O valor em pixels.
   */
  convertVwVhToPx(value, type) {
      if (typeof value !== 'string') {
          return parseFloat(value) || 0; // Se já for número, retorna
      }
      if (value.endsWith('vw')) {
          return (parseFloat(value) / 100) * window.innerWidth;
      } else if (value.endsWith('vh')) {
          return (parseFloat(value) / 100) * window.innerHeight;
      } else if (value.endsWith('px')) {
          return parseFloat(value);
      }
      return parseFloat(value) || 0; 
  }

  /**
   * Cria o elemento DIV da janela do aplicativo e o anexa ao DOM.
   */
  async createWindow() {
      this.appWindowElement = document.createElement('div');
      this.appWindowElement.classList.add('app'); 
      this.appWindowElement.id = this.instanceId; // Define o ID da instância na janela

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

      this.enableMove(topBar); // Habilita o arrastar na barra de título inteira

      // Botões de controle (minimizar, maximizar, fechar)
      const minButton = document.createElement('div');
      minButton.classList.add('app__top_bar__min_button');
      minButton.title = 'Minimizar';
      minButton.addEventListener('click', (e) => {
          e.stopPropagation(); 
          this.toggleVisibility();
      }); 
      topBar.appendChild(minButton);

      const maxButton = document.createElement('div');
      maxButton.classList.add('app__top_bar__max_button');
      maxButton.title = 'Maximizar/Restaurar';
      maxButton.addEventListener('click', (e) => {
          e.stopPropagation(); 
          this.toggleMaximize();
      }); 
      topBar.appendChild(maxButton);

      const closeButton = document.createElement('div');
      closeButton.classList.add('app__top_bar__close_button');
      closeButton.title = 'Fechar';
      closeButton.addEventListener('click', (e) => {
          e.stopPropagation(); 
          window.appManager.removeApp(this.instanceId);
      });
      topBar.appendChild(closeButton);

      this.appWindowElement.appendChild(topBar);

      // Área de conteúdo (onde o HTML do app será carregado)
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('app__content');
      this.appWindowElement.appendChild(contentDiv);

      // Bordas de redimensionamento
      this.createResizeHandles();

      // Anexa a janela ao div#desktop
      this.desktopElement.appendChild(this.appWindowElement);

      // Adiciona listener para focar a janela ao clicar em qualquer lugar nela
      this.appWindowElement.addEventListener('mousedown', () => {
          window.appManager.setFirstPlaneApp(this.instanceId);
      });

      // Carrega o conteúdo HTML e CSS do aplicativo
      await this.loadAppContent(contentDiv);

      // Chama onRun() na instância do aplicativo APÓS o elemento da janela ser anexado ao DOM
      // e o conteúdo HTML/CSS carregado.
      if (this.core.appInstance && typeof this.core.appInstance.onRun === "function") {
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

      // Adicionar alças de canto se desejar, com enableResizeCorner
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
   * Carrega o conteúdo HTML e CSS do aplicativo no div de conteúdo da janela.
   * @param {HTMLElement} contentDiv - O div de conteúdo da janela.
   */
  async loadAppContent(contentDiv) {
      // Carrega o HTML do aplicativo
      if (this.core.dirApp) {
          try {
              const htmlResponse = await fetch(this.core.dirApp);
              if (!htmlResponse.ok) {
                  throw new Error(`HTTP error! status: ${htmlResponse.status} for ${this.core.dirApp}`);
              }
              const html = await htmlResponse.text();
              contentDiv.innerHTML = html;
          } catch (e) {
              contentDiv.innerHTML = `<p style="color: red; text-align: center; padding-top: 20px;">Erro ao carregar conteúdo HTML: ${e.message}</p>`;
              console.error(`Erro carregando HTML do app ${this.appName}:`, e);
          }
      } else {
          console.warn(`[${this.appName}] Nenhuma URL dirApp fornecida para o conteúdo da janela.`);
          contentDiv.innerHTML = '<p style="color: white; text-align: center; padding-top: 20px;">Nenhum conteúdo HTML para este aplicativo.</p>';
      }

      // Carrega o CSS do aplicativo (se styleFile estiver definido)
      if (this.core.styleFile) {
          try {
              const styleResponse = await fetch(this.core.styleFile);
              if (!styleResponse.ok) {
                  throw new Error(`HTTP error! status: ${styleResponse.status} for ${this.core.styleFile}`);
              }
              const styleText = await styleResponse.text();
              const styleElement = document.createElement('style');
              styleElement.textContent = styleText;
              // Anexa o estilo ao appWindowElement para que ele seja isolado à janela
              this.appWindowElement.appendChild(styleElement); 
          } catch (e) {
              console.error(`Erro carregando CSS do app ${this.appName}:`, e);
          }
      }
  }

  /**
   * Habilita o arrastar da janela (baseado no original).
   * @param {HTMLElement} headerElement - O elemento que irá iniciar o arrastar (e.g., a barra de título).
   */
  enableMove(headerElement) {
      let initialMouseX = 0, initialMouseY = 0;
      let initialWindowX = 0, initialWindowY = 0;

      const elmnt = this.appWindowElement; // O elemento da janela a ser arrastado

      const dragMouseDown = (e) => {
        if (this.isMaximized) return; // Não arrasta se estiver maximizado
        e.preventDefault(); // Previne seleção de texto e outros comportamentos padrão

        initialMouseX = e.clientX;
        initialMouseY = e.clientY;
        initialWindowX = elmnt.offsetLeft;
        initialWindowY = elmnt.offsetTop;

        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
      };

      const elementDrag = (e) => {
        if (this.isMaximized) return; // Garante que não arraste se maximizado
        e.preventDefault(); // Previne seleção de texto durante o movimento

        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;

        let newLeft = initialWindowX + dx;
        let newTop = initialWindowY + dy;

        // Limita a janela aos limites da tela
        const minX = 0;
        const minY = 0;
        const maxX = this.desktopElement.offsetWidth - elmnt.offsetWidth;
        const maxY = this.desktopElement.offsetHeight - elmnt.offsetHeight;

        newLeft = Math.max(minX, Math.min(newLeft, maxX));
        newTop = Math.max(minY, Math.min(newTop, maxY));

        elmnt.style.left = `${newLeft}px`;
        elmnt.style.top = `${newTop}px`;

        // Atualiza as posições de restauração (em string, como no original)
        this.currentX = elmnt.style.left;
        this.currentY = elmnt.style.top;
      };

      const closeDragElement = () => {
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
      };

      headerElement.addEventListener('mousedown', dragMouseDown);
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
      e.stopPropagation();

      const elmnt = this.appWindowElement;
      const startX = e.clientX;
      const startY = e.clientY;
      const initialWidth = elmnt.offsetWidth;
      const initialHeight = elmnt.offsetHeight;
      const initialLeft = elmnt.offsetLeft;
      const initialTop = elmnt.offsetTop;

      const minWidth = this.min_width;
      const minHeight = this.min_height;

      const desktopWidth = this.desktopElement.offsetWidth;
      const desktopHeight = this.desktopElement.offsetHeight;

      const onMouseMove = (moveEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          let newWidth = initialWidth;
          let newHeight = initialHeight;
          let newLeft = initialLeft;
          let newTop = initialTop;

          switch (direction) {
              case 'se': // Bottom-Right
                  newWidth = Math.max(minWidth, initialWidth + dx);
                  newHeight = Math.max(minHeight, initialHeight + dy);
                  newWidth = Math.min(newWidth, desktopWidth - initialLeft);
                  newHeight = Math.min(newHeight, desktopHeight - initialTop);
                  break;
              case 'sw': // Bottom-Left
                  newWidth = Math.max(minWidth, initialWidth - dx);
                  newHeight = Math.max(minHeight, initialHeight + dy);
                  newLeft = initialLeft + initialWidth - newWidth;
                  newLeft = Math.max(0, newLeft);
                  newWidth = initialWidth - (newLeft - initialLeft);
                  newHeight = Math.min(newHeight, desktopHeight - initialTop);
                  break;
              case 'ne': // Top-Right
                  newWidth = Math.max(minWidth, initialWidth + dx);
                  newHeight = Math.max(minHeight, initialHeight - dy);
                  newWidth = Math.min(newWidth, desktopWidth - initialLeft);
                  newTop = initialTop + initialHeight - newHeight;
                  newTop = Math.max(0, newTop);
                  newHeight = initialHeight - (newTop - initialTop);
                  break;
              case 'nw': // Top-Left
                  newWidth = Math.max(minWidth, initialWidth - dx);
                  newHeight = Math.max(minHeight, initialHeight - dy);
                  newLeft = initialLeft + initialWidth - newWidth;
                  newLeft = Math.max(0, newLeft);
                  newWidth = initialWidth - (newLeft - initialLeft);
                  newTop = initialTop + initialHeight - newHeight;
                  newTop = Math.max(0, newTop);
                  newHeight = initialHeight - (newTop - initialTop);
                  break;
          }

          elmnt.style.width = `${newWidth}px`;
          elmnt.style.height = `${newHeight}px`;
          elmnt.style.left = `${newLeft}px`;
          elmnt.style.top = `${newTop}px`;

          this.currentX = elmnt.style.left;
          this.currentY = elmnt.style.top;
          this.currentWidth = elmnt.style.width;
          this.currentHeight = elmnt.style.height;
      };

      const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Alterna a visibilidade da janela (minimizar/restaurar).
   */
  toggleVisibility() {
      console.log(`[${this.instanceId}] toggleVisibility chamado. isMinimized antes: ${this.isMinimized}`);
      if (this.isMinimized) {
          this.appWindowElement.style.display = 'block';
          this.appWindowElement.classList.remove('minimized');
          this.isMinimized = false;
          window.appManager.setFirstPlaneApp(this.instanceId); // Traz para frente ao restaurar
          console.log(`[${this.instanceId}] Janela restaurada.`);
      } else {
          this.appWindowElement.style.display = 'none';
          this.appWindowElement.classList.add('minimized');
          this.isMinimized = true;
          console.log(`[${this.instanceId}] Janela minimizada.`);
      }
  }

  /**
   * Alterna entre o estado maximizado e restaurado da janela.
   */
  toggleMaximize() {
      console.log(`[${this.instanceId}] toggleMaximize chamado. isMaximized antes: ${this.isMaximized}`);
      if (this.isMaximized) {
          // Restaurar para o tamanho e posição anteriores (usando os valores em pixels)
          this.appWindowElement.style.width = `${this.restoreWidth}px`;
          this.appWindowElement.style.height = `${this.restoreHeight}px`;
          this.appWindowElement.style.left = `${this.restoreX}px`;
          this.appWindowElement.style.top = `${this.restoreY}px`;
          this.appWindowElement.classList.remove('maximized');
          this.isMaximized = false;
          console.log(`[${this.instanceId}] Janela restaurada do maximizado.`);
      } else {
          // Salvar a posição e tamanho atuais antes de maximizar (em pixels)
          this.restoreX = this.appWindowElement.offsetLeft;
          this.restoreY = this.appWindowElement.offsetTop;
          this.restoreWidth = this.appWindowElement.offsetWidth;
          this.restoreHeight = this.appWindowElement.offsetHeight;

          // Maximizar para ocupar toda a tela (ajustando para a taskbar se necessário)
          this.appWindowElement.style.width = `${this.desktopElement.offsetWidth}px`;
          // Assumindo que a taskbar tem 50px de altura na parte inferior
          this.appWindowElement.style.height = `${this.desktopElement.offsetHeight - 50}px`; 
          this.appWindowElement.style.left = '0px';
          this.appWindowElement.style.top = '0px';
          this.appWindowElement.classList.add('maximized');
          this.isMaximized = true;
          console.log(`[${this.instanceId}] Janela maximizada.`);
      }
      window.appManager.setFirstPlaneApp(this.instanceId); // Garante que a janela maximizada esteja em primeiro plano
  }

  /**
   * Remove o elemento da janela do DOM.
   * Chamado pelo AppManager.
   */
  close() {
      this.appWindowElement.remove();
  }
}
