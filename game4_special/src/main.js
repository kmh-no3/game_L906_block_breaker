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

// ブロックの種類
const BlockType = {
    NORMAL: 'normal',
    BOMB: 'bomb',
    STAR: 'star',
    SPIN: 'spin',
    SPEED: 'speed',
    HARD: 'hard'
};

// パドル
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 10,
    speed: 5,
    dx: 0
};

// ボール配列
let balls = [];

// パーティクル効果
let particles = [];

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
            let type = BlockType.NORMAL;
            const rand = Math.random();

            if (rand < 0.05) type = BlockType.BOMB; // 5%
            else if (rand < 0.10) type = BlockType.STAR; // 5%
            else if (rand < 0.15) type = BlockType.SPIN; // 5%
            else if (rand < 0.20) type = BlockType.SPEED; // 5%
            else if (rand < 0.25) type = BlockType.HARD; // 5%

            blocks[r][c] = {
                x: c * (blockWidth + blockPadding) + blockOffsetLeft,
                y: r * (blockHeight + blockPadding) + blockOffsetTop,
                width: blockWidth,
                height: blockHeight,
                visible: true,
                type: type,
                hits: type === BlockType.HARD ? 2 : 1,
                rotation: 0,
                color: getBlockColor(type)
            };
        }
    }
}

// ブロックの色を取得
function getBlockColor(type) {
    const colors = {
        [BlockType.NORMAL]: `hsl(${Math.random() * 60}, 70%, 50%)`,
        [BlockType.BOMB]: '#000',
        [BlockType.STAR]: '#ffd700',
        [BlockType.SPIN]: '#9b59b6',
        [BlockType.SPEED]: '#f1c40f',
        [BlockType.HARD]: '#7f8c8d'
    };
    return colors[type] || '#fff';
}

// ボールの初期化
function initBall() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        dx: 3,
        dy: -3,
        speed: 3,
        trail: []
    }];
}

// 色をrgba形式に変換する関数
function colorToRgba(color, alpha) {
    // 既にrgba形式の場合
    if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/, `${alpha})`);
    }
    // rgb形式の場合
    if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    // hex形式の場合（#rgb, #rrggbb）
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = hex.length === 3 ? parseInt(hex[0] + hex[0], 16) : parseInt(hex.substring(0, 2), 16);
        const g = hex.length === 3 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.substring(2, 4), 16);
        const b = hex.length === 3 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // hsl形式の場合
    if (color.startsWith('hsl')) {
        return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
    }
    // その他の場合はデフォルトの白
    return `rgba(255, 255, 255, ${alpha})`;
}

// パーティクルの生成
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

// 爆発効果
function explodeBlock(x, y) {
    createParticles(x, y, '#ff0000', 20);

    // 周囲のブロックを破壊
    const explosionRadius = 80;
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            const block = blocks[r][c];
            if (block.visible) {
                const blockCenterX = block.x + block.width / 2;
                const blockCenterY = block.y + block.height / 2;
                const distance = Math.sqrt(
                    Math.pow(blockCenterX - x, 2) + Math.pow(blockCenterY - y, 2)
                );

                if (distance < explosionRadius) {
                    block.visible = false;
                    score += 10;
                    createParticles(blockCenterX, blockCenterY, block.color, 5);
                }
            }
        }
    }
    updateScore();
}

// ボールの分裂
function splitBall(ball) {
    if (balls.length >= 10) return; // 最大10個まで

    const newBalls = [];
    for (let i = 0; i < 2; i++) {
        const angle = Math.PI * 2 * (i / 2) + Math.random() * 0.5;
        newBalls.push({
            x: ball.x,
            y: ball.y,
            radius: ball.radius * 0.8,
            dx: Math.cos(angle) * ball.speed,
            dy: Math.sin(angle) * ball.speed,
            speed: ball.speed,
            trail: []
        });
    }
    balls.push(...newBalls);
    updateBallCount();
}

