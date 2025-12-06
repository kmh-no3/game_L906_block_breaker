// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズの設定
canvas.width = 600;
canvas.height = 400;

// ゲーム状態
let gameState = 'waiting'; // waiting, playing, paused, gameover
let score = 0;
let lives = 3;
let level = 1;

// パドル
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 10,
    speed: 5,
    dx: 0
};

// ボール
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    dx: 3,
    dy: -3,
    speed: 3
};

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
                color: `hsl(${r * 30}, 70%, 50%)`
            };
        }
    }
}

// パドルの描画
function drawPaddle() {
    ctx.fillStyle = '#667eea';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#5568d3';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// ボールの描画
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// ブロックの描画
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

// パドルの移動
function movePaddle() {
    paddle.x += paddle.dx;
    
    // 壁との衝突判定
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// ボールの移動
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 左右の壁との衝突
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    
    // 上の壁との衝突
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // パドルとの衝突
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.dy > 0) {
        // パドルのどの位置に当たったかで角度を変える
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
                    score += 10;
                    updateScore();
                }
            }
        }
    }
    
    // ボールが下に落ちた場合
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLives();
        if (lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

// ボールのリセット
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -3;
    gameState = 'waiting';
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

// すべてのブロックが破壊されたかチェック
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

// 次のレベルへ
function nextLevel() {
    level++;
    updateLevel();
    initBlocks();
    resetBall();
    ball.dx *= 1.2;
    ball.dy *= 1.2;
}

// ゲームオーバー
function gameOver() {
    gameState = 'gameover';
    alert(`ゲームオーバー！\n最終スコア: ${score}`);
    resetGame();
}

// ゲームのリセット
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    updateScore();
    updateLives();
    updateLevel();
    initBlocks();
    resetBall();
    paddle.x = canvas.width / 2 - 50;
}

// UI更新
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
    // 画面をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        movePaddle();
        moveBall();
        
        if (checkLevelComplete()) {
            nextLevel();
        }
    }
    
    // 描画
    drawBlocks();
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

// ヘルプダイアログ
document.getElementById('show-help').addEventListener('click', () => {
    document.getElementById('help-dialog').showModal();
});

document.getElementById('close-help').addEventListener('click', () => {
    document.getElementById('help-dialog').close();
});

// ゲームの初期化
initBlocks();
updateScore();
updateLives();
updateLevel();
gameLoop();

