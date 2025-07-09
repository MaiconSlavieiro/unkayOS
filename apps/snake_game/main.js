// jogodacobrinha.js (ou main.js, se você o renomeou)
// Este arquivo exporta uma função 'init' que será chamada pelo seu framework 'app'.
// Ele é TOTALMENTE INDEPENDENTE do terminal.

export function init(app) {
    try {
        console.log("Snake Game: Função init(app) chamada para inicializar o jogo.");

        // Obtém o elemento raiz do aplicativo do jogo a partir do app.appInstance
        // app.appInstance deve ser a DIV que contém todo o HTML do jogo (a #snake-game-app)
        const snakeGameAppElement = app.appInstance.querySelector("#snake-game-app");

        // --- Verificações de Existência dos Elementos DOM ---
        if (!snakeGameAppElement) {
            console.error("Snake Game: Elemento '#snake-game-app' não encontrado dentro do app.appInstance. Verifique a injeção do HTML.");
            return; // Sai se o elemento principal não for encontrado
        }
        console.log("Snake Game: Elemento '#snake-game-app' encontrado.", snakeGameAppElement);

        const gameCanvas = snakeGameAppElement.querySelector("#gameCanvas");
        if (!gameCanvas) { console.error("Snake Game: Elemento '#gameCanvas' não encontrado."); return; }
        const ctx = gameCanvas.getContext("2d");
        if (!ctx) { console.error("Snake Game: Não foi possível obter o contexto 2D do canvas. Seu navegador suporta canvas?"); return; }

        const scoreDisplay = snakeGameAppElement.querySelector("#score");
        if (!scoreDisplay) { console.error("Snake Game: Elemento '#score' não encontrado."); return; }
        
        const startButton = snakeGameAppElement.querySelector("#startButton");
        if (!startButton) { console.error("Snake Game: Elemento '#startButton' não encontrado."); return; }
        
        const resetButton = snakeGameAppElement.querySelector("#resetButton");
        if (!resetButton) { console.error("Snake Game: Elemento '#resetButton' não encontrado."); return; }
        
        const messageDisplay = snakeGameAppElement.querySelector("#message");
        if (!messageDisplay) { console.error("Snake Game: Elemento '#message' não encontrado."); return; }

        console.log("Snake Game: Todos os elementos DOM essenciais foram encontrados com sucesso.");

        // --- Variáveis do Jogo ---
        const gridSize = 20; // Tamanho de cada "quadrado" no canvas (fixo)
        let canvasPixelSize = 400; // Tamanho inicial do canvas em pixels
        // gameCanvas.width e gameCanvas.height serão definidos dinamicamente

        let snake = [];
        let food = {};
        let direction = { x: 0, y: 0 }; // Direção inicial (parada)
        let score = 0;
        let gameInterval;
        let gameSpeed = 150; // Velocidade inicial em ms (maior = mais lento)
        let isGameOver = false;
        let gameStarted = false; // Flag para controlar se o jogo está em andamento
        let changingDirection = false; // Flag para evitar múltiplas mudanças de direção por tick

        // --- Funções do Jogo ---

        // Função para ajustar o tamanho do canvas com base no contêiner
        function adjustCanvasSize() {
            // Obter o tamanho disponível dentro do snakeGameAppElement, subtraindo paddings e margens de outros elementos
            // Para simplificar, vamos considerar a largura e altura do .snake-game-container
            const container = snakeGameAppElement.querySelector(".snake-game-container");
            if (!container) return;

            // Determinar o tamanho máximo que o canvas pode ter, mantendo a proporção quadrada
            // Considerar o espaço vertical ocupado por título, pontuação, botões e mensagem.
            // Estes são valores aproximados e podem precisar de ajuste fino baseado no seu CSS real.
            const verticalSpaceTaken = 
                container.querySelector('h2').offsetHeight +
                scoreDisplay.offsetHeight +
                startButton.offsetHeight + // Ou use snakeGameAppElement.querySelector('.snake-game-controls').offsetHeight
                messageDisplay.offsetHeight +
                (parseInt(getComputedStyle(container).paddingTop) || 0) +
                (parseInt(getComputedStyle(container).paddingBottom) || 0) +
                (parseInt(getComputedStyle(container).marginTop) || 0) +
                (parseInt(getComputedStyle(container).marginBottom) || 0) +
                20; // Um pouco de margem extra

            const availableWidth = container.clientWidth - (parseInt(getComputedStyle(container).paddingLeft) || 0) - (parseInt(getComputedStyle(container).paddingRight) || 0);
            const availableHeight = container.clientHeight - verticalSpaceTaken;

            // O canvas deve ser quadrado e do tamanho máximo possível, múltiplo de gridSize
            // E não deve ser menor que um tamanho mínimo razoável (e.g., 200px)
            let newSize = Math.floor(Math.min(availableWidth, availableHeight) / gridSize) * gridSize;

            // Garante um tamanho mínimo para o jogo não ficar ilegível
            if (newSize < gridSize * 10) { // Ex: mínimo de 10x10 quadrados
                newSize = gridSize * 10;
            }

            // Garante um tamanho máximo para o jogo não ficar gigantesco (opcional)
            if (newSize > 800) {
                 newSize = 800; // Por exemplo, um limite de 800x800 pixels
            }

            if (newSize !== canvasPixelSize) {
                canvasPixelSize = newSize;
                gameCanvas.width = canvasPixelSize;
                gameCanvas.height = canvasPixelSize;
                console.log(`Snake Game: Canvas redimensionado para ${canvasPixelSize}x${canvasPixelSize}`);
                // Re-inicializa a comida e redesenha o jogo após redimensionar
                // É importante gerar a comida novamente para que ela se ajuste ao novo grid
                // E desenhar tudo novamente para evitar artefatos.
                resetGame(false); // Resetar sem alterar o estado de gameStarted
            }
        }

        // Gera comida em uma posição aleatória, garantindo que não esteja dentro da cobra
        function generateFood() {
            const maxGridX = canvasPixelSize / gridSize;
            const maxGridY = canvasPixelSize / gridSize;
            let newFood;
            do {
                newFood = {
                    x: Math.floor(Math.random() * maxGridX),
                    y: Math.floor(Math.random() * maxGridY)
                };
            } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
            food = newFood;
            console.log("Snake Game: Comida gerada em", food);
        }

        // Desenha a cobra e a comida no canvas
        function drawGame() {
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Limpa todo o canvas

            // Desenhar a comida
            ctx.fillStyle = "#ff5555"; // Cor da comida
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

            // Desenhar a cobrinha
            for (let i = 0; i < snake.length; i++) {
                ctx.fillStyle = (i === 0) ? "#50fa7b" : "#8be9fd"; // Cabeça verde, corpo azul
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
                ctx.strokeStyle = "#282a36"; // Borda entre segmentos
                ctx.strokeRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
            }
        }

        // Lógica principal de atualização do jogo (chamada por setInterval)
        function updateGame() {
            if (isGameOver) {
                // console.log("Snake Game: Game Over, updateGame ignorado.");
                return;
            }

            const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

            // Colisões com a parede (agora baseadas no tamanho dinâmico do canvas)
            if (head.x < 0 || head.x >= gameCanvas.width / gridSize ||
                head.y < 0 || head.y >= gameCanvas.height / gridSize) {
                console.log("Snake Game: Colisão com a parede.");
                gameOver("Bateu na parede!");
                return;
            }

            // Colisões com o próprio corpo
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    console.log("Snake Game: Colisão consigo mesma.");
                    gameOver("Colidiu consigo mesma!");
                    return;
                }
            }

            snake.unshift(head); // Adiciona nova cabeça à cobra

            // Verifica se comeu a comida
            if (head.x === food.x && head.y === food.y) {
                score++;
                scoreDisplay.textContent = `Pontuação: ${score}`;
                console.log("Snake Game: Comida comida! Nova pontuação:", score);
                generateFood(); // Gera nova comida
                
                // Aumenta a velocidade do jogo
                if (gameSpeed > 50) { // Velocidade mínima de 50ms
                    gameSpeed -= 5;
                    clearInterval(gameInterval); // Limpa o intervalo antigo
                    gameInterval = setInterval(updateGame, gameSpeed); // Inicia novo intervalo com nova velocidade
                    console.log("Snake Game: Velocidade aumentada para", gameSpeed, "ms.");
                }
            } else {
                snake.pop(); // Remove a cauda se não comeu comida
            }

            drawGame(); // Redesenha o jogo
            changingDirection = false; // Libera para nova mudança de direção
        }

        // Inicia o loop do jogo
        function startGame() {
            console.log("Snake Game: Chamada de startGame(). gameStarted:", gameStarted);
            if (gameStarted) {
                console.log("Snake Game: Jogo já em andamento, ignorando startGame().");
                return;
            }
            
            resetGame(true); // Garante que o estado seja limpo antes de iniciar e define gameStarted como true
            isGameOver = false; // Garante que não esteja em estado de Game Over
            messageDisplay.textContent = ""; // Limpa qualquer mensagem
            direction = { x: 1, y: 0 }; // Começa movendo para a direita
            startButton.disabled = true; // Desabilita o botão Iniciar para evitar cliques repetidos
            gameInterval = setInterval(updateGame, gameSpeed); // Inicia o loop principal do jogo
            console.log("Snake Game: Jogo iniciado. Intervalo configurado para", gameSpeed, "ms.");
        }

        // Função para lidar com o fim do jogo
        function gameOver(message) {
            console.log("Snake Game: Game Over! Mensagem:", message);
            isGameOver = true;
            gameStarted = false; // Marca o jogo como parado
            clearInterval(gameInterval); // Para o loop do jogo
            messageDisplay.textContent = `Game Over! ${message} Pontuação final: ${score}`;
            startButton.disabled = false; // Habilita o botão Iniciar novamente
        }

        // Reseta o jogo para o estado inicial
        // `shouldStartGameFlag` é um parâmetro para controlar se `gameStarted` deve ser definido como `false`
        // ao invés de `true` após um reset, útil para quando o resize é chamado.
        function resetGame(shouldSetGameStartedFalse = true) {
            console.log("Snake Game: Chamada de resetGame().");
            clearInterval(gameInterval); // Limpa qualquer intervalo existente
            snake = [{ x: 10, y: 10 }]; // Posição inicial da cabeça (usando coordenadas de grid)
            direction = { x: 0, y: 0 }; // Cobra parada
            score = 0;
            gameSpeed = 150; // Reseta a velocidade para o valor inicial
            isGameOver = false;
            changingDirection = false;
            
            if (shouldSetGameStartedFalse) {
                gameStarted = false; // Jogo não iniciado até o primeiro movimento ou clique
            }

            scoreDisplay.textContent = "Pontuação: 0";
            messageDisplay.textContent = "Pressione 'Iniciar Jogo' ou as setas para começar!";
            generateFood(); // Gera a primeira comida
            drawGame(); // Desenha o estado inicial
            startButton.disabled = false; // Garante que o botão de iniciar esteja habilitado
            console.log("Snake Game: Jogo resetado para o estado inicial.");
        }

        // --- Event Listeners ---

        // Ouve por teclas pressionadas para mudar a direção da cobra ou iniciar o jogo
        // Este listener está anexado a 'document' para capturar as setas em qualquer lugar da janela.
        document.addEventListener("keydown", e => {
            // Ignora se o jogo acabou ou se uma mudança de direção já está em processamento
            if (isGameOver || changingDirection) {
                return;
            }

            const keyPressed = e.key;
            
            // Inicia o jogo se uma seta for pressionada e o jogo não estiver iniciado
            if (!gameStarted && (keyPressed.startsWith("Arrow"))) {
                e.preventDefault(); // Previne rolagem da página por setas
                startGame();
            }

            // Previne a cobra de virar 180 graus imediatamente
            let newDirection;
            switch (keyPressed) {
                case "ArrowUp":
                    if (direction.y === 1) return; // Não pode ir para cima se estiver indo para baixo
                    newDirection = { x: 0, y: -1 };
                    break;
                case "ArrowDown":
                    if (direction.y === -1) return; // Não pode ir para baixo se estiver indo para cima
                    newDirection = { x: 0, y: 1 };
                    break;
                case "ArrowLeft":
                    if (direction.x === 1) return; // Não pode ir para esquerda se estiver indo para direita
                    newDirection = { x: -1, y: 0 };
                    break;
                case "ArrowRight":
                    if (direction.x === -1) return; // Não pode ir para direita se estiver indo para esquerda
                    newDirection = { x: 1, y: 0 };
                    break;
                default:
                    return; // Ignora outras teclas
            }

            // Se o jogo está rodando e a direção é válida, atualiza
            if (gameStarted) {
                direction = newDirection;
                changingDirection = true; // Marca que a direção mudou neste tick
                console.log("Snake Game: Direção alterada para", direction);
                e.preventDefault(); // Previne rolagem da página por setas
            }
        });

        // Adiciona event listeners aos botões
        startButton.addEventListener("click", () => {
            console.log("Snake Game: Botão 'Iniciar Jogo' clicado.");
            startGame();
        });
        
        resetButton.addEventListener("click", () => {
            console.log("Snake Game: Botão 'Reiniciar Jogo' clicado.");
            resetGame(true); // Garante que o jogo fique parado após o reset
        });

        // --- Responsividade: ResizeObserver ---
        // Observa as mudanças de tamanho do elemento pai (snakeGameAppElement, que é a 'janela')
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === snakeGameAppElement) {
                    // console.log("Snake Game: Elemento pai redimensionado.", entry.contentRect);
                    adjustCanvasSize();
                }
            }
        });

        // Começa a observar o elemento raiz do seu aplicativo
        resizeObserver.observe(snakeGameAppElement);


        // --- Inicialização ---
        // Configura o estado inicial do jogo quando a função init é chamada.
        // O jogo só começa a se mover após um clique no botão "Iniciar Jogo" ou a primeira seta.
        // Chame adjustCanvasSize() uma vez para definir o tamanho inicial
        adjustCanvasSize();
        console.log("Snake Game: Chamando resetGame na finalização de init para configuração inicial.");
        resetGame(true); // Passa true para garantir que gameStarted seja false no início.

    } catch (e) {
        console.error("Snake Game: Erro CRÍTICO na inicialização do jogo:", e);
    }
}