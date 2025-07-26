// apps/terminal/filesystem-commands.js - v1.0.0
// Comandos de sistema de arquivos para o terminal

import { fs } from '../../core/FileSystem.js';

export const filesystemCommands = {
    pwd: {
        description: "Exibe o diretório atual.",
        action: () => {
            try {
                const currentDir = fs.pwd();
                return `<span class="cyan">${currentDir}</span>`;
            } catch (error) {
                return `<span class="red">Erro: ${error.message}</span>`;
            }
        }
    },

    ls: {
        description: "Lista o conteúdo do diretório atual ou especificado.",
        action: (args) => {
            try {
                const path = args[0] || '.';
                const options = {
                    long: args.includes('-l') || args.includes('--long'),
                    all: args.includes('-a') || args.includes('--all'),
                    human: args.includes('-h') || args.includes('--human-readable')
                };

                const items = fs.ls(path);
                
                if (items.length === 0) {
                    return '<span class="yellow">Diretório vazio</span>';
                }

                let output = '';
                
                if (options.long) {
                    // Formato longo (-l)
                    output += '<span class="yellow">total ' + items.length + '</span><br>';
                    
                    for (const item of items) {
                        const permissions = item.permissions || 'rwxrwxrwx';
                        const owner = item.owner || 'user';
                        const size = item.size || 0;
                        const modified = new Date(item.modified || Date.now());
                        const dateStr = modified.toLocaleDateString('pt-BR') + ' ' + 
                                       modified.toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5);
                        
                        const typeChar = item.type === 'directory' ? 'd' : '-';
                        const colorClass = item.type === 'directory' ? 'blue' : 'white';
                        
                        output += `<span class="gray">${typeChar}${permissions} ${owner.padEnd(8)} ${size.toString().padStart(8)} ${dateStr}</span> `;
                        output += `<span class="${colorClass}">${item.name}</span><br>`;
                    }
                } else {
                    // Formato simples
                    const directories = items.filter(item => item.type === 'directory');
                    const files = items.filter(item => item.type === 'file');
                    
                    // Mostra diretórios primeiro
                    for (const dir of directories) {
                        output += `<span class="blue">${dir.name}/</span>  `;
                    }
                    
                    // Depois os arquivos
                    for (const file of files) {
                        output += `<span class="white">${file.name}</span>  `;
                    }
                    
                    if (output) {
                        output += '<br>';
                    }
                }
                
                return output || '<span class="yellow">Nenhum item encontrado</span>';
                
            } catch (error) {
                return `<span class="red">ls: ${error.message}</span>`;
            }
        }
    },

    cd: {
        description: "Muda para o diretório especificado.",
        action: (args) => {
            try {
                const path = args[0] || '/home/user';
                const newPath = fs.cd(path);
                return `<span class="green">Diretório alterado para: ${newPath}</span>`;
            } catch (error) {
                return `<span class="red">cd: ${error.message}</span>`;
            }
        }
    },

    mkdir: {
        description: "Cria um novo diretório.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">mkdir: nome do diretório é obrigatório</span>';
            }

            try {
                const options = {
                    recursive: args.includes('-p') || args.includes('--parents')
                };

                const directories = args.filter(arg => !arg.startsWith('-'));
                
                for (const dir of directories) {
                    fs.mkdir(dir, options);
                }
                
                const dirList = directories.join(', ');
                return `<span class="green">Diretório(s) criado(s): ${dirList}</span>`;
            } catch (error) {
                return `<span class="red">mkdir: ${error.message}</span>`;
            }
        }
    },

    rmdir: {
        description: "Remove diretórios vazios.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">rmdir: nome do diretório é obrigatório</span>';
            }

            try {
                const directories = args.filter(arg => !arg.startsWith('-'));
                
                for (const dir of directories) {
                    fs.rmdir(dir);
                }
                
                const dirList = directories.join(', ');
                return `<span class="green">Diretório(s) removido(s): ${dirList}</span>`;
            } catch (error) {
                return `<span class="red">rmdir: ${error.message}</span>`;
            }
        }
    },

    touch: {
        description: "Cria um arquivo vazio ou atualiza timestamp.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">touch: nome do arquivo é obrigatório</span>';
            }

            try {
                const files = args.filter(arg => !arg.startsWith('-'));
                
                for (const file of files) {
                    if (fs.exists(file)) {
                        // Arquivo existe, apenas atualiza timestamp
                        const content = fs.cat(file);
                        fs.touch(file, content);
                    } else {
                        // Cria arquivo vazio
                        fs.touch(file, '');
                    }
                }
                
                const fileList = files.join(', ');
                return `<span class="green">Arquivo(s) criado(s)/atualizados: ${fileList}</span>`;
            } catch (error) {
                return `<span class="red">touch: ${error.message}</span>`;
            }
        }
    },

    cat: {
        description: "Exibe o conteúdo de um arquivo.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">cat: nome do arquivo é obrigatório</span>';
            }

            try {
                let output = '';
                
                for (const file of args) {
                    if (args.length > 1) {
                        output += `<span class="yellow">==> ${file} <==</span><br>`;
                    }
                    
                    const content = fs.cat(file);
                    
                    // Processa o conteúdo para HTML seguro
                    const safeContent = content
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n/g, '<br>');
                    
                    output += `<span class="white">${safeContent}</span>`;
                    
                    if (args.length > 1) {
                        output += '<br><br>';
                    }
                }
                
                return output;
            } catch (error) {
                return `<span class="red">cat: ${error.message}</span>`;
            }
        }
    },

    rm: {
        description: "Remove arquivos ou diretórios.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">rm: especifique os arquivos a serem removidos</span>';
            }

            try {
                const options = {
                    recursive: args.includes('-r') || args.includes('-R') || args.includes('--recursive'),
                    force: args.includes('-f') || args.includes('--force')
                };

                const items = args.filter(arg => !arg.startsWith('-'));
                
                for (const item of items) {
                    fs.rm(item, options);
                }
                
                const itemList = items.join(', ');
                return `<span class="green">Removido(s): ${itemList}</span>`;
            } catch (error) {
                return `<span class="red">rm: ${error.message}</span>`;
            }
        }
    },

    cp: {
        description: "Copia arquivos ou diretórios.",
        action: (args) => {
            if (args.length < 2) {
                return '<span class="red">cp: sintaxe: cp origem destino</span>';
            }

            try {
                const options = {
                    recursive: args.includes('-r') || args.includes('-R') || args.includes('--recursive'),
                    force: args.includes('-f') || args.includes('--force')
                };

                const files = args.filter(arg => !arg.startsWith('-'));
                const source = files[0];
                const destination = files[1];
                
                fs.cp(source, destination, options);
                
                return `<span class="green">Copiado: ${source} → ${destination}</span>`;
            } catch (error) {
                return `<span class="red">cp: ${error.message}</span>`;
            }
        }
    },

    mv: {
        description: "Move ou renomeia arquivos ou diretórios.",
        action: (args) => {
            if (args.length < 2) {
                return '<span class="red">mv: sintaxe: mv origem destino</span>';
            }

            try {
                const files = args.filter(arg => !arg.startsWith('-'));
                const source = files[0];
                const destination = files[1];
                
                fs.mv(source, destination);
                
                return `<span class="green">Movido: ${source} → ${destination}</span>`;
            } catch (error) {
                return `<span class="red">mv: ${error.message}</span>`;
            }
        }
    },

    find: {
        description: "Busca arquivos e diretórios por padrão.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">find: sintaxe: find [diretório] -name "padrão"</span>';
            }

            try {
                let startPath = '.';
                let pattern = '*';
                let nameIndex = -1;
                
                // Procura pelo parâmetro -name
                for (let i = 0; i < args.length; i++) {
                    if (args[i] === '-name' && i + 1 < args.length) {
                        nameIndex = i + 1;
                        pattern = args[nameIndex];
                        break;
                    }
                }
                
                // Se não começar com '-', é o diretório de início
                if (!args[0].startsWith('-')) {
                    startPath = args[0];
                }
                
                const results = fs.find(pattern, startPath, { recursive: true });
                
                if (results.length === 0) {
                    return `<span class="yellow">Nenhum arquivo encontrado para o padrão: ${pattern}</span>`;
                }
                
                let output = '';
                for (const result of results) {
                    const colorClass = result.type === 'directory' ? 'blue' : 'white';
                    const suffix = result.type === 'directory' ? '/' : '';
                    output += `<span class="${colorClass}">${result.path}${suffix}</span><br>`;
                }
                
                return output;
            } catch (error) {
                return `<span class="red">find: ${error.message}</span>`;
            }
        }
    },

    tree: {
        description: "Exibe a estrutura de diretórios em árvore.",
        action: (args) => {
            try {
                const startPath = args[0] || '.';
                const maxDepth = args.includes('-d') ? parseInt(args[args.indexOf('-d') + 1]) || 3 : 3;
                
                const output = this._generateTree(startPath, '', maxDepth, 0);
                return output || '<span class="yellow">Diretório vazio</span>';
            } catch (error) {
                return `<span class="red">tree: ${error.message}</span>`;
            }
        },
        
        _generateTree: function(path, prefix, maxDepth, currentDepth) {
            if (currentDepth >= maxDepth) {
                return '';
            }
            
            try {
                const items = fs.ls(path);
                let output = '';
                
                items.forEach((item, index) => {
                    const isLast = index === items.length - 1;
                    const connector = isLast ? '└── ' : '├── ';
                    const colorClass = item.type === 'directory' ? 'blue' : 'white';
                    const suffix = item.type === 'directory' ? '/' : '';
                    
                    output += `${prefix}${connector}<span class="${colorClass}">${item.name}${suffix}</span><br>`;
                    
                    if (item.type === 'directory' && currentDepth + 1 < maxDepth) {
                        const newPrefix = prefix + (isLast ? '    ' : '│   ');
                        output += this._generateTree(item.path, newPrefix, maxDepth, currentDepth + 1);
                    }
                });
                
                return output;
            } catch (error) {
                return '';
            }
        }
    },

    stat: {
        description: "Exibe informações detalhadas sobre um arquivo ou diretório.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">stat: especifique um arquivo ou diretório</span>';
            }

            try {
                const path = args[0];
                const stats = fs.stat(path);
                
                const created = new Date(stats.created);
                const modified = new Date(stats.modified);
                
                let output = `<span class="yellow">Arquivo:</span> ${stats.path}<br>`;
                output += `<span class="yellow">Tipo:</span> ${stats.type === 'directory' ? 'Diretório' : 'Arquivo'}<br>`;
                output += `<span class="yellow">Tamanho:</span> ${stats.size} bytes<br>`;
                output += `<span class="yellow">Permissões:</span> ${stats.permissions}<br>`;
                output += `<span class="yellow">Proprietário:</span> ${stats.owner}<br>`;
                output += `<span class="yellow">Criado:</span> ${created.toLocaleString('pt-BR')}<br>`;
                output += `<span class="yellow">Modificado:</span> ${modified.toLocaleString('pt-BR')}<br>`;
                
                if (stats.type === 'directory') {
                    const items = fs.ls(path);
                    output += `<span class="yellow">Itens:</span> ${items.length}<br>`;
                }
                
                return output;
            } catch (error) {
                return `<span class="red">stat: ${error.message}</span>`;
            }
        }
    },

    du: {
        description: "Exibe o uso de espaço em disco dos diretórios.",
        action: (args) => {
            try {
                const path = args[0] || '.';
                const human = args.includes('-h') || args.includes('--human-readable');
                
                const calculateSize = (dirPath) => {
                    try {
                        const items = fs.ls(dirPath);
                        let totalSize = 0;
                        
                        items.forEach(item => {
                            if (item.type === 'file') {
                                totalSize += item.size || 0;
                            } else if (item.type === 'directory') {
                                totalSize += calculateSize(item.path);
                            }
                        });
                        
                        return totalSize;
                    } catch (error) {
                        return 0;
                    }
                };
                
                const size = calculateSize(path);
                const displaySize = human ? this._humanReadableSize(size) : size.toString();
                
                return `<span class="cyan">${displaySize}</span>\t<span class="white">${path}</span>`;
            } catch (error) {
                return `<span class="red">du: ${error.message}</span>`;
            }
        },
        
        _humanReadableSize: function(bytes) {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;
            
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
            
            return `${Math.round(size * 10) / 10}${units[unitIndex]}`;
        }
    },

    df: {
        description: "Exibe informações sobre o uso do sistema de arquivos.",
        action: (args) => {
            try {
                const human = args.includes('-h') || args.includes('--human-readable');
                
                // Simula informações do sistema de arquivos
                const totalSpace = 1024 * 1024 * 1024; // 1GB simulado
                const usedSpace = localStorage.getItem('unkayOS_filesystem')?.length || 0;
                const freeSpace = totalSpace - usedSpace;
                const percentUsed = Math.round((usedSpace / totalSpace) * 100);
                
                const formatSize = (bytes) => {
                    if (human) {
                        const units = ['B', 'KB', 'MB', 'GB'];
                        let size = bytes;
                        let unitIndex = 0;
                        
                        while (size >= 1024 && unitIndex < units.length - 1) {
                            size /= 1024;
                            unitIndex++;
                        }
                        
                        return `${Math.round(size * 10) / 10}${units[unitIndex]}`;
                    }
                    return bytes.toString();
                };
                
                let output = '<span class="yellow">Sistema de Arquivos  Tamanho  Usado  Disponível  Uso%  Montado em</span><br>';
                output += `<span class="white">unkayOS_fs         ${formatSize(totalSpace).padEnd(8)} ${formatSize(usedSpace).padEnd(6)} ${formatSize(freeSpace).padEnd(11)} ${percentUsed}%   /</span>`;
                
                return output;
            } catch (error) {
                return `<span class="red">df: ${error.message}</span>`;
            }
        }
    },

    nano: {
        description: "Editor de texto simples para arquivos.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (args.length === 0) {
                return '<span class="red">nano: especifique um arquivo para editar</span>';
            }

            const filePath = args[0];
            
            try {
                let content = '';
                let isNewFile = false;
                
                if (fs.exists(filePath)) {
                    const stat = fs.stat(filePath);
                    if (stat.type === 'directory') {
                        return `<span class="red">nano: ${filePath} é um diretório</span>`;
                    }
                    content = fs.cat(filePath);
                } else {
                    isNewFile = true;
                }
                
                // Cria um editor simples inline
                const editorId = 'nano-editor-' + Date.now();
                const output = `
                    <div id="${editorId}" class="nano-editor">
                        <div class="nano-header">
                            <span class="yellow">GNU nano 6.2</span> - Editando: <span class="cyan">${filePath}</span>
                            ${isNewFile ? '<span class="green">[Novo Arquivo]</span>' : ''}
                        </div>
                        <textarea class="nano-textarea" rows="15" cols="80">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                        <div class="nano-footer">
                            <span class="white">^X Sair  ^S Salvar  ^W Onde Está  ^K Recortar  ^U Desfazer</span>
                        </div>
                    </div>
                    <style>
                        .nano-editor {
                            margin: 10px 0;
                            border: 1px solid #444;
                            background: #1e1e1e;
                            font-family: monospace;
                        }
                        .nano-header, .nano-footer {
                            background: #333;
                            padding: 5px 10px;
                            font-size: 12px;
                        }
                        .nano-textarea {
                            width: 100%;
                            background: #1e1e1e;
                            color: #fff;
                            border: none;
                            padding: 10px;
                            font-family: monospace;
                            font-size: 13px;
                            resize: vertical;
                            outline: none;
                        }
                    </style>
                `;
                
                appendToTerminal(output);
                
                // Adiciona funcionalidade de salvamento
                setTimeout(() => {
                    const editor = terminalOutput.querySelector(`#${editorId}`);
                    const textarea = editor.querySelector('.nano-textarea');
                    
                    textarea.addEventListener('keydown', (e) => {
                        if (e.ctrlKey) {
                            switch (e.key.toLowerCase()) {
                                case 's':
                                    e.preventDefault();
                                    try {
                                        fs.touch(filePath, textarea.value);
                                        appendToTerminal(`<span class="green">Arquivo salvo: ${filePath}</span>`);
                                    } catch (error) {
                                        appendToTerminal(`<span class="red">Erro ao salvar: ${error.message}</span>`);
                                    }
                                    break;
                                case 'x':
                                    e.preventDefault();
                                    editor.remove();
                                    appendToTerminal('<span class="yellow">Editor fechado</span>');
                                    break;
                            }
                        }
                    });
                    
                    textarea.focus();
                }, 100);
                
                return '';
            } catch (error) {
                return `<span class="red">nano: ${error.message}</span>`;
            }
        }
    },

    head: {
        description: "Exibe as primeiras linhas de um arquivo.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">head: especifique um arquivo</span>';
            }

            try {
                const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
                const filePath = args.filter(arg => !arg.startsWith('-') && arg !== args[args.indexOf('-n') + 1])[0];
                
                const content = fs.cat(filePath);
                const fileLines = content.split('\n');
                const displayLines = fileLines.slice(0, lines);
                
                const safeContent = displayLines
                    .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
                    .join('<br>');
                
                return `<span class="white">${safeContent}</span>`;
            } catch (error) {
                return `<span class="red">head: ${error.message}</span>`;
            }
        }
    },

    tail: {
        description: "Exibe as últimas linhas de um arquivo.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">tail: especifique um arquivo</span>';
            }

            try {
                const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
                const filePath = args.filter(arg => !arg.startsWith('-') && arg !== args[args.indexOf('-n') + 1])[0];
                
                const content = fs.cat(filePath);
                const fileLines = content.split('\n');
                const displayLines = fileLines.slice(-lines);
                
                const safeContent = displayLines
                    .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
                    .join('<br>');
                
                return `<span class="white">${safeContent}</span>`;
            } catch (error) {
                return `<span class="red">tail: ${error.message}</span>`;
            }
        }
    },

    grep: {
        description: "Busca por padrões em arquivos.",
        action: (args) => {
            if (args.length < 2) {
                return '<span class="red">grep: sintaxe: grep "padrão" arquivo</span>';
            }

            try {
                const pattern = args[0];
                const filePath = args[1];
                const ignoreCase = args.includes('-i');
                
                const content = fs.cat(filePath);
                const lines = content.split('\n');
                const regex = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
                
                let output = '';
                let matchCount = 0;
                
                lines.forEach((line, index) => {
                    if (regex.test(line)) {
                        matchCount++;
                        const lineNumber = (index + 1).toString().padStart(3, ' ');
                        const highlightedLine = line.replace(regex, '<span class="yellow">$&</span>');
                        output += `<span class="cyan">${lineNumber}:</span> ${highlightedLine}<br>`;
                    }
                });
                
                if (matchCount === 0) {
                    return `<span class="yellow">Nenhuma correspondência encontrada para "${pattern}"</span>`;
                }
                
                return output + `<br><span class="green">Total: ${matchCount} correspondência(s)</span>`;
            } catch (error) {
                return `<span class="red">grep: ${error.message}</span>`;
            }
        }
    },

    wc: {
        description: "Conta linhas, palavras e caracteres em arquivos.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">wc: especifique um arquivo</span>';
            }

            try {
                const filePath = args.filter(arg => !arg.startsWith('-'))[0];
                const content = fs.cat(filePath);
                
                const lines = content.split('\n').length;
                const words = content.trim() ? content.trim().split(/\s+/).length : 0;
                const chars = content.length;
                const bytes = new Blob([content]).size;
                
                let output = '';
                
                if (args.includes('-l')) {
                    output = lines.toString();
                } else if (args.includes('-w')) {
                    output = words.toString();
                } else if (args.includes('-c')) {
                    output = bytes.toString();
                } else if (args.includes('-m')) {
                    output = chars.toString();
                } else {
                    output = `${lines.toString().padStart(8)} ${words.toString().padStart(8)} ${bytes.toString().padStart(8)}`;
                }
                
                return `<span class="cyan">${output}</span> <span class="white">${filePath}</span>`;
            } catch (error) {
                return `<span class="red">wc: ${error.message}</span>`;
            }
        }
    },

    file: {
        description: "Determina o tipo de arquivo.",
        action: (args) => {
            if (args.length === 0) {
                return '<span class="red">file: especifique um arquivo</span>';
            }

            try {
                let output = '';
                
                args.forEach(filePath => {
                    if (!fs.exists(filePath)) {
                        output += `<span class="red">${filePath}: Arquivo não encontrado</span><br>`;
                        return;
                    }
                    
                    const stat = fs.stat(filePath);
                    let fileType = '';
                    
                    if (stat.type === 'directory') {
                        fileType = 'directory';
                    } else {
                        const extension = filePath.split('.').pop().toLowerCase();
                        
                        switch (extension) {
                            case 'txt':
                            case 'md':
                            case 'log':
                                fileType = 'text file';
                                break;
                            case 'js':
                                fileType = 'JavaScript source';
                                break;
                            case 'css':
                                fileType = 'CSS stylesheet';
                                break;
                            case 'html':
                                fileType = 'HTML document';
                                break;
                            case 'json':
                                fileType = 'JSON data';
                                break;
                            case 'svg':
                                fileType = 'SVG image';
                                break;
                            case 'png':
                            case 'jpg':
                            case 'jpeg':
                            case 'gif':
                                fileType = 'image file';
                                break;
                            default:
                                const content = fs.cat(filePath);
                                if (content.length === 0) {
                                    fileType = 'empty file';
                                } else if (/^[\x20-\x7E\s]*$/.test(content)) {
                                    fileType = 'ASCII text';
                                } else {
                                    fileType = 'data';
                                }
                        }
                    }
                    
                    output += `<span class="cyan">${filePath}:</span> <span class="white">${fileType}</span><br>`;
                });
                
                return output;
            } catch (error) {
                return `<span class="red">file: ${error.message}</span>`;
            }
        }
    },

    // Comando para abrir o gerenciador de arquivos
    "file-manager": {
        description: "Abre o gerenciador de arquivos.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            try {
                const path = args[0];
                if (path) {
                    // Verifica se o caminho existe antes de abrir
                    if (!fs.exists(path)) {
                        return `<span class="red">Caminho não encontrado: ${path}</span>`;
                    }
                    appManager?.runApp('file-manager', { initialPath: path });
                } else {
                    appManager?.runApp('file-manager');
                }
                return '<span class="green">Gerenciador de arquivos aberto</span>';
            } catch (error) {
                return `<span class="red">Erro ao abrir gerenciador de arquivos: ${error.message}</span>`;
            }
        }
    },

    // Comando para abrir o editor de texto
    "text-editor": {
        description: "Abre o editor de texto.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            try {
                const filePath = args[0];
                if (filePath) {
                    // Verifica se o arquivo existe
                    if (fs.exists(filePath)) {
                        const stat = fs.stat(filePath);
                        if (stat.type !== 'file') {
                            return `<span class="red">${filePath} não é um arquivo</span>`;
                        }
                        appManager?.runApp('text-editor', { file: filePath });
                        return `<span class="green">Editor de texto aberto com arquivo: ${filePath}</span>`;
                    } else {
                        // Pergunta se quer criar o arquivo
                        const createFile = confirm(`O arquivo ${filePath} não existe. Deseja criá-lo?`);
                        if (createFile) {
                            try {
                                fs.touch(filePath, '');
                                appManager?.runApp('text-editor', { file: filePath });
                                return `<span class="green">Arquivo criado e editor aberto: ${filePath}</span>`;
                            } catch (error) {
                                return `<span class="red">Erro ao criar arquivo: ${error.message}</span>`;
                            }
                        } else {
                            return '<span class="yellow">Operação cancelada</span>';
                        }
                    }
                } else {
                    appManager?.runApp('text-editor');
                    return '<span class="green">Editor de texto aberto</span>';
                }
            } catch (error) {
                return `<span class="red">Erro ao abrir editor de texto: ${error.message}</span>`;
            }
        }
    },

    // Atalho para text-editor
    edit: {
        description: "Atalho para o editor de texto.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            return filesystemCommands["text-editor"].action(args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager);
        }
    },

    // Atalho para file-manager
    fm: {
        description: "Atalho para o gerenciador de arquivos.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            return filesystemCommands["file-manager"].action(args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager);
        }
    },

    // Comando para mostrar informações do sistema de arquivos
    fsinfo: {
        description: "Exibe informações sobre o sistema de arquivos UnkayOS.",
        action: () => {
            try {
                const fsData = localStorage.getItem('unkayOS_filesystem');
                const fsSize = fsData ? fsData.length : 0;
                const totalEntries = fsData ? Object.keys(JSON.parse(fsData)).length : 0;
                
                let output = '<span class="yellow">Sistema de Arquivos UnkayOS</span><br>';
                output += '<span class="cyan">─────────────────────────────</span><br>';
                output += `<span class="white">Tipo:</span> Sistema Virtual<br>`;
                output += `<span class="white">Armazenamento:</span> LocalStorage<br>`;
                output += `<span class="white">Tamanho dos dados:</span> ${fsSize} bytes<br>`;
                output += `<span class="white">Total de entradas:</span> ${totalEntries}<br>`;
                output += `<span class="white">Suporte a:</span> Arquivos e diretórios<br>`;
                output += `<span class="white">Permissões:</span> Simuladas<br>`;
                output += `<span class="white">Caminhos:</span> Estilo Unix (/)<br>`;
                output += '<br><span class="green">Comandos disponíveis:</span><br>';
                output += '<span class="white">ls, cd, pwd, mkdir, rmdir, touch, cat, rm, cp, mv, find, tree, stat, du, df</span><br>';
                output += '<span class="white">nano, head, tail, grep, wc, file, file-manager (fm), fsinfo</span>';
                
                return output;
            } catch (error) {
                return `<span class="red">Erro ao obter informações: ${error.message}</span>`;
            }
        }
    },

    // Comando para sincronizar com arquivos reais
    sync: {
        description: 'Sincroniza o sistema de arquivos virtual com arquivos reais do projeto',
        usage: 'sync [--reset|--real|--file <caminho>]',
        execute: async (args) => {
            const fs = window.fileSystem;
            if (!fs) {
                return 'Erro: Sistema de arquivos não disponível';
            }

            if (args.includes('--reset')) {
                const result = fs.resetFileSystem();
                if (result.success) {
                    return `${result.message}\nO sistema foi resetado com a estrutura real do UnkayOS.`;
                } else {
                    return `Erro: ${result.error}`;
                }
            } else if (args.includes('--real')) {
                // Carrega o mapeador de arquivos reais
                try {
                    const { RealFileMapper } = await import('/core/utils/realFileMapper.js');
                    const mapper = new RealFileMapper(fs);
                    const result = await mapper.syncAllFiles();
                    
                    let output = result.message + '\n\n';
                    if (result.results) {
                        const failed = result.results.filter(r => !r.success);
                        if (failed.length > 0) {
                            output += 'Arquivos que falharam:\n';
                            failed.forEach(f => {
                                output += `  ❌ ${f.path}: ${f.error}\n`;
                            });
                        }
                    }
                    return output;
                } catch (error) {
                    return `Erro ao carregar mapeador: ${error.message}`;
                }
            } else if (args.includes('--file') && args[args.indexOf('--file') + 1]) {
                const filePath = args[args.indexOf('--file') + 1];
                try {
                    const { RealFileMapper } = await import('/core/utils/realFileMapper.js');
                    const mapper = new RealFileMapper(fs);
                    const result = await mapper.syncFile(filePath);
                    
                    if (result.success) {
                        return `✅ ${result.message}`;
                    } else {
                        return `❌ Erro: ${result.error}`;
                    }
                } catch (error) {
                    return `Erro: ${error.message}`;
                }
            } else {
                const result = await fs.syncWithRealFiles();
                if (result.success) {
                    return `${result.message}\nArquivos de configuração foram atualizados.\n\nUse 'sync --real' para sincronizar todos os arquivos reais.`;
                } else {
                    return `Erro: ${result.error}`;
                }
            }
        }
    },

    // Comando para listar arquivos reais mapeados
    realfiles: {
        description: 'Lista arquivos reais mapeados no sistema virtual',
        usage: 'realfiles',
        execute: async () => {
            try {
                const { RealFileMapper } = await import('/core/utils/realFileMapper.js');
                const mapper = new RealFileMapper(window.fileSystem);
                await mapper.mapRealProjectStructure();
                const files = mapper.listMappedFiles();
                
                let output = `Arquivos Reais Mapeados (${files.length}):\n\n`;
                
                // Agrupa por diretório
                const groups = {};
                files.forEach(file => {
                    const dir = file.substring(0, file.lastIndexOf('/')) || '/';
                    if (!groups[dir]) groups[dir] = [];
                    groups[dir].push(file.substring(file.lastIndexOf('/') + 1));
                });
                
                Object.keys(groups).sort().forEach(dir => {
                    output += `📁 ${dir}\n`;
                    groups[dir].forEach(file => {
                        output += `  📄 ${file}\n`;
                    });
                    output += '\n';
                });
                
                return output;
            } catch (error) {
                return `Erro: ${error.message}`;
            }
        }
    },

    // Comando para mostrar informações do sistema
    sysinfo: {
        description: 'Mostra informações sobre o UnkayOS',
        usage: 'sysinfo',
        execute: () => {
            return `UnkayOS - Sistema Operacional Web
Versão: 1.0.0
Arquitetura: Modular JavaScript/HTML/CSS

Estrutura do Sistema:
• /apps/         - Aplicativos do sistema
• /core/         - Núcleo do UnkayOS  
• /assets/       - Recursos visuais
• /design-system/ - Sistema de design
• /docs/         - Documentação
• /home/user/    - Diretório do usuário
• /tmp/          - Arquivos temporários

Aplicativos Instalados:
• Terminal       - Interface de linha de comando
• File Manager   - Gerenciador de arquivos
• Browser        - TheOrb Web Browser
• System Info    - Informações do sistema
• Process Manager - Gerenciador de processos
• Clock          - Relógio do sistema
• About          - Sobre o UnkayOS
• Taskbar        - Barra de tarefas

Sistema de Arquivos: LocalStorage (Virtual)
Estado: Funcionando corretamente`;
        }
    }
};
