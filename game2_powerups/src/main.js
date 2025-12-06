// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 400;

// ゲーム状態
let gameState = 'waiting';
let score = 0;
let lives = 3;
let level = 1;
let scoreMultiplier = 1;

// パワーアップの種類
const PowerUpType = {
    BIG_PADDLE: 'big_paddle',
    MULTI_BALL: 'multi_ball',
    FAST_BALL: 'fast_ball',
    SCORE_BOOST: 'score_boost',
    EXTRA_LIFE: 'extra_life'
};

// アクティブなパワーアップ
let activePowerUps = {
    bigPaddle: false,
    bigPaddleTimer: 0,
    scoreBoost: false,
    scoreBoostTimer: 0
};

// パドル
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    baseWidth: 100,
    height: 10,
    speed: 5,
    dx: 0
};

// ボール配列（マルチボール対応）
let balls = [];

// アイテム配列
let powerUps = [];

// ブロックの設定
const blockRows = 5;
const blockCols = 8;
const blockWidth = 70;
const blockHeight = 20;
const blockPadding = 5;
const blockOffsetTop = 50;
const blockOffsetLeft = 35;

let blocks = [];

// ブロックの初期化
function initBlocks() {
    blocks = [];
    for (let r = 0; r < blockRows; r++) {
        blocks[r] = [];
        for (let c = 0; c < blockCols; c++) {
            blocks[r][c] = {
                x: c * (blockWidth + blockPadding) + blockOffsetLeft,
                y: r * (blockHeight + blockPadding) + blockOffsetTop,
                width: blockWidth,
                height: blockHeight,
                visible: true,
                color: `hsl(${r * 30}, 70%, 50%)`,
                hasPowerUp: Math.random() < 0.3 // 30%の確率でアイテムを落とす
            };
        }
    }
}

// ボールの初期化
function initBall() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        dx: 3,
        dy: -3,
        speed: 3
    }];
}

// パワーアップアイテムの生成
function createPowerUp(x, y) {
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        type: type,
        speed: 2,
        color: getPowerUpColor(type)
    });
}

// パワーアップの色を取得
function getPowerUpColor(type) {
    const colors = {
        [PowerUpType.BIG_PADDLE]: '#ff0000',
        [PowerUpType.MULTI_BALL]: '#0066ff',
        [PowerUpType.FAST_BALL]: '#00ff00',
        [PowerUpType.SCORE_BOOST]: '#ffff00',
        [PowerUpType.EXTRA_LIFE]: '#ffffff'
    };
    return colors[type] || '#ffffff';
}

// パワーアップの適用
function applyPowerUp(type) {
    switch (type) {
        case PowerUpType.BIG_PADDLE:
            activePowerUps.bigPaddle = true;
            activePowerUps.bigPaddleTimer = 600; // 10秒（60fps）
            paddle.width = paddle.baseWidth * 1.5;
            break;
        case PowerUpType.MULTI_BALL:
            // 現在のボールを複製
            const currentBalls = [...balls];
            currentBalls.forEach(ball => {
                balls.push({
                    x: ball.x,
                    y: ball.y,
                    radius: ball.radius,
                    dx: -ball.dx,
                    dy: ball.dy,
                    speed: ball.speed
                });
            });
            break;
        case PowerUpType.FAST_BALL:
            balls.forEach(ball => {
                ball.dx *= 1.5;
                ball.dy *= 1.5;
            });
            break;
        case PowerUpType.SCORE_BOOST:
            activePowerUps.scoreBoost = true;
            activePowerUps.scoreBoostTimer = 600;
            scoreMultiplier = 2;
            break;
        case PowerUpType.EXTRA_LIFE:
            lives++;
            updateLives();
            break;
    }
    updatePowerUpDisplay();
}

// パワーアップタイマーの更新
function updatePowerUps() {
    if (activePowerUps.bigPaddle) {
        activePowerUps.bigPaddleTimer--;
        if (activePowerUps.bigPaddleTimer <= 0) {
            activePowerUps.bigPaddle = false;
            paddle.width = paddle.baseWidth;
        }
    }
    
    if (activePowerUps.scoreBoost) {
        activePowerUps.scoreBoostTimer--;
        if (activePowerUps.scoreBoostTimer <= 0) {
            activePowerUps.scoreBoost = false;
            scoreMultiplier = 1;
        }
    }
    updatePowerUpDisplay();
}

