// test-keyboard.js - Teste simples para verificar se o KeyboardManager funciona

console.log('=== TESTE DO KEYBOARD MANAGER ===');

// Aguarda o carregamento completo
window.addEventListener('load', async () => {
    console.log('Página carregada, testando KeyboardManager...');
    
    try {
        // Testa se o keyboardManager está disponível globalmente
        if (window.keyboardManager) {
            console.log('✓ KeyboardManager encontrado na window');
            console.log('✓ Instância ativa:', window.keyboardManager.getActiveInstance());
        } else {
            console.log('✗ KeyboardManager não encontrado na window');
        }
        
        // Testa importação dinâmica
        const { keyboardManager } = await import('./core/KeyboardManager.js');
        console.log('✓ KeyboardManager importado dinamicamente');
        console.log('✓ Instância ativa via import:', keyboardManager.getActiveInstance());
        
        // Testa registro de atalho simples
        keyboardManager.registerShortcut('test-instance', 'ctrl+k', (e) => {
            console.log('🎹 Atalho Ctrl+K funcionando!', e);
        });
        
        console.log('✓ Atalho de teste registrado (Ctrl+K)');
        console.log('=== TESTE CONCLUÍDO ===');
        
    } catch (error) {
        console.error('✗ Erro no teste:', error);
    }
});
