/**
 * Type definitions for core/eventBus.js
 * EventBus — sistema global de pub/sub para comunicação desacoplada entre módulos.
 */

export interface EventBus {
  /**
   * Registra um listener para um evento.
   * @param event - Nome do evento.
   * @param cb - Callback invocado quando o evento é emitido.
   */
  on(event: string, cb: (data?: any) => void): void;

  /**
   * Remove um listener de um evento.
   * @param event - Nome do evento.
   * @param cb - Referência ao callback registrado anteriormente.
   */
  off(event: string, cb: (data?: any) => void): void;

  /**
   * Emite um evento, invocando todos os listeners registrados.
   * @param event - Nome do evento.
   * @param data - Dados passados aos listeners.
   */
  emit(event: string, data?: any): void;
}

export declare function on(event: string, cb: (data?: any) => void): void;
export declare function off(event: string, cb: (data?: any) => void): void;
export declare function emit(event: string, data?: any): void;

declare const eventBus: EventBus;
export default eventBus;
