const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 1366;
canvas.height = 720;

const retroCanvas = document.createElement('canvas');
retroCanvas.width = canvas.width;
retroCanvas.height = canvas.height;
const retroCtx = retroCanvas.getContext('2d');

const gravity = 0.8;
const groundLevel = canvas.height - 100;

const frameWidth = 235.5;
const frameHeight = 340;
const enemyFrameWidth = 235.5;
const enemyFrameHeight = 220;

let startSequenceTimer = 0;
let allowEnemyFire = false;

const readyImage = new Image();
readyImage.src = 'assets/icons/ready.png';

const goImage = new Image();
goImage.src = 'assets/icons/wallop.png';

const goImage2 = new Image();
goImage2.src = 'assets/icons/wallop2.png';

const player = {
    x: 250, y: groundLevel, width: 113, height: 167,
    vx: 0, vy: 0, speed: 5, jumpPower: -15,
    isJumping: false, isAttacking: false, facingLeft: false,
    frameX: 0, frameY: 0, frameTimer: 0, frameInterval: 100, maxFrame: 2,
    image: new Image(), normalImage: new Image(), hitImage: new Image(),
    isHit: false, hitTimer: 0
};
player.normalImage.src = 'assets/characters/phonehead_player5.png';
player.hitImage.src = 'assets/characters/phonehead_player5 hit.png';
player.image = player.normalImage;

const enemy = {
    x: canvas.width - 450, y: groundLevel, width: 480, height: 420,
    vy: 0, isJumping: false, jumpPower: -10,
    jumpCooldown: 0, fireCooldown: 0,
    frameX: 6, frameY: 1, maxFrame: 2, frameTimer: 0, frameInterval: 150,
    image: new Image(), normalImage: new Image(), hitImage: new Image(),
    isHit: false, hitTimer: 0
};
enemy.normalImage.src = 'assets/characters/trashhead_enemy6.png';
enemy.hitImage.src = 'assets/characters/trashhead_enemy6 hit.png';
enemy.image = enemy.normalImage;

const backgroundImage = new Image();
backgroundImage.src = 'assets/map/forest_map3.png';
const upperImage = new Image();
upperImage.src = 'assets/map/forest_map upper4.png';

const fireballImage = new Image();
fireballImage.src = 'assets/attack/fire-ball.png';
const enemyFireballImage = new Image();
enemyFireballImage.src = 'assets/attack/bad_apple2.png';
const fireballs = [];
const enemyFireballs = [];

const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, z: false };
window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'ArrowUp' && !player.isJumping) {
        player.vy = player.jumpPower;
        player.isJumping = true;
    }
    if (e.key === 'z') {
        player.isAttacking = true;
        fireballs.push({
            x: player.facingLeft ? player.x : player.x + player.width,
            y: player.y + player.height / 2,
            width: 40, height: 20, speed: player.facingLeft ? -10 : 10
        });
        setTimeout(() => { player.isAttacking = false; }, 200);
    }
});
window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

function handlePlayerAnimation(deltaTime) {
    if (player.frameTimer > player.frameInterval) {
        player.frameX = (player.frameX + 1) % (player.maxFrame + 1);
        player.frameTimer = 0;
    } else player.frameTimer += deltaTime;
}
function setPlayerAnimation() {
    if (player.isJumping) {
        player.frameX = 4; player.frameY = 0; player.maxFrame = 4;
    } else if (player.isAttacking && (keys.ArrowLeft || keys.ArrowRight)) {
        player.frameY = 2; player.maxFrame = 2;
    } else if (player.isAttacking) {
        player.frameX = 3; player.frameY = 0; player.maxFrame = 3;
    } else if (keys.ArrowLeft || keys.ArrowRight) {
        player.frameY = 1; player.maxFrame = 2;
    } else {
        player.frameY = 0; player.maxFrame = 2;
    }
}

let enemyAnimationDirection = 1;
function handleEnemyAnimation(deltaTime) {
    if (enemy.frameTimer > enemy.frameInterval) {
        enemy.frameX += enemyAnimationDirection;
        if (enemy.frameX >= enemy.maxFrame) {
            enemy.frameX = enemy.maxFrame;
            enemyAnimationDirection = -1;
        } else if (enemy.frameX <= 0) {
            enemy.frameX = 0;
            enemyAnimationDirection = 1;
        }
        enemy.frameTimer = 0;
    } else enemy.frameTimer += deltaTime;
}

function updateEnemy() {
    enemy.y += enemy.vy;
    enemy.vy += gravity;
    if (enemy.y + enemy.height >= groundLevel) {
        enemy.y = groundLevel - enemy.height;
        enemy.vy = 0;
        enemy.isJumping = false;
    }
    if (enemy.jumpCooldown <= 0 && Math.random() < 0.01) {
        enemy.vy = enemy.jumpPower;
        enemy.isJumping = true;
        enemy.jumpCooldown = 100;
    } else enemy.jumpCooldown--;

    if (allowEnemyFire && enemy.fireCooldown <= 0) {
        const fireballHeights = [enemy.y + enemy.height - 40, enemy.y + enemy.height - 70];
        fireballHeights.forEach(height => {
            enemyFireballs.push({ x: enemy.x, y: height, width: 55, height: 35, speed: -6 });
        });
        enemy.fireCooldown = 120;
    } else enemy.fireCooldown--;

    if (enemy.isHit) {
        enemy.hitTimer--;
        if (enemy.hitTimer <= 0) {
            enemy.isHit = false;
            enemy.image = enemy.normalImage;
        }
    }
}

