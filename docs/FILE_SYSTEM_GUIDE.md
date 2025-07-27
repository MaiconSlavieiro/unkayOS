# Sistema de Arquivos UnkayOS

O UnkayOS agora possui um sistema de arquivos completo e funcional que simula operações tradicionais de um sistema operacional real. O sistema é implementado integralmente em JavaScript e utiliza o LocalStorage para persistência dos dados.

## 🌟 Características Principais

### 📁 **Estrutura Hierárquica**
- Sistema de diretórios aninhados estilo Unix
- Caminhos absolutos e relativos suportados
- Navegação familiar com `/`, `..` e `.`

### 💾 **Persistência de Dados**
- Todos os dados são salvos automaticamente no LocalStorage
- Sobrevive ao recarregamento da página
- Estrutura JSON otimizada para performance

### 🔒 **Sistema de Permissões**
- Permissões simuladas estilo Unix (rwx)
- Proprietários de arquivos e diretórios
- Controle de acesso baseado em funções

### 🖥️ **Interface Dupla**
- **Terminal**: Comandos tradicionais Unix/Linux
- **GUI**: Gerenciador de arquivos com interface moderna

## 📂 Estrutura Padrão do Sistema

```
/
├── home/
│   ├── user/
│   │   ├── Desktop/
│   │   ├── Documents/
│   │   │   └── readme.txt
│   │   └── Downloads/
│   └── guest/
├── system/
│   ├── bin/
│   ├── etc/
│   ├── lib/
│   └── var/
│       ├── log/
│       └── tmp/
├── apps/
└── tmp/
```

## 🔧 Comandos Disponíveis no Terminal

### Navegação e Listagem
- `pwd` - Exibe o diretório atual
- `ls [-l]` - Lista o conteúdo do diretório
- `cd <caminho>` - Muda para o diretório especificado
- `tree [-d <profundidade>]` - Exibe estrutura em árvore

### Manipulação de Diretórios
- `mkdir [-p] <nome>` - Cria novo diretório
- `rmdir <nome>` - Remove diretório vazio
- `rm -r <nome>` - Remove diretório recursivamente

### Manipulação de Arquivos
- `touch <arquivo>` - Cria arquivo vazio ou atualiza timestamp
- `cat <arquivo>` - Exibe conteúdo do arquivo
- `rm <arquivo>` - Remove arquivo
- `cp [-r] <origem> <destino>` - Copia arquivo/diretório
- `mv <origem> <destino>` - Move/renomeia arquivo/diretório

### Edição de Texto
- `nano <arquivo>` - Editor de texto inline
  - `Ctrl+S` - Salvar
  - `Ctrl+X` - Sair

### Busca e Análise
- `find <padrão>` - Busca arquivos por nome
- `grep <padrão> <arquivo>` - Busca texto dentro de arquivos
- `head [-n <linhas>] <arquivo>` - Primeiras linhas
- `tail [-n <linhas>] <arquivo>` - Últimas linhas
- `wc [-l|-w|-c] <arquivo>` - Conta linhas, palavras, caracteres

### Informações do Sistema
- `stat <item>` - Informações detalhadas sobre arquivo/diretório
- `du [-h] <caminho>` - Uso de espaço em disco
- `df [-h]` - Informações do sistema de arquivos
- `file <arquivo>` - Determina tipo do arquivo
- `fsinfo` - Informações do sistema de arquivos UnkayOS

### Interface Gráfica
- `file-manager` ou `fm` - Abre o gerenciador de arquivos
- `file-manager <caminho>` - Abre em diretório específico

## 🖱️ Gerenciador de Arquivos (GUI)

### Características
- **Visualização em Lista e Grade**: Alternar entre modos de visualização
- **Navegação Intuitiva**: Botões voltar/avançar, barra de endereços
- **Sidebar com Atalhos**: Acesso rápido a locais importantes
- **Menu de Contexto**: Clique direito para ações rápidas
- **Breadcrumb Navigation**: Navegação visual por caminhos
- **Drag & Drop**: Suporte completo (planejado)

### Atalhos de Teclado
- `Ctrl+A` - Selecionar tudo
- `Ctrl+C` - Copiar
- `Ctrl+X` - Recortar
- `Ctrl+V` - Colar
- `Ctrl+N` - Novo arquivo
- `Ctrl+Shift+N` - Nova pasta
- `Delete` - Excluir selecionados
- `F5` - Atualizar
- `Backspace` - Diretório pai

### Ações Disponíveis
- Criar pastas e arquivos
- Copiar, recortar e colar
- Renomear itens
- Excluir com confirmação
- Visualizar propriedades
- Navegação por breadcrumb

