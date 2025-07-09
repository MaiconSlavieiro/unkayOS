// /core/AppWindowSystem.js - v1.0.18

// import { convertPx2 } from './utils.js'; // Removido, pois não está sendo usado no código fornecido

export class AppWindowSystem {
  constructor(core, desktop) {
    this.core = core;
    this.desktop = desktop; // O elemento principal (div#desktop)
    this.instanceId = core.instanceId;
    this.appName = core.app_name;

    const data = core.rawData;

    this.initialWidth = data.width || "35vw";
    this.initialHeight = data.height || "35vh";
    this.initialX = data.x_position || "10vw";
    this.initialY = data.y_position || "10vh";

    this.min_width = data.min_width || 800;
    this.min_height = data.min_height || 400;

    this.is_fullscreen = false;

    this.appElement = document.createElement("div");
    this.appElement.classList.add("app");
    this.appElement.id = this.instanceId;

    this.appElement.addEventListener('mousedown', () => {
      if (window.appManager) {
        window.appManager.setFirstPlaneApp(this);
      }
    });

    this.render();
  }

  async render() {
    const topBar = document.createElement("div");
    topBar.classList.add("app__top_bar");

    const title = document.createElement("div");
    title.classList.add("app__top_bar__app_name");
    title.innerText = this.core.app_name;
    topBar.appendChild(title);

    this.enableMove(topBar);

    const minBtn = document.createElement("div");
    minBtn.classList.add("app__top_bar__min_button");
    minBtn.onclick = () => this.toggleVisibility();
    topBar.appendChild(minBtn);

    const maxBtn = document.createElement("div");
    maxBtn.classList.add("app__top_bar__max_button");
    maxBtn.onclick = () => this.toggleMaximize();
    topBar.appendChild(maxBtn);

    const closeBtn = document.createElement("div");
    closeBtn.classList.add("app__top_bar__close_button");
    closeBtn.onclick = () => {
        if (window.appManager) {
            window.appManager.removeApp(this.instanceId);
        }
    };
    topBar.appendChild(closeBtn);

    const content = document.createElement("div");
    content.classList.add("app__content");

    if (this.core.dirApp) {
      try {
        const html = await fetch(this.core.dirApp).then(r => r.text());
        content.innerHTML = html;
      } catch (e) {
        content.innerHTML = `<p style="color: red;">Erro ao carregar conteúdo</p>`;
        console.error("Erro carregando HTML:", e);
      }
    }

    const borders = [
      ["app__board_right", this.enableResizeRight.bind(this)],
      ["app__board_left", this.enableResizeLeft.bind(this)],
      ["app__board_top", this.enableResizeTop.bind(this)],
      ["app__board_bottom", this.enableResizeBottom.bind(this)]
      // As alças de canto não estão no código original fornecido, então não as incluímos aqui.
    ];

    borders.forEach(([cls, fn]) => {
      const el = document.createElement("div");
      el.classList.add(cls);
      fn(el);
      this.appElement.appendChild(el);
    });

    this.appElement.appendChild(topBar);
    this.appElement.appendChild(content);
    this.desktop.appendChild(this.appElement); // AQUI! O elemento é adicionado ao DOM.

    this.appElement.style.width = this.initialWidth;
    this.appElement.style.height = this.initialHeight;
    this.appElement.style.left = this.initialX;
    this.appElement.style.top = this.initialY;

    // NOVO: Chama onRun() na instância do aplicativo APÓS o elemento da janela ser anexado ao DOM
    // E sem parâmetros, como na sua versão original.
    if (this.core.appInstance && typeof this.core.appInstance.onRun === "function") {
        this.core.appInstance.onRun(); 
    } else {
        console.warn(`[${this.appName} - ${this.instanceId}] Nenhuma instância de app ou método onRun encontrado para chamar após renderização.`);
    }
  }