let lastTime = 0;
function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    retroCtx.clearRect(0, 0, canvas.width, canvas.height);
    retroCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (startSequenceTimer < 150) {
        if (startSequenceTimer < 100) {
            const initialScale = 3;
            const finalScale = 1.5;
            const progress = Math.min(startSequenceTimer / 32, 1);
            const scale = initialScale - (initialScale - finalScale) * progress;
            const currentWidth = readyImage.width * scale;
            const currentHeight = readyImage.height * scale;
            retroCtx.drawImage(
                readyImage,
                0, 0, readyImage.width, readyImage.height,
                centerX - currentWidth / 2,
                centerY - currentHeight / 2,
                currentWidth, currentHeight
            );
        } else {
            const imgWidth = 900, imgHeight = 700;
            const goCurrentImage = (Math.floor(startSequenceTimer / 10) % 2 === 0) ? goImage : goImage2;
            retroCtx.drawImage(goCurrentImage, centerX - imgWidth / 2, centerY - imgHeight / 2, imgWidth, imgHeight);
        }
        startSequenceTimer++;
    } else {
        allowEnemyFire = true;
    }

    if (keys.ArrowLeft) { player.vx = -player.speed; player.facingLeft = true; }
    else if (keys.ArrowRight) { player.vx = player.speed; player.facingLeft = false; }
    else { player.vx = 0; }

    player.x += player.vx;
    player.y += player.vy;
    player.vy += gravity;
    if (player.y + player.height >= groundLevel) {
        player.y = groundLevel - player.height;
        player.vy = 0;
        player.isJumping = false;
    }
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

    setPlayerAnimation();
    handlePlayerAnimation(deltaTime);

    if (player.isHit) {
        player.hitTimer--;
        if (player.hitTimer <= 0) {
            player.isHit = false;
            player.image = player.normalImage;
        }
    }

    if (player.facingLeft) {
        retroCtx.save();
        retroCtx.scale(-1, 1);
        retroCtx.drawImage(player.image, player.frameX * frameWidth, player.frameY * frameHeight, frameWidth, frameHeight, -player.x - player.width, player.y, player.width, player.height);
        retroCtx.restore();
    } else {
        retroCtx.drawImage(player.image, player.frameX * frameWidth, player.frameY * frameHeight, frameWidth, frameHeight, player.x, player.y, player.width, player.height);
    }

    for (let i = fireballs.length - 1; i >= 0; i--) {
        const f = fireballs[i];
        f.x += f.speed;
        if (f.x < -f.width || f.x > canvas.width + f.width) {
            fireballs.splice(i, 1);
            continue;
        }
        if (f.x < enemy.x + enemy.width && f.x + f.width > enemy.x && f.y < enemy.y + enemy.height && f.y + f.height > enemy.y) {
            fireballs.splice(i, 1);
            enemy.isHit = true;
            enemy.hitTimer = 10;
            enemy.image = enemy.hitImage;
            continue;
        }
        retroCtx.drawImage(fireballImage, f.x, f.y, f.width, f.height);
    }

    updateEnemy();
    handleEnemyAnimation(deltaTime);
    retroCtx.drawImage(enemy.image, enemy.frameX * enemyFrameWidth, enemy.frameY * enemyFrameHeight, enemyFrameWidth, enemyFrameHeight, enemy.x, enemy.y, enemy.width, enemy.height);

    for (let i = enemyFireballs.length - 1; i >= 0; i--) {
        const f = enemyFireballs[i];
        f.x += f.speed;
        if (f.x < -f.width) {
            enemyFireballs.splice(i, 1);
            continue;
        }
        if (f.x < player.x + player.width && f.x + f.width > player.x && f.y < player.y + player.height && f.y + f.height > player.y) {
            enemyFireballs.splice(i, 1);
            player.isHit = true;
            player.hitTimer = 10;
            player.image = player.hitImage;
            continue;
        }
        retroCtx.drawImage(enemyFireballImage, f.x, f.y, f.width, f.height);
    }

    retroCtx.drawImage(upperImage, 0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 4) {
        retroCtx.fillStyle = 'rgba(0,0,0,0.1)';
        retroCtx.fillRect(0, y, canvas.width, 2);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(retroCanvas, 0, 0);

    requestAnimationFrame(animate);
}

let assetsLoaded = 0;
function checkAllLoaded() {
    assetsLoaded++;
    if (assetsLoaded === 11) animate(0);
}
player.normalImage.onload = checkAllLoaded;
player.hitImage.onload = checkAllLoaded;
enemy.normalImage.onload = checkAllLoaded;
enemy.hitImage.onload = checkAllLoaded;
backgroundImage.onload = checkAllLoaded;
upperImage.onload = checkAllLoaded;
fireballImage.onload = checkAllLoaded;
enemyFireballImage.onload = checkAllLoaded;
readyImage.onload = checkAllLoaded;
goImage.onload = checkAllLoaded;
goImage2.onload = checkAllLoaded;
