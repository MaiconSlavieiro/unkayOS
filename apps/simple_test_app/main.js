// apps/simple_test_app/main.js - v1.0.0

import { BaseApp } from '../../core/BaseApp.js'; // Ajuste o caminho conforme a sua estrutura de pastas

/**
 * Aplicativo de teste simples para verificar o comportamento de arrastar/redimensionar.
 */
export default class SimpleTestApp extends BaseApp {
    constructor(appCoreInstance, standardAPIs) {
        super(appCoreInstance, standardAPIs);
        console.log(`[${this.appName} - ${this.instanceId}] Construtor do SimpleTestApp executado.`);
    }

    onRun() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onRun() do SimpleTestApp iniciado!`);
    }

    onCleanup() {
        console.log(`[${this.appName} - ${this.instanceId}] Método onCleanup() do SimpleTestApp executado.`);
    }
}
