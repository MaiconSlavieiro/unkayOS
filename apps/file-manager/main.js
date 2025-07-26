// apps/file-manager/main.js - v1.0.0

import { BaseApp } from '../../core/BaseApp.js';
import { fs } from '../../core/FileSystem.js';
import eventBus from '../../core/eventBus.js';

/**
 * Gerenciador de Arquivos - Interface gráfica para o sistema de arquivos
 */
export default class FileManagerApp extends BaseApp {
    constructor(CORE, standardAPIs) {
        super(CORE, standardAPIs);
        
        // Estado da aplicação
        this.currentPath = '/home/user';
        this.selectedItems = new Set();
        this.clipboard = null;
        this.clipboardOperation = null; // 'copy' ou 'cut'
        this.viewMode = 'list'; // 'list' ou 'grid'
        this.navigationHistory = [];
        this.navigationIndex = -1;
        
        // Referências DOM
        this.elements = {};
        
        // Bind methods
        this.refreshView = this.refreshView.bind(this);
        this.handleFileItemClick = this.handleFileItemClick.bind(this);
        this.handleFileItemDoubleClick = this.handleFileItemDoubleClick.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.hideContextMenu = this.hideContextMenu.bind(this);
    }

    /**
     * Inicializa o aplicativo
     */
    async onRun() {
        console.log(`[${this.appName}] Inicializando File Manager...`);
        
        this.initializeElements();
        await this.setupEventListeners();
        this.updatePathInput();
        this.refreshView();
        
        console.log(`[${this.appName}] File Manager inicializado`);
    }

    /**
     * Inicializa referências aos elementos DOM
     */
    initializeElements() {
        this.elements = {
            // Navegação
            backBtn: this.$('#back-btn'),
            forwardBtn: this.$('#forward-btn'),
            upBtn: this.$('#up-btn'),
            refreshBtn: this.$('#refresh-btn'),
            pathInput: this.$('#path-input'),
            
            // Visualização
            viewListBtn: this.$('#view-list-btn'),
            viewGridBtn: this.$('#view-grid-btn'),
            
            // Ações
            newFolderBtn: this.$('#new-folder-btn'),
            newFileBtn: this.$('#new-file-btn'),
            
            // Conteúdo
            breadcrumb: this.$('#breadcrumb'),
            itemCount: this.$('#item-count'),
            fileList: this.$('#file-list'),
            fileItems: this.$('#file-items'),
            
            // Sidebar
            locationItems: this.$$('.location-item'),
            
            // Menu de contexto
            contextMenu: this.$('#context-menu'),
            
            // Modais
            newFolderModal: this.$('#new-folder-modal'),
            newFileModal: this.$('#new-file-modal'),
            propertiesModal: this.$('#properties-modal'),
            openWithModal: this.$('#open-with-modal'),
            folderNameInput: this.$('#folder-name-input'),
            fileNameInput: this.$('#file-name-input'),
            propertiesContent: this.$('#properties-content')
        };
    }

    /**
     * Configura event listeners
     */
    async setupEventListeners() {
        // Navegação
        this.elements.backBtn.addEventListener('click', () => this.navigateBack());
        this.elements.forwardBtn.addEventListener('click', () => this.navigateForward());
        this.elements.upBtn.addEventListener('click', () => this.navigateUp());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshView());
        