## 🔌 API para Desenvolvedores

O sistema de arquivos expõe uma API JavaScript limpa para uso em aplicativos:

```javascript
import { fs } from '/core/FileSystem.js';

// Operações básicas
const items = fs.ls('/home/user');          // Listar diretório
const content = fs.cat('/home/user/file.txt'); // Ler arquivo
fs.touch('/home/user/novo.txt', 'conteúdo'); // Criar/escrever arquivo
fs.mkdir('/home/user/nova-pasta');         // Criar diretório

// Navegação
fs.cd('/home/user/Documents');             // Mudar diretório
const currentPath = fs.pwd();               // Diretório atual

// Operações avançadas
fs.cp('/origem', '/destino');               // Copiar
fs.mv('/origem', '/destino');               // Mover/renomear
fs.rm('/arquivo', { recursive: true });    // Remover

// Utilitários
const exists = fs.exists('/caminho');       // Verificar existência
const stats = fs.stat('/arquivo');          // Informações detalhadas
const results = fs.find('*.txt', '/home');  // Buscar arquivos
```

## 💡 Recursos Avançados

### Busca com Padrões
```bash
find /home -name "*.txt"      # Buscar arquivos .txt
find /home -name "doc*"       # Buscar arquivos que começam com "doc"
grep "palavra" arquivo.txt    # Buscar texto dentro de arquivo
```

### Editor de Texto Integrado
```bash
nano arquivo.txt              # Abre editor inline
# Ctrl+S para salvar, Ctrl+X para sair
```

### Análise de Arquivos
```bash
file documento.txt            # Determina tipo do arquivo
wc arquivo.txt                # Estatísticas do arquivo
stat arquivo.txt              # Informações detalhadas
```

### Gerenciamento de Espaço
```bash
du -h /home/user              # Uso de espaço legível
df -h                         # Informações do sistema
```

## 🔄 Integração com Aplicativos

O sistema de arquivos se integra perfeitamente com outros aplicativos do UnkayOS:

- **Terminal**: Comandos nativos para manipulação
- **File Manager**: Interface gráfica completa
- **Aplicativos**: API unificada para acesso a arquivos
- **Sistema**: Persistência automática e recuperação

## 🚀 Exemplos de Uso

### Criando um Projeto
```bash
mkdir /home/user/meu-projeto
cd /home/user/meu-projeto
touch README.md
touch index.html
mkdir src css js
echo "# Meu Projeto" > README.md
tree                          # Visualizar estrutura
```

### Organizando Arquivos
```bash
mkdir /home/user/Documents/trabalho
cp /home/user/Desktop/*.txt /home/user/Documents/trabalho/
rm /home/user/Desktop/*.txt
ls -l /home/user/Documents/trabalho/
```

### Editando Configurações
```bash
nano /home/user/.bashrc       # Criar arquivo de configuração
echo "export PATH=$PATH:/usr/local/bin" >> /home/user/.bashrc
cat /home/user/.bashrc        # Verificar conteúdo
```

## 🛠️ Implementação Técnica

### Arquitetura
- **Core**: Sistema de arquivos virtual em JavaScript puro
- **Storage**: Persistência via LocalStorage com estrutura JSON
- **API**: Interface unificada para comandos e GUI
- **Commands**: Integração com terminal via comandos Unix-like

### Performance
- Carregamento sob demanda de diretórios grandes
- Cache inteligente para operações frequentes
- Otimização de JSON para reduzir uso de storage
- Operações assíncronas quando necessário

### Extensibilidade
- Sistema de plugins para novos comandos
- API aberta para integração com aplicativos
- Hooks para interceptar operações de arquivo
- Suporte a tipos de arquivo customizados

## 🎯 Roadmap Futuro

- [ ] **Compressão de Dados**: Reduzir uso do LocalStorage
- [ ] **IndexedDB**: Migração para armazenamento mais robusto
- [ ] **Busca Indexada**: Sistema de busca de conteúdo mais rápido
- [ ] **Versionamento**: Sistema de backup e histórico de mudanças
- [ ] **Compartilhamento**: Integração com APIs de cloud storage
- [ ] **Permissões Avançadas**: Sistema de ACL mais sofisticado
- [ ] **Drag & Drop**: Suporte completo no File Manager
- [ ] **Thumbnails**: Pré-visualização de imagens e documentos

O sistema de arquivos do UnkayOS representa um marco na evolução do sistema, proporcionando uma experiência completa e familiar para usuários vindos de sistemas operacionais tradicionais, mantendo a flexibilidade e modernidade de uma plataforma web.