// 描画関数
function drawPaddle() {
    ctx.fillStyle = '#fa709a';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#e85a8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    balls.forEach(ball => {
        // トレイル効果
        if (ball.trail.length > 0) {
            ball.trail.forEach((point, index) => {
                const alpha = index / ball.trail.length * 0.5;
                ctx.beginPath();
                ctx.arc(point.x, point.y, ball.radius * (index / ball.trail.length), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
                ctx.closePath();
            });
        }

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#fa709a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // トレイルの更新
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 5) {
            ball.trail.shift();
        }
    });
}

function drawBlocks() {
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            const block = blocks[r][c];
            if (block.visible) {
                ctx.save();

                // 回転ブロックの回転
                if (block.type === BlockType.SPIN) {
                    block.rotation += 0.1;
                    const centerX = block.x + block.width / 2;
                    const centerY = block.y + block.height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(block.rotation);
                    ctx.translate(-centerX, -centerY);
                }

                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(block.x, block.y, block.width, block.height);

                // 特殊ブロックのアイコン
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const icon = {
                    [BlockType.BOMB]: '💣',
                    [BlockType.STAR]: '⭐',
                    [BlockType.SPIN]: '🌀',
                    [BlockType.SPEED]: '⚡',
                    [BlockType.HARD]: '🛡️'
                }[block.type];

                if (icon) {
                    ctx.fillText(icon, block.x + block.width / 2, block.y + block.height / 2);
                }

                // 硬いブロックのヒット数表示
                if (block.type === BlockType.HARD && block.hits > 1) {
                    ctx.fillText(block.hits, block.x + block.width / 2, block.y + block.height / 2 + 15);
                }

                ctx.restore();
            }
        }
    }
}

function drawParticles() {
    particles.forEach((particle, index) => {
        particle.life--;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // 重力

        const alpha = particle.life / particle.maxLife;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = colorToRgba(particle.color, alpha);
        ctx.fill();
        ctx.closePath();

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
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
    balls.forEach((ball, ballIndex) => {
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

                        // 硬いブロックの処理
                        if (block.type === BlockType.HARD) {
                            block.hits--;
                            if (block.hits > 0) {
                                ball.dy = -ball.dy;
                                createParticles(block.x + block.width / 2, block.y + block.height / 2, '#fff', 3);
                                continue;
                            }
                        }

                        // ブロックの破壊
                        const blockCenterX = block.x + block.width / 2;
                        const blockCenterY = block.y + block.height / 2;

                        // 特殊効果の処理
                        switch (block.type) {
                            case BlockType.BOMB:
                                explodeBlock(blockCenterX, blockCenterY);
                                break;
                            case BlockType.STAR:
                                splitBall(ball);
                                score += 20;
                                break;
                            case BlockType.SPEED:
                                balls.forEach(b => {
                                    b.dx *= 1.2;
                                    b.dy *= 1.2;
                                });
                                score += 15;
                                break;
                            default:
                                score += 10;
                                // 通常ブロックでもランダムにボールが増える
                                if (Math.random() < 0.1 && balls.length < 5) {
                                    splitBall(ball);
                                }
                        }

                        block.visible = false;
                        ball.dy = -ball.dy;
                        createParticles(blockCenterX, blockCenterY, block.color, 8);
                        updateScore();
                    }
                }
            }
        }

        // ボールが下に落ちた場合
        if (ball.y + ball.radius > canvas.height) {
            balls.splice(ballIndex, 1);
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
    particles = [];
    updateScore();
    updateLives();
    updateLevel();
    initBlocks();
    initBall();
    resetBall();
    paddle.x = canvas.width / 2 - 50;
    updateBallCount();
    updateEffects();
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

function updateBallCount() {
    document.getElementById('ball-count').textContent = balls.length;
}

function updateEffects() {
    const list = document.getElementById('effects-list');
    list.innerHTML = '';

    if (balls.length > 1) {
        const badge = document.createElement('div');
        badge.className = 'effect-badge';
        badge.textContent = `マルチボール (${balls.length}個)`;
        list.appendChild(badge);
    }
}

// ゲームループ
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        movePaddle();
        moveBalls();
        updateEffects();

        if (checkLevelComplete()) {
            nextLevel();
        }
    }

    drawBlocks();
    drawParticles();
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
updateBallCount();
updateEffects();
gameLoop();

