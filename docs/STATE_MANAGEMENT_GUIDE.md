# Guia do Gerenciamento de Estado Centralizado - unkayOS

## Visão Geral

Este documento descreve a implementação do **SystemManager**, uma solução centralizada para o gerenciamento de estado que resolve os problemas de singletons fragmentados e inicialização desordenada no unkayOS.

## Problema Anterior

Antes da implementação do SystemManager, o unkayOS sofria de:

1. **Singletons Fragmentados**: Cada sistema era inicializado separadamente no `main.js`
2. **Dependências Circulares**: Sistemas se referenciavam mutuamente sem ordem definida
3. **Vazamentos de Memória**: Falta de procedimentos de cleanup centralizados
4. **Inconsistência**: Diferentes formas de acessar os mesmos sistemas

## Solução: SystemManager

### Arquitetura

O `SystemManager` é um singleton que gerencia todo o ciclo de vida dos sistemas do unkayOS:

```javascript
// Antes (fragmentado)
window.appManager = new AppManager(desktop, null, appConfigs);
window.authSystem = new AuthSystem();
window.keyboardManager = keyboardManager;
// ... e assim por diante

// Depois (centralizado)
await systemManager.initialize(desktop);
const appManager = systemManager.getSystem('appManager');
```

### Fases de Inicialização

O SystemManager implementa um sistema de 4 fases para garantir ordem correta:

#### Fase 1: Sistemas Base
- LoadingManager
- LoadingUI  
- EventBus
- LazyResourceLoader

#### Fase 2: Dependências Leves
- FileSystem
- KeyboardManager

#### Fase 3: Sistemas Complexos
- AuthSystem
- AppManager

#### Fase 4: Auto-executáveis
- Apps marcados como `autorun: true`

### Benefícios

1. **Ordem Determinística**: Sistemas são inicializados na ordem correta
2. **Cleanup Automático**: Procedimento de shutdown padronizado
3. **Acesso Centralizado**: API única para obter qualquer sistema
4. **Monitoramento**: Estatísticas e logs centralizados
5. **Compatibilidade**: Mantém API backward-compatible

## API do SystemManager

### Métodos Principais

```javascript
// Inicializar todos os sistemas
await systemManager.initialize(desktopElement);

// Obter um sistema específico
const appManager = systemManager.getSystem('appManager');
const authSystem = systemManager.getSystem('authSystem');

// Verificar se está inicializado
if (systemManager.isInitialized) {
    // Sistema pronto para uso
}

// Obter estatísticas
const stats = systemManager.getSystemStats();

// Shutdown limpo
await systemManager.shutdown();
```

### Sistemas Disponíveis

| Sistema | Chave | Descrição |
|---------|-------|-----------|
| LoadingManager | `loadingManager` | Gerencia estados de carregamento |
| LoadingUI | `loadingUI` | Interface de loading |
| LazyResourceLoader | `lazyResourceLoader` | Carregamento sob demanda |
| FileSystem | `fileSystem` | Sistema de arquivos virtual |
| FS | `fs` | API de sistema de arquivos |
| KeyboardManager | `keyboardManager` | Gerenciamento de teclado |
| AuthSystem | `authSystem` | Sistema de autenticação |
| AppManager | `appManager` | Gerenciador de aplicativos |

## Integração em Apps

### BaseApp Atualizado

O `BaseApp` agora utiliza o SystemManager automaticamente:

```javascript
// Métodos atualizados para usar SystemManager
async registerKeyboardShortcut(keys, callback, options = {}) {
    let keyboardManager = null;
    
    // Primeiro tenta usar o SystemManager
    if (window.systemManager?.isInitialized) {
        keyboardManager = window.systemManager.getSystem('keyboardManager');
    }
    
    // Fallbacks para compatibilidade
    if (!keyboardManager && window.keyboardManager) {
        keyboardManager = window.keyboardManager;
    }
    
    // ... resto da implementação
}
```

### AppCore Atualizado

O `AppCore` agora usa o SystemManager como fonte primária:

```javascript
// Sistemas disponíveis para apps
appManager: window.systemManager?.getSystem('appManager') || window.appManager,
fileSystem: window.systemManager?.getSystem('fileSystem') || window.unkayFileSystem?.fileSystem,
fs: window.systemManager?.getSystem('fs') || window.unkayFileSystem?.fs
```

## Compatibilidade

Para garantir compatibilidade com código existente, o `main.js` ainda expõe os sistemas no `window`:

```javascript
// Compatibilidade temporária
window.appManager = systemManager.getSystem('appManager');
window.authSystem = systemManager.getSystem('authSystem');
window.keyboardManager = systemManager.getSystem('keyboardManager');
// ... etc
```

**Recomendação**: Migre gradualmente para usar `systemManager.getSystem()` diretamente.

## Eventos do Sistema

O SystemManager emite eventos importantes:

```javascript
// Sistema totalmente inicializado
eventBus.on('system:ready', () => {
    console.log('unkayOS pronto para uso');
});

// Sistema sendo desligado
eventBus.on('system:shutdown', () => {
    console.log('Fazendo cleanup...');
});
```

## Monitoramento e Debug

### Estatísticas do Sistema

```javascript
const stats = systemManager.getSystemStats();
console.log(stats);
// Output:
// {
//   totalSystems: 8,
//   initializedSystems: 8,
//   failedSystems: 0,
//   initializationTime: 1250, // ms
//   isHealthy: true
// }
```

### Logs Estruturados

O SystemManager produz logs detalhados:

```
[SystemManager] === FASE 1: Inicializando sistemas base ===
[SystemManager] ✓ LoadingManager inicializado
[SystemManager] ✓ LoadingUI inicializado
[SystemManager] === FASE 2: Inicializando dependências leves ===
[SystemManager] ✓ FileSystem inicializado
[SystemManager] ✓ KeyboardManager inicializado
```

## Migração Gradual

### Etapa 1: Manter Compatibilidade ✅
- SystemManager implementado
- APIs antigas mantidas funcionais
- Zero breaking changes

### Etapa 2: Migrar Apps (Recomendado)
```javascript
// Em vez de:
const appManager = window.appManager;

// Use:
const appManager = window.systemManager.getSystem('appManager');
```

### Etapa 3: Remover Globals (Futuro)
- Gradualmente remover referências `window.*`
- Usar apenas `systemManager.getSystem()`

## Troubleshooting

### Sistema não inicializando
```javascript
if (!systemManager.isInitialized) {
    console.error('SystemManager não inicializado');
    // Verificar logs para erros específicos
}
```

### Sistema específico não disponível
```javascript
const auth = systemManager.getSystem('authSystem');
if (!auth) {
    console.error('AuthSystem não disponível');
    // Verificar se inicialização completou
}
```

### Performance
O SystemManager adiciona overhead mínimo (~5-10ms) mas oferece benefícios significativos de organização e debugging.

## Próximos Passos

1. **Testar integração** com todos os apps existentes
2. **Migrar apps** para usar SystemManager diretamente
3. **Implementar health checks** avançados
4. **Adicionar hot-reload** para desenvolvimento
5. **Documentar padrões** de extensão para novos sistemas

---

**Versão**: 1.0.0  
**Data**: Implementação inicial do SystemManager  
**Autor**: Refatoração arquitetural unkayOS