// パワーアップ表示の更新
function updatePowerUpDisplay() {
    const list = document.getElementById('powerup-list');
    list.innerHTML = '';
    
    if (activePowerUps.bigPaddle) {
        const badge = document.createElement('div');
        badge.className = 'powerup-badge';
        badge.textContent = `🔴 大きいパドル (${Math.ceil(activePowerUps.bigPaddleTimer / 60)}s)`;
        list.appendChild(badge);
    }
    
    if (activePowerUps.scoreBoost) {
        const badge = document.createElement('div');
        badge.className = 'powerup-badge';
        badge.textContent = `🟡 スコア2倍 (${Math.ceil(activePowerUps.scoreBoostTimer / 60)}s)`;
        list.appendChild(badge);
    }
    
    if (balls.length > 1) {
        const badge = document.createElement('div');
        badge.className = 'powerup-badge';
        badge.textContent = `🔵 マルチボール (${balls.length}個)`;
        list.appendChild(badge);
    }
}

// 描画関数
function drawPaddle() {
    ctx.fillStyle = '#f5576c';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#e0455a';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#f5576c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    });
}

function drawBlocks() {
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            if (blocks[r][c].visible) {
                const block = blocks[r][c];
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(block.x, block.y, block.width, block.height);
            }
        }
    }
}

function drawPowerUps() {
    powerUps.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
    });
}

// 移動関数
function movePaddle() {
    paddle.x += paddle.dx;
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

function moveBalls() {
    balls.forEach((ball, index) => {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // 壁との衝突
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
        }
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
        }
        
        // パドルとの衝突
        if (ball.y + ball.radius > paddle.y &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width &&
            ball.dy > 0) {
            const hitPos = (ball.x - paddle.x) / paddle.width;
            ball.dx = (hitPos - 0.5) * 6;
            ball.dy = -Math.abs(ball.dy);
        }
        
        // ブロックとの衝突
        for (let r = 0; r < blockRows; r++) {
            for (let c = 0; c < blockCols; c++) {
                const block = blocks[r][c];
                if (block.visible) {
                    if (ball.x > block.x &&
                        ball.x < block.x + block.width &&
                        ball.y > block.y &&
                        ball.y < block.y + block.height) {
                        block.visible = false;
                        ball.dy = -ball.dy;
                        score += 10 * scoreMultiplier;
                        updateScore();
                        
                        // アイテムを落とす
                        if (block.hasPowerUp) {
                            createPowerUp(block.x + block.width / 2, block.y + block.height / 2);
                        }
                    }
                }
            }
        }
        
        // ボールが下に落ちた場合
        if (ball.y + ball.radius > canvas.height) {
            balls.splice(index, 1);
        }
    });
    
    // すべてのボールが落ちた場合
    if (balls.length === 0) {
        lives--;
        updateLives();
        if (lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

function movePowerUps() {
    powerUps.forEach((item, index) => {
        item.y += item.speed;
        
        // パドルとの衝突
        if (item.y + item.height > paddle.y &&
            item.x > paddle.x &&
            item.x < paddle.x + paddle.width) {
            applyPowerUp(item.type);
            powerUps.splice(index, 1);
        }
        
        // 画面外に出た場合
        if (item.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

function resetBall() {
    initBall();
    gameState = 'waiting';
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

function checkLevelComplete() {
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            if (blocks[r][c].visible) {
                return false;
            }
        }
    }
    return true;
}

function nextLevel() {
    level++;
    updateLevel();
    initBlocks();
    resetBall();
    balls.forEach(ball => {
        ball.dx *= 1.1;
        ball.dy *= 1.1;
    });
}

function gameOver() {
    gameState = 'gameover';
    alert(`ゲームオーバー！\n最終スコア: ${score}`);
    resetGame();
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    scoreMultiplier = 1;
    activePowerUps = {
        bigPaddle: false,
        bigPaddleTimer: 0,
        scoreBoost: false,
        scoreBoostTimer: 0
    };
    powerUps = [];
    updateScore();
    updateLives();
    updateLevel();
    initBlocks();
    initBall();
    resetBall();
    paddle.x = canvas.width / 2 - 50;
    paddle.width = paddle.baseWidth;
    updatePowerUpDisplay();
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

// ゲームループ
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        movePaddle();
        moveBalls();
        movePowerUps();
        updatePowerUps();
        
        if (checkLevelComplete()) {
            nextLevel();
        }
    }
    
    drawBlocks();
    drawPowerUps();
    drawPaddle();
    drawBall();
    
    requestAnimationFrame(gameLoop);
}

// イベントリスナー
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddle.dx = -paddle.speed;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddle.dx = paddle.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddle.dx = 0;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = mouseX - paddle.width / 2;
    
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (gameState === 'waiting' || gameState === 'gameover') {
        gameState = 'playing';
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
    }
});

document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').textContent = '再開';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('start-btn').disabled = true;
        document.getElementById('start-btn').textContent = 'スタート';
    }
});

document.getElementById('show-help').addEventListener('click', () => {
    document.getElementById('help-dialog').showModal();
});

document.getElementById('close-help').addEventListener('click', () => {
    document.getElementById('help-dialog').close();
});

// 初期化
initBlocks();
initBall();
updateScore();
updateLives();
updateLevel();
updatePowerUpDisplay();
gameLoop();