        // Entrada de caminho
        this.elements.pathInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToPath(e.target.value);
            }
        });
        
        // Visualização
        this.elements.viewListBtn.addEventListener('click', () => this.setViewMode('list'));
        this.elements.viewGridBtn.addEventListener('click', () => this.setViewMode('grid'));
        
        // Ações
        this.elements.newFolderBtn.addEventListener('click', () => this.showNewFolderModal());
        this.elements.newFileBtn.addEventListener('click', () => this.showNewFileModal());
        
        // Sidebar
        this.elements.locationItems.forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.navigateToPath(path);
            });
        });
        
        // Menu de contexto
        document.addEventListener('click', this.hideContextMenu);
        this.setupContextMenuActions();
        
        // Modais
        this.setupModalEvents();
        
        // Keyboard shortcuts - usando sistema centralizado
        await this.setupKeyboardShortcuts();
    }

    /**
     * Configura atalhos de teclado usando o sistema centralizado
     */
    async setupKeyboardShortcuts() {
        await this.registerKeyboardShortcut('ctrl+a', () => this.selectAll());
        await this.registerKeyboardShortcut('ctrl+c', () => {
            if (this.selectedItems.size > 0) this.copySelectedItems();
        });
        await this.registerKeyboardShortcut('ctrl+x', () => {
            if (this.selectedItems.size > 0) this.cutSelectedItems();
        });
        await this.registerKeyboardShortcut('ctrl+v', () => {
            if (this.clipboard) this.pasteItems();
        });
        await this.registerKeyboardShortcut('ctrl+n', () => this.showNewFileModal());
        await this.registerKeyboardShortcut('ctrl+shift+n', () => this.showNewFolderModal());
        await this.registerKeyboardShortcut('delete', () => {
            if (this.selectedItems.size > 0) this.deleteSelectedItems();
        });
        await this.registerKeyboardShortcut('f5', () => this.refreshView());
        await this.registerKeyboardShortcut('backspace', () => this.navigateUp());
    }

    /**
     * Configura ações do menu de contexto
     */
    setupContextMenuActions() {
        this.$('#ctx-open').addEventListener('click', () => this.openSelectedItem());
        this.$('#ctx-open-with').addEventListener('click', () => this.showOpenWithModal());
        this.$('#ctx-copy').addEventListener('click', () => this.copySelectedItems());
        this.$('#ctx-cut').addEventListener('click', () => this.cutSelectedItems());
        this.$('#ctx-paste').addEventListener('click', () => this.pasteItems());
        this.$('#ctx-rename').addEventListener('click', () => this.renameSelectedItem());
        this.$('#ctx-delete').addEventListener('click', () => this.deleteSelectedItems());
        this.$('#ctx-properties').addEventListener('click', () => this.showPropertiesModal());
    }

    /**
     * Configura eventos dos modais
     */
    setupModalEvents() {
        // Modal nova pasta
        this.$('#create-folder-btn').addEventListener('click', () => this.createNewFolder());
        this.$('#cancel-folder-btn').addEventListener('click', () => this.hideModal('newFolderModal'));
        
        // Modal novo arquivo
        this.$('#create-file-btn').addEventListener('click', () => this.createNewFile());
        this.$('#cancel-file-btn').addEventListener('click', () => this.hideModal('newFileModal'));
        
        // Modal propriedades
        this.$('#close-properties-btn').addEventListener('click', () => this.hideModal('propertiesModal'));
        
        // Modal "Abrir com..."
        this.$('#cancel-open-with-btn').addEventListener('click', () => this.hideModal('openWithModal'));
        
        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    /**
     * Atualiza a visualização dos arquivos
     */
    refreshView() {
        try {
            console.log(`[${this.appName}] Atualizando visualização para: ${this.currentPath}`);
            
            const items = fs.ls(this.currentPath);
            
            this.updateBreadcrumb();
            this.updateItemCount(items.length);
            this.renderFileItems(items);
            this.updateSidebarSelection();
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error(`[${this.appName}] Erro ao atualizar visualização:`, error);
            this.showError(`Erro ao carregar diretório: ${error.message}`);
        }
    }

    /**
     * Renderiza os itens de arquivo
     */
    renderFileItems(items) {
        this.elements.fileItems.innerHTML = '';
        this.selectedItems.clear();
        
        if (items.length === 0) {
            this.elements.fileItems.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-outlined">folder_open</span>
                    <p>Esta pasta está vazia</p>
                </div>
            `;
            return;
        }
        
        // Ordena itens (diretórios primeiro, depois alfabeticamente)
        items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        items.forEach(item => {
            const element = this.createFileItemElement(item);
            this.elements.fileItems.appendChild(element);
        });
    }

    /**
     * Cria elemento para um item de arquivo
     */
    createFileItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-item';
        itemElement.dataset.path = item.path;
        itemElement.dataset.type = item.type;
        
        const iconClass = item.type === 'directory' ? 'folder' : 'description';
        const iconColorClass = item.type === 'directory' ? 'directory' : 'file';
        
        const modified = new Date(item.modified);
        const modifiedStr = modified.toLocaleDateString('pt-BR') + ' ' + 
                           modified.toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5);
        
        const sizeStr = item.type === 'directory' ? '--' : this.formatFileSize(item.size);
        const typeStr = item.type === 'directory' ? 'Pasta' : 'Arquivo';
        
        if (this.viewMode === 'list') {
            itemElement.innerHTML = `
                <div class="file-item-name">
                    <span class="material-icons-outlined file-icon ${iconColorClass}">${iconClass}</span>
                    <span class="file-name">${this.escapeHtml(item.name)}</span>
                </div>
                <div class="column-modified">${modifiedStr}</div>
                <div class="column-type">${typeStr}</div>
                <div class="column-size">${sizeStr}</div>
            `;
        } else {
            itemElement.innerHTML = `
                <div class="file-item-name">
                    <span class="material-icons-outlined file-icon ${iconColorClass}">${iconClass}</span>
                    <span class="file-name">${this.escapeHtml(item.name)}</span>
                </div>
            `;
        }
        
        // Event listeners
        itemElement.addEventListener('click', (e) => this.handleFileItemClick(e, item));
        itemElement.addEventListener('dblclick', (e) => this.handleFileItemDoubleClick(e, item));
        itemElement.addEventListener('contextmenu', (e) => this.handleContextMenu(e, item));
        
        return itemElement;
    }

    /**
     * Manipula clique em item
     */
    handleFileItemClick(event, item) {
        event.stopPropagation();
        
        if (event.ctrlKey || event.metaKey) {
            // Seleção múltipla
            this.toggleItemSelection(item);
        } else {
            // Seleção única
            this.selectedItems.clear();
            this.selectedItems.add(item.path);
            this.updateItemSelection();
        }
    }

    /**
     * Manipula duplo clique em item
     */
    handleFileItemDoubleClick(event, item) {
        event.stopPropagation();
        this.openItem(item);
    }

    /**
     * Manipula menu de contexto
     */
    handleContextMenu(event, item) {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.selectedItems.has(item.path)) {
            this.selectedItems.clear();
            this.selectedItems.add(item.path);
            this.updateItemSelection();
        }
        
        this.showContextMenu(event.clientX, event.clientY);
    }

    /**
     * Abre um item (arquivo ou diretório)
     */
    openItem(item) {
        if (item.type === 'directory') {
            this.navigateToPath(item.path);
        } else {
            // Para arquivos, determina o aplicativo apropriado e abre
            console.log(`[${this.appName}] Abrindo arquivo: ${item.path}`);
            this.openFileWithApp(item);
        }
    }

    /**
     * Abre um arquivo com o aplicativo apropriado
     */
    openFileWithApp(item) {
        const extension = this.getFileExtension(item.name);
        const mimeType = this.getMimeType(extension);
        
        // Determina qual aplicativo usar baseado na extensão
        let appId = null;
        let appName = 'aplicativo padrão';
        
        switch (extension) {
            case 'txt':
            case 'md':
            case 'js':
            case 'css':
            case 'html':
            case 'json':
            case 'xml':
            case 'log':
            case 'conf':
            case 'config':
                appId = 'text-editor';
                appName = 'Editor de Texto';
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                // TODO: Implementar visualizador de imagens
                console.log(`[${this.appName}] Visualizador de imagens não implementado ainda`);
                this.showMessage(`Visualizador de imagens não implementado ainda`, 'warning');
                return;
            case 'pdf':
                // TODO: Implementar visualizador de PDF
                console.log(`[${this.appName}] Visualizador de PDF não implementado ainda`);
                this.showMessage(`Visualizador de PDF não implementado ainda`, 'warning');
                return;
            default:
                // Para arquivos desconhecidos, tenta abrir com editor de texto
                appId = 'text-editor';
                appName = 'Editor de Texto';
                break;
        }
        
        if (appId && this.appManager) {
            try {
                console.log(`[${this.appName}] Abrindo ${item.name} com ${appName}`);
                this.appManager.runApp(appId, { file: item.path });
                this.showMessage(`Abrindo ${item.name} com ${appName}`, 'success');
            } catch (error) {
                console.error(`[${this.appName}] Erro ao abrir arquivo:`, error);
                this.showMessage(`Erro ao abrir arquivo: ${error.message}`, 'error');
            }
        } else {
            console.warn(`[${this.appName}] Nenhum aplicativo disponível para ${extension}`);
            this.showMessage(`Nenhum aplicativo disponível para arquivos .${extension}`, 'warning');
        }
    }

    /**
     * Obtém a extensão de um arquivo
     */
    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot === -1 || lastDot === 0) return '';
        return fileName.substring(lastDot + 1).toLowerCase();
    }

    /**
     * Obtém o MIME type baseado na extensão
     */
    getMimeType(extension) {
        const mimeTypes = {
            'txt': 'text/plain',
            'md': 'text/markdown',
            'js': 'text/javascript',
            'css': 'text/css',
            'html': 'text/html',
            'json': 'application/json',
            'xml': 'text/xml',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Mostra uma mensagem de status
     */
    showMessage(message, type = 'info') {
        // Cria elemento de notificação se não existir
        let notification = this.$('#notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            this.appContentRoot.appendChild(notification);
        }
        
        // Define a classe baseada no tipo
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Remove a notificação após 3 segundos
        this.setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    /**
     * Navega para um caminho específico
     */
    navigateToPath(path) {
        try {
            const normalizedPath = fs.normalize(path);
            
            if (!fs.exists(normalizedPath)) {
                this.showError(`Caminho não encontrado: ${path}`);
                return;
            }
            
            const stat = fs.stat(normalizedPath);
            if (stat.type !== 'directory') {
                this.showError(`${path} não é um diretório`);
                return;
            }
            
            // Adiciona ao histórico
            if (this.currentPath !== normalizedPath) {
                this.navigationHistory = this.navigationHistory.slice(0, this.navigationIndex + 1);
                this.navigationHistory.push(normalizedPath);
                this.navigationIndex = this.navigationHistory.length - 1;
            }
            
            this.currentPath = normalizedPath;
            this.updatePathInput();
            this.refreshView();
            
        } catch (error) {
            this.showError(`Erro ao navegar: ${error.message}`);
        }
    }

    /**
     * Navega para o diretório pai
     */
    navigateUp() {
        const parentPath = fs.dirname(this.currentPath);
        if (parentPath && parentPath !== this.currentPath) {
            this.navigateToPath(parentPath);
        }
    }

    /**
     * Navega para trás no histórico
     */
    navigateBack() {
        if (this.navigationIndex > 0) {
            this.navigationIndex--;
            this.currentPath = this.navigationHistory[this.navigationIndex];
            this.updatePathInput();
            this.refreshView();
        }
    }

    /**
     * Navega para frente no histórico
     */
    navigateForward() {
        if (this.navigationIndex < this.navigationHistory.length - 1) {
            this.navigationIndex++;
            this.currentPath = this.navigationHistory[this.navigationIndex];
            this.updatePathInput();
            this.refreshView();
        }
    }

    /**
     * Atualiza os botões de navegação
     */
    updateNavigationButtons() {
        this.elements.backBtn.disabled = this.navigationIndex <= 0;
        this.elements.forwardBtn.disabled = this.navigationIndex >= this.navigationHistory.length - 1;
        this.elements.upBtn.disabled = this.currentPath === '/';
    }

    /**
     * Atualiza a entrada de caminho
     */
    updatePathInput() {
        this.elements.pathInput.value = this.currentPath;
    }

    /**
     * Atualiza o breadcrumb
     */
    updateBreadcrumb() {
        this.elements.breadcrumb.innerHTML = '';
        
        const parts = this.currentPath.split('/').filter(part => part !== '');
        let currentPath = '';
        
        // Raiz
        const rootItem = document.createElement('a');
        rootItem.href = '#';
        rootItem.className = 'breadcrumb-item';
        rootItem.textContent = 'Raiz';
        rootItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToPath('/');
        });
        this.elements.breadcrumb.appendChild(rootItem);
        
        // Partes do caminho
        parts.forEach((part, index) => {
            currentPath += '/' + part;
            
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            this.elements.breadcrumb.appendChild(separator);
            
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'breadcrumb-item';
            item.textContent = part;
            
            if (index === parts.length - 1) {
                item.classList.add('current');
            } else {
                const pathToNavigate = currentPath;
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateToPath(pathToNavigate);
                });
            }
            
            this.elements.breadcrumb.appendChild(item);
        });
    }

    /**
     * Atualiza contador de itens
     */
    updateItemCount(count) {
        this.elements.itemCount.textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
    }

    /**
     * Atualiza seleção da sidebar
     */
    updateSidebarSelection() {
        this.elements.locationItems.forEach(item => {
            item.classList.toggle('active', item.dataset.path === this.currentPath);
        });
    }

    /**
     * Define modo de visualização
     */
    setViewMode(mode) {
        this.viewMode = mode;
        
        this.elements.viewListBtn.classList.toggle('active', mode === 'list');
        this.elements.viewGridBtn.classList.toggle('active', mode === 'grid');
        
        this.elements.fileList.className = `file-list view-${mode}`;
        
        this.refreshView();
    }

    /**
     * Alterna seleção de item
     */
    toggleItemSelection(item) {
        if (this.selectedItems.has(item.path)) {
            this.selectedItems.delete(item.path);
        } else {
            this.selectedItems.add(item.path);
        }
        this.updateItemSelection();
    }

    /**
     * Atualiza visualização da seleção
     */
    updateItemSelection() {
        this.$$('.file-item').forEach(element => {
            const path = element.dataset.path;
            element.classList.toggle('selected', this.selectedItems.has(path));
        });
    }

    /**
     * Mostra menu de contexto
     */
    showContextMenu(x, y) {
        this.elements.contextMenu.style.left = x + 'px';
        this.elements.contextMenu.style.top = y + 'px';
        this.elements.contextMenu.classList.remove('hidden');
        
        // Atualiza estado dos itens do menu
        const hasSelection = this.selectedItems.size > 0;
        const hasClipboard = this.clipboard !== null;
        const isSingleSelection = this.selectedItems.size === 1;
        
        // Verifica se é um arquivo (não pasta) para mostrar "Abrir com..."
        let isFile = false;
        if (isSingleSelection) {
            const selectedItem = Array.from(this.selectedItems)[0];
            const item = this.currentItems.find(i => i.name === selectedItem);
            isFile = item && item.type === 'file';
        }
        
        this.$('#ctx-open').style.display = isSingleSelection ? 'flex' : 'none';
        this.$('#ctx-open-with').style.display = isFile ? 'flex' : 'none';
        this.$('#ctx-copy').style.display = hasSelection ? 'flex' : 'none';
        this.$('#ctx-cut').style.display = hasSelection ? 'flex' : 'none';
        this.$('#ctx-paste').style.display = hasClipboard ? 'flex' : 'none';
        this.$('#ctx-rename').style.display = isSingleSelection ? 'flex' : 'none';
        this.$('#ctx-delete').style.display = hasSelection ? 'flex' : 'none';
        this.$('#ctx-properties').style.display = isSingleSelection ? 'flex' : 'none';
    }

    /**
     * Oculta menu de contexto
     */
    hideContextMenu() {
        this.elements.contextMenu.classList.add('hidden');
    }

    /**
     * Cria nova pasta
     */
    showNewFolderModal() {
        this.elements.folderNameInput.value = '';
        this.elements.newFolderModal.classList.remove('hidden');
        this.elements.folderNameInput.focus();
    }

    /**
     * Cria nova pasta
     */
    createNewFolder() {
        const name = this.elements.folderNameInput.value.trim();
        
        if (!name) {
            this.showError('Nome da pasta é obrigatório');
            return;
        }
        
        if (name.includes('/')) {
            this.showError('Nome da pasta não pode conter "/"');
            return;
        }
        
        try {
            const folderPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
            fs.mkdir(folderPath);
            this.hideModal('newFolderModal');
            this.refreshView();
            this.showSuccess(`Pasta "${name}" criada com sucesso`);
        } catch (error) {
            this.showError(`Erro ao criar pasta: ${error.message}`);
        }
    }

    /**
     * Mostra modal de novo arquivo
     */
    showNewFileModal() {
        this.elements.fileNameInput.value = '';
        this.elements.newFileModal.classList.remove('hidden');
        this.elements.fileNameInput.focus();
    }

    /**
     * Cria novo arquivo
     */
    createNewFile() {
        const name = this.elements.fileNameInput.value.trim();
        
        if (!name) {
            this.showError('Nome do arquivo é obrigatório');
            return;
        }
        
        if (name.includes('/')) {
            this.showError('Nome do arquivo não pode conter "/"');
            return;
        }
        
        try {
            const filePath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
            fs.touch(filePath, '');
            this.hideModal('newFileModal');
            this.refreshView();
            this.showSuccess(`Arquivo "${name}" criado com sucesso`);
        } catch (error) {
            this.showError(`Erro ao criar arquivo: ${error.message}`);
        }
    }

    /**
     * Copia itens selecionados
     */
    copySelectedItems() {
        if (this.selectedItems.size === 0) return;
        
        this.clipboard = Array.from(this.selectedItems);
        this.clipboardOperation = 'copy';
        this.showSuccess(`${this.selectedItems.size} item(s) copiado(s)`);
        this.hideContextMenu();
    }

    /**
     * Recorta itens selecionados
     */
    cutSelectedItems() {
        if (this.selectedItems.size === 0) return;
        
        this.clipboard = Array.from(this.selectedItems);
        this.clipboardOperation = 'cut';
        this.showSuccess(`${this.selectedItems.size} item(s) recortado(s)`);
        this.hideContextMenu();
    }

    /**
     * Cola itens
     */
    pasteItems() {
        if (!this.clipboard) return;
        
        try {
            this.clipboard.forEach(sourcePath => {
                const sourceName = fs.basename(sourcePath);
                const destPath = this.currentPath === '/' ? `/${sourceName}` : `${this.currentPath}/${sourceName}`;
                
                if (this.clipboardOperation === 'copy') {
                    fs.cp(sourcePath, destPath, { recursive: true });
                } else if (this.clipboardOperation === 'cut') {
                    fs.mv(sourcePath, destPath);
                }
            });
            
            if (this.clipboardOperation === 'cut') {
                this.clipboard = null;
                this.clipboardOperation = null;
            }
            
            this.refreshView();
            this.showSuccess('Itens colados com sucesso');
        } catch (error) {
            this.showError(`Erro ao colar: ${error.message}`);
        }
        
        this.hideContextMenu();
    }

    /**
     * Deleta itens selecionados
     */
    deleteSelectedItems() {
        if (this.selectedItems.size === 0) return;
        
        const confirmed = confirm(`Deseja realmente excluir ${this.selectedItems.size} item(s)?`);
        if (!confirmed) return;
        
        try {
            this.selectedItems.forEach(path => {
                fs.rm(path, { recursive: true });
            });
            
            this.selectedItems.clear();
            this.refreshView();
            this.showSuccess('Itens excluídos com sucesso');
        } catch (error) {
            this.showError(`Erro ao excluir: ${error.message}`);
        }
        
        this.hideContextMenu();
    }

    /**
     * Mostra modal de propriedades
     */
    showPropertiesModal() {
        if (this.selectedItems.size !== 1) return;
        
        const path = Array.from(this.selectedItems)[0];
        
        try {
            const stat = fs.stat(path);
            const created = new Date(stat.created);
            const modified = new Date(stat.modified);
            
            this.elements.propertiesContent.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <strong>Nome:</strong> ${this.escapeHtml(stat.name)}<br>
                    <strong>Caminho:</strong> ${this.escapeHtml(stat.path)}<br>
                    <strong>Tipo:</strong> ${stat.type === 'directory' ? 'Diretório' : 'Arquivo'}<br>
                    <strong>Tamanho:</strong> ${this.formatFileSize(stat.size)}<br>
                    <strong>Permissões:</strong> ${stat.permissions}<br>
                    <strong>Proprietário:</strong> ${stat.owner}<br>
                    <strong>Criado:</strong> ${created.toLocaleString('pt-BR')}<br>
                    <strong>Modificado:</strong> ${modified.toLocaleString('pt-BR')}
                </div>
            `;
            
            this.elements.propertiesModal.classList.remove('hidden');
        } catch (error) {
            this.showError(`Erro ao obter propriedades: ${error.message}`);
        }
        
        this.hideContextMenu();
    }

    /**
     * Manipula atalhos de teclado
     */
    /**
     * Seleciona todos os itens
     */
    selectAll() {
        try {
            const items = fs.ls(this.currentPath);
            this.selectedItems.clear();
            items.forEach(item => this.selectedItems.add(item.path));
            this.updateItemSelection();
        } catch (error) {
            // Ignora erros
        }
    }

    /**
     * Mostra modal
     */
    showModal(modalName) {
        this.hideAllModals(); // Fecha outros modais primeiro
        this.elements[modalName].classList.remove('hidden');
    }

    /**
     * Oculta modal
     */
    hideModal(modalName) {
        this.elements[modalName].classList.add('hidden');
    }

    /**
     * Oculta todos os modais
     */
    hideAllModals() {
        this.hideModal('newFolderModal');
        this.hideModal('newFileModal');
        this.hideModal('propertiesModal');
        this.hideModal('openWithModal');
    }

    /**
     * Formata tamanho de arquivo
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
    }

    /**
     * Escapa HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        console.error(`[${this.appName}] ${message}`);
        // TODO: Implementar sistema de notificações
        alert(`Erro: ${message}`);
    }

    /**
     * Mostra mensagem de sucesso
     */
    showSuccess(message) {
        console.log(`[${this.appName}] ${message}`);
        // TODO: Implementar sistema de notificações
    }

    /**
     * Abre item selecionado
     */
    openSelectedItem() {
        if (this.selectedItems.size === 1) {
            const path = Array.from(this.selectedItems)[0];
            const stat = fs.stat(path);
            this.openItem(stat);
        }
        this.hideContextMenu();
    }

    /**
     * Renomeia item selecionado
     */
    renameSelectedItem() {
        if (this.selectedItems.size !== 1) return;
        
        const path = Array.from(this.selectedItems)[0];
        const currentName = fs.basename(path);
        const newName = prompt('Novo nome:', currentName);
        
        if (newName && newName !== currentName) {
            try {
                const parentPath = fs.dirname(path);
                const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
                fs.mv(path, newPath);
                this.refreshView();
                this.showSuccess(`Item renomeado para "${newName}"`);
            } catch (error) {
                this.showError(`Erro ao renomear: ${error.message}`);
            }
        }
        
        this.hideContextMenu();
    }

    /**
     * Mostra modal "Abrir com..."
     */
    showOpenWithModal() {
        if (this.selectedItems.size !== 1) return;
        
        const selectedItem = Array.from(this.selectedItems)[0];
        const item = this.currentItems.find(i => i.name === selectedItem);
        
        if (!item || item.type !== 'file') return;
        
        const filePath = this.currentPath === '/' ? `/${item.name}` : `${this.currentPath}/${item.name}`;
        const fileExtension = this.getFileExtension(item.name);
        
        // Lista de aplicativos disponíveis com suas capacidades
        const availableApps = this.getAvailableAppsForFile(fileExtension);
        
        const appList = this.$('#open-with-apps');
        appList.innerHTML = '';
        
        if (availableApps.length === 0) {
            appList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum aplicativo disponível para este tipo de arquivo.</p>';
        } else {
            availableApps.forEach(app => {
                const appItem = document.createElement('div');
                appItem.className = 'app-item';
                appItem.innerHTML = `
                    <div class="app-icon">
                        <span class="material-icons-outlined">${app.icon}</span>
                    </div>
                    <div class="app-info">
                        <div class="app-name">${app.name}</div>
                        <div class="app-description">${app.description}</div>
                    </div>
                `;
                
                appItem.addEventListener('click', () => {
                    this.openFileWithSpecificApp(filePath, app.id);
                    this.hideModal('openWithModal');
                });
                
                appList.appendChild(appItem);
            });
        }
        
        this.showModal('openWithModal');
        this.hideContextMenu();
    }

    /**
     * Obtém lista de aplicativos disponíveis para um tipo de arquivo
     */
    getAvailableAppsForFile(extension) {
        const apps = [];
        
        // Editor de texto - suporta vários formatos
        if (['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'xml', 'csv', 'log', 'ini', 'conf', 'yml', 'yaml'].includes(extension)) {
            apps.push({
                id: 'text-editor',
                name: 'Editor de Texto',
                description: 'Editor de texto avançado com destaque de sintaxe',
                icon: 'edit_note'
            });
        }
        
        // Browser - para arquivos web
        if (['html', 'htm', 'url'].includes(extension)) {
            apps.push({
                id: 'browser',
                name: 'Navegador',
                description: 'Navegador web interno',
                icon: 'language'
            });
        }
        
        // Visualizador de imagens (futuro)
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
            apps.push({
                id: 'image-viewer',
                name: 'Visualizador de Imagens',
                description: 'Visualizador de imagens (em desenvolvimento)',
                icon: 'image'
            });
        }
        
        // Leitor de PDF (futuro)
        if (extension === 'pdf') {
            apps.push({
                id: 'pdf-reader',
                name: 'Leitor de PDF',
                description: 'Leitor de documentos PDF (em desenvolvimento)',
                icon: 'picture_as_pdf'
            });
        }
        
        // Terminal - para scripts
        if (['sh', 'bash', 'bat', 'cmd', 'ps1'].includes(extension)) {
            apps.push({
                id: 'terminal',
                name: 'Terminal',
                description: 'Terminal do sistema',
                icon: 'terminal'
            });
        }
        
        return apps;
    }

    /**
     * Abre arquivo com aplicativo específico
     */
    openFileWithSpecificApp(filePath, appId) {
        try {
            // Verifica se o aplicativo está disponível
            if (!window.appManager) {
                this.showError('Sistema de aplicativos não disponível');
                return;
            }

            // Casos especiais para aplicativos que ainda não existem
            if (appId === 'image-viewer' || appId === 'pdf-reader') {
                this.showWarning(`Aplicativo "${appId}" ainda não foi implementado`);
                return;
            }

            // Abre o arquivo com o aplicativo especificado
            window.appManager.runApp(appId, { filePath });
            this.showSuccess(`Arquivo aberto com ${this.getAppName(appId)}`);
            
        } catch (error) {
            console.error('Erro ao abrir arquivo:', error);
            this.showError(`Erro ao abrir arquivo: ${error.message}`);
        }
    }

    /**
     * Obtém nome amigável do aplicativo
     */
    getAppName(appId) {
        const appNames = {
            'text-editor': 'Editor de Texto',
            'browser': 'Navegador',
            'terminal': 'Terminal',
            'image-viewer': 'Visualizador de Imagens',
            'pdf-reader': 'Leitor de PDF'
        };
        return appNames[appId] || appId;
    }

    /**
     * Limpeza quando o aplicativo é fechado
     */
    onCleanup() {
        console.log(`[${this.appName}] Limpando recursos...`);
        
        // Remove event listeners globais
        document.removeEventListener('click', this.hideContextMenu);
        
        console.log(`[${this.appName}] Recursos limpos`);
    }

    /**
     * Comando CLI para o File Manager
     */
    static runCli(args, writeLine) {
        if (args.includes('--help') || args.includes('-h')) {
            writeLine('Uso: file-manager [caminho] [--help]\nAbre o gerenciador de arquivos.');
            return;
        }
        
        const path = args[0];
        if (path) {
            // Passa o caminho inicial como parâmetro
            window.appManager?.runApp('file-manager', { initialPath: path });
        } else {
            window.appManager?.runApp('file-manager');
        }
        writeLine('Gerenciador de arquivos iniciado.');
    }
}
