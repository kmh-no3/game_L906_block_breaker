// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 400;

// 物理設定
const GRAVITY = 0.2;
const RESTITUTION = 0.8; // 反発係数
const FRICTION = 0.95; // 摩擦係数

// ゲーム状態
let gameState = 'waiting';
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
    vx: 3,
    vy: -3,
    mass: 1
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

// 物理オブジェクト（ブロックが動く）
class PhysicsBlock {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.mass = 1;
        this.visible = true;
        this.fixed = false; // 固定ブロック（最初は固定）
    }
    
    update() {
        if (this.fixed || !this.visible) return;
        
        // 重力の適用
        this.vy += GRAVITY;
        
        // 位置の更新
        this.x += this.vx;
        this.y += this.vy;
        
        // 摩擦の適用
        this.vx *= FRICTION;
        
        // 画面外に出たら削除
        if (this.y > canvas.height + 100) {
            this.visible = false;
        }
    }
    
    draw() {
        if (!this.visible) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ブロックの初期化
function initBlocks() {
    blocks = [];
    for (let r = 0; r < blockRows; r++) {
        blocks[r] = [];
        for (let c = 0; c < blockCols; c++) {
            const x = c * (blockWidth + blockPadding) + blockOffsetLeft;
            const y = r * (blockHeight + blockPadding) + blockOffsetTop;
            const color = `hsl(${r * 30}, 70%, 50%)`;
            blocks[r][c] = new PhysicsBlock(x, y, blockWidth, blockHeight, color);
        }
    }
}

// 衝突判定（AABB: Axis-Aligned Bounding Box）
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 円と矩形の衝突判定
function checkCircleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

// 衝突応答（円と矩形）
function resolveCircleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance < circle.radius) {
        // 衝突の法線ベクトル
        const nx = distanceX / distance;
        const ny = distanceY / distance;
        
        // 相対速度
        const relativeVx = circle.vx - (rect.vx || 0);
        const relativeVy = circle.vy - (rect.vy || 0);
        
        // 法線方向の相対速度
        const relativeSpeed = relativeVx * nx + relativeVy * ny;
        
        if (relativeSpeed < 0) {
            // 反発
            const impulse = 2 * relativeSpeed / (circle.mass + (rect.mass || 1));
            circle.vx -= impulse * rect.mass * nx * RESTITUTION;
            circle.vy -= impulse * rect.mass * ny * RESTITUTION;
            
            if (!rect.fixed) {
                rect.vx += impulse * circle.mass * nx * RESTITUTION;
                rect.vy += impulse * circle.mass * ny * RESTITUTION;
            }
            
            // 位置の補正（めり込み防止）
            const overlap = circle.radius - distance;
            circle.x += nx * overlap;
            circle.y += ny * overlap;
        }
    }
}

// 描画関数
function drawPaddle() {
    ctx.fillStyle = '#4facfe';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#3d8fe0';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
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

function moveBall() {
    // 重力の適用（軽く）
    ball.vy += GRAVITY * 0.1;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // 左右の壁との衝突
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.vx = -ball.vx * RESTITUTION;
        ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
    }
    
    // 上の壁との衝突
    if (ball.y - ball.radius < 0) {
        ball.vy = -ball.vy * RESTITUTION;
        ball.y = ball.radius;
    }
    
    // パドルとの衝突
    const paddleRect = {
        x: paddle.x,
        y: paddle.y,
        width: paddle.width,
        height: paddle.height,
        vx: 0,
        vy: 0,
        mass: 10,
        fixed: true
    };
    
    if (checkCircleRectCollision(ball, paddleRect)) {
        resolveCircleRectCollision(ball, paddleRect);
        
        // パドルの位置による角度調整
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.vx += (hitPos - 0.5) * 2;
    }
    
    // ブロックとの衝突
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            const block = blocks[r][c];
            if (block.visible && checkCircleRectCollision(ball, block)) {
                // ブロックを固定解除して物理オブジェクトにする
                if (block.fixed) {
                    block.fixed = false;
                    score += 10;
                    updateScore();
                }
                
                resolveCircleRectCollision(ball, block);
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

// ブロック同士の衝突判定
function updateBlocks() {
    blocks.forEach(row => {
        row.forEach(block => {
            if (block.visible && !block.fixed) {
                block.update();
                
                // 他のブロックとの衝突
                blocks.forEach(otherRow => {
                    otherRow.forEach(otherBlock => {
                        if (otherBlock !== block && otherBlock.visible && !otherBlock.fixed) {
                            if (checkCollision(block, otherBlock)) {
                                // 簡単な衝突応答
                                const dx = (block.x + block.width / 2) - (otherBlock.x + otherBlock.width / 2);
                                const dy = (block.y + block.height / 2) - (otherBlock.y + otherBlock.height / 2);
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (distance > 0) {
                                    const nx = dx / distance;
                                    const ny = dy / distance;
                                    
                                    const relativeVx = block.vx - otherBlock.vx;
                                    const relativeVy = block.vy - otherBlock.vy;
                                    const relativeSpeed = relativeVx * nx + relativeVy * ny;
                                    
                                    if (relativeSpeed < 0) {
                                        const impulse = 2 * relativeSpeed / (block.mass + otherBlock.mass);
                                        block.vx -= impulse * otherBlock.mass * nx * RESTITUTION;
                                        block.vy -= impulse * otherBlock.mass * ny * RESTITUTION;
                                        otherBlock.vx += impulse * block.mass * nx * RESTITUTION;
                                        otherBlock.vy += impulse * block.mass * ny * RESTITUTION;
                                    }
                                }
                            }
                        }
                    });
                });
            }
        });
    });
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -3;
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
    ball.vx *= 1.1;
    ball.vy *= 1.1;
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
    updateScore();
    updateLives();
    updateLevel();
    initBlocks();
    resetBall();
    paddle.x = canvas.width / 2 - 50;
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
        moveBall();
        updateBlocks();
        
        if (checkLevelComplete()) {
            nextLevel();
        }
    }
    
    // 描画
    blocks.forEach(row => {
        row.forEach(block => block.draw());
    });
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
updateScore();
updateLives();
updateLevel();
gameLoop();