  restore() {
    this.appElement.style.width = this.currentWidth || this.initialWidth;
    this.appElement.style.height = this.currentHeight || this.initialHeight;
    this.appElement.style.left = this.currentX || this.initialX;
    this.appElement.style.top = this.currentY || this.initialY;
    this.is_fullscreen = false;
    this.appElement.classList.remove('fullscreen');
  }

  maximize() {
    this.currentWidth = this.appElement.style.width;
    this.currentHeight = this.appElement.style.height;
    this.currentX = this.appElement.style.left;
    this.currentY = this.appElement.style.top;

    this.appElement.style.width = "100vw";
    this.appElement.style.height = "100vh";
    this.appElement.style.left = 0;
    this.appElement.style.top = 0;
    this.is_fullscreen = true;
    this.appElement.classList.add('fullscreen');
  }

  toggleMaximize() {
    this.is_fullscreen ? this.restore() : this.maximize();
  }

  toggleVisibility() {
    const display = this.appElement.style.display;
    this.appElement.style.display = display === "none" ? "block" : "none";
  }

  close() {
    this.appElement.remove();
  }

  enableMove(header) {
    let initialMouseX = 0, initialMouseY = 0;
    let initialWindowX = 0, initialWindowY = 0;

    const elmnt = this.appElement;

    const dragMouseDown = (e) => {
      if (this.is_fullscreen) return;
      e.preventDefault();
      initialMouseX = e.clientX;
      initialMouseY = e.clientY;
      initialWindowX = elmnt.offsetLeft;
      initialWindowY = elmnt.offsetTop;

      document.addEventListener('mousemove', elementDrag);
      document.addEventListener('mouseup', closeDragElement);
    };

    const elementDrag = (e) => {
      if (this.is_fullscreen) return;
      e.preventDefault();
      const dx = e.clientX - initialMouseX;
      const dy = e.clientY - initialMouseY;

      const newLeft = initialWindowX + dx;
      const newTop = initialWindowY + dy;

      elmnt.style.left = newLeft + "px";
      elmnt.style.top = newTop + "px";

      this.currentX = elmnt.style.left;
      this.currentY = elmnt.style.top;
    };

    const closeDragElement = () => {
      document.removeEventListener('mousemove', elementDrag);
      document.removeEventListener('mouseup', closeDragElement);
    };

    header.addEventListener('mousedown', dragMouseDown);
  }

  enableResizeRight(bord) {
    bord.addEventListener('mousedown', e => {
      if (this.is_fullscreen) return;
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = this.appElement.offsetWidth;

      const onMouseMove = e => {
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > this.min_width) {
          this.appElement.style.width = newWidth + "px";
          this.currentWidth = this.appElement.style.width;
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
      if (this.is_fullscreen) return;
      e.preventDefault();
      const startX = e.clientX;
      const startLeft = this.appElement.offsetLeft;
      const startWidth = this.appElement.offsetWidth;

      const onMouseMove = e => {
        const dx = startX - e.clientX;
        const newWidth = startWidth + dx;
        if (newWidth > this.min_width) {
          this.appElement.style.width = newWidth + "px";
          this.appElement.style.left = (startLeft - dx) + "px";
          this.currentWidth = this.appElement.style.width;
          this.currentX = this.appElement.style.left;
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
      if (this.is_fullscreen) return;
      e.preventDefault();
      const startY = e.clientY;
      const startTop = this.appElement.offsetTop;
      const startHeight = this.appElement.offsetHeight;

      const onMouseMove = e => {
        const dy = startY - e.clientY;
        const newHeight = startHeight + dy;
        if (newHeight > this.min_height) {
          this.appElement.style.height = newHeight + "px";
          this.appElement.style.top = (startTop - dy) + "px";
          this.currentHeight = this.appElement.style.height;
          this.currentY = this.appElement.style.top;
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
      if (this.is_fullscreen) return;
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = this.appElement.offsetHeight;

      const onMouseMove = e => {
        const newHeight = startHeight + (e.clientY - startY);
        if (newHeight > this.min_height) {
          this.appElement.style.height = newHeight + "px";
          this.currentHeight = this.appElement.style.height;
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
}
