// core/PositionManager.js - v1.0.0

/**
 * Gerenciador de posicionamento para aplicativos do unkayOS.
 * Responsável por calcular e aplicar posições para apps system_window e desktop_ui.
 */
export class PositionManager {
    constructor() {
        // Presets de posição para apps desktop_ui
        this.positionPresets = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom-left': { bottom: '100px', left: '20px' },
            'bottom-right': { bottom: '100px', right: '20px' },
            'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        };
    }

    /**
     * Converte valores de vw/vh para pixels.
     * @param {string} value - O valor CSS (ex: "10vw", "200px").
     * @param {string} type - 'width' para vw, 'height' para vh.
     * @returns {number} O valor em pixels.
     */
    convertVwVhToPx(value, type) {
        if (typeof value !== 'string') {
            return parseFloat(value) || 0;
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
     * Calcula a posição baseada na configuração do app.
     * @param {object} appData - Dados do app (config.json)
     * @returns {object} Objeto com posições calculadas
     */
    calculatePosition(appData) {
        const result = {};

        // Se tem position (preset), usa o preset
        if (appData.position && this.positionPresets[appData.position]) {
            Object.assign(result, this.positionPresets[appData.position]);
        } else {
            // Se tem x_position e y_position, converte para px
            if (appData.x_position) {
                const xPx = this.convertVwVhToPx(appData.x_position, 'width');
                result.left = `${xPx}px`;
            }
            if (appData.y_position) {
                const yPx = this.convertVwVhToPx(appData.y_position, 'height');
                result.top = `${yPx}px`;
            }
        }

        // Se não tem nenhuma posição definida, usa padrão
        if (Object.keys(result).length === 0) {
            result.top = '20px';
            result.left = '20px';
        }

        return result;
    }

    /**
     * Calcula as dimensões baseadas na configuração do app.
     * @param {object} appData - Dados do app (config.json)
     * @returns {object} Objeto com largura e altura calculadas
     */
    calculateDimensions(appData) {
        const result = {};

        if (appData.width) {
            if (typeof appData.width === 'string' && (appData.width.endsWith('vw') || appData.width.endsWith('vh'))) {
                const widthPx = this.convertVwVhToPx(appData.width, 'width');
                result.width = `${widthPx}px`;
            } else {
                result.width = appData.width;
            }
        }

        if (appData.height) {
            if (typeof appData.height === 'string' && (appData.height.endsWith('vw') || appData.height.endsWith('vh'))) {
                const heightPx = this.convertVwVhToPx(appData.height, 'height');
                result.height = `${heightPx}px`;
            } else {
                result.height = appData.height;
            }
        }

        return result;
    }

    /**
     * Aplica posição e dimensões a um elemento.
     * @param {HTMLElement} element - Elemento a ser posicionado
     * @param {object} appData - Dados do app (config.json)
     */
    applyPosition(element, appData) {
        const position = this.calculatePosition(appData);
        const dimensions = this.calculateDimensions(appData);

        // Aplica posição
        Object.entries(position).forEach(([property, value]) => {
            element.style[property] = value;
        });

        // Aplica dimensões
        Object.entries(dimensions).forEach(([property, value]) => {
            element.style[property] = value;
        });

        // Garante que o elemento tenha position absolute
        element.style.position = 'absolute';
    }

    /**
     * Obtém posições em pixels para uso no AppWindowSystem.
     * @param {object} appData - Dados do app (config.json)
     * @returns {object} Objeto com posições em pixels
     */
    getPixelPositions(appData) {
        const position = this.calculatePosition(appData);
        const dimensions = this.calculateDimensions(appData);

        return {
            x: this.convertVwVhToPx(position.left || '0px', 'width'),
            y: this.convertVwVhToPx(position.top || '0px', 'height'),
            width: this.convertVwVhToPx(dimensions.width || '200px', 'width'),
            height: this.convertVwVhToPx(dimensions.height || '200px', 'height')
        };
    }
}

// Instância global do PositionManager
export const positionManager = new PositionManager(); 