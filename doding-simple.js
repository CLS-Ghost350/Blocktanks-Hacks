const SETTINGS = {
    LOOK_AHEAD: 20,
    RUN_INTERVAL: 50
}

let inputMovement = [0,0];

document.body.onkeydown = e => {
    if(consoleExpanded) return true;
    if(e.repeat && state == "game") return false;
    
    var key = 'which' in e ? e.which : e.keyCode;

    switch(key){
        case 87: // w
            inputMovement[1] = -1;
            break;
        case 38: // w
            inputMovement[1] = -1;
            break;
        case 83: // s
            inputMovement[1] = 1;
            break;
        case 40: // s
            inputMovement[1] = 1;
            break;
        case 65: // a
            inputMovement[0] = -1;
            break;
        case 37: // a
            inputMovement[0] = -1;
            break;
        case 68: // d
            inputMovement[0] = 1;
            break;
        case 39: // d
            inputMovement[0] = 1;
            break;
        default: 
            return keydown(e);
    }
}

document.body.onkeyup = e => {
    if(e.repeat && state == "game") return false;

    var key = 'which' in e ? e.which : e.keyCode;

    switch(key){
        case 87: // w 
            if (inputMovement[1] == -1) inputMovement[1] = 0;
            break;
        case 38: // w
            if (inputMovement[1] == -1) inputMovement[1] = 0;
            break;
        case 83: // s
            if (inputMovement[1] == 1) inputMovement[1] = 0;
            break;
        case 40: // s
            if (inputMovement[1] == 1) inputMovement[1] = 0;
            break;
        case 65: // a
            if (inputMovement[0] == -1) inputMovement[0] = 0;
            break;
        case 37: // a
            if (inputMovement[0] == -1) inputMovement[0] = 0;
            break;
        case 68: // d
            if (inputMovement[0] == 1) inputMovement[0] = 0;
            break;
        case 39: // d
            if (inputMovement[0] == 1) inputMovement[0] = 0;
            break;
        default:
            return keyup(e);
    }
};

let bulletColliders = []
let playerColliders = []

setInterval(() => {
    if (state != "game" || !server_tanks[name] || server_tanks[name].body.alpha == 0) return;
    let lastFoundBulletsSet = bullets;
    bulletColliders = [];

    for (let i = 0; i < SETTINGS.LOOK_AHEAD; i++) {
        lastFoundBulletsSet = lookAhead(SETTINGS.RUN_INTERVAL,lastFoundBulletsSet);
        bulletColliders.push(getBulletColliders(lastFoundBulletsSet,SETTINGS.RUN_INTERVAL));
    }

    playerColliders = []

    const move = calculateMovements(
        getGameWidth() / 2,
        getGameHeight() / 2,
        bulletColliders,
        SETTINGS.RUN_INTERVAL,
        SETTINGS.LOOK_AHEAD
    );

    //console.log("move: " + move)

    controls.w = false;
    controls.s = false;
    controls.a = false;
    controls.d = false;

    if (move == false) {
        flashText("Cannot evade incoming bullets.");
        console.log("Cannot evade incoming bullets.")

        if (inputMovement[1] == -1) controls.w = true;
        else if (inputMovement[1] == 1) controls.s = true;

        if (inputMovement[0] == 1) controls.d = true;
        else if (inputMovement[0] == -1) controls.a = true;
    } else {
        if (move[1] == -1) controls.w = true;
        else if (move[1] == 1) controls.s = true;

        if (move[0] == 1) controls.d = true;
        else if (move[0] == -1) controls.a = true;
    }
},SETTINGS.RUN_INTERVAL)

game.state.render = () => {
    if (state != "game" || !server_tanks[name] || server_tanks[name].body.alpha == 0) return;

    bullets.forEach(bullet => {
        if (bullet.team == server_tanks[name].team) return;

        if (!bullet.dX || !bullet.dY) {
            if (!bullet.oldX) {
                bullet.oldX = bullet.x; 
                bullet.oldY = bullet.y;
            } else {
                const bulletAngle = Math.atan2(bullet.y - bullet.oldY,bullet.x - bullet.oldX);
                bullet.dX = Math.cos(bulletAngle);
                bullet.dY = Math.sin(bulletAngle);
                bullet.oldX = bullet.x; bullet.oldY = bullet.y;
            }
        }

        if (!bullet.bounces) bullet.bounces = 1;

        handleBulletCollision(bullet);
    })
    
    maze_walls.forEach(wall => {
        wall.collider = new Phaser.Rectangle(wall.worldPosition.x,wall.worldPosition.y,100,100);
    });

    bulletColliders?.forEach(timeStep => timeStep.forEach(collider => {
        game.debug.geom(collider);
    }));

    playerColliders.forEach(collider => {
        const playerCollider = new Phaser.Rectangle(0,0,50 + 10,50 + 10)
        playerCollider.centerX = collider[0];
        playerCollider.centerY = collider[1];
        game.debug.geom(playerCollider)
    })

    // flashText(JSON.stringify(inputMovement))
}

function handleBulletCollision(bullet) {
    let bulletData = bullet;
    if (!bullet.isCustom) bulletData = makeBulletData(bullet);

    const bulletCollider = getBulletColliders([bulletData],0)[0]

    maze_walls.forEach(wall => {
        if (!wall.visible || !wall.collider) return;

        let colliding = false;

        if (bulletCollider instanceof Phaser.Circle) {
            colliding = (Phaser.Circle.intersectsRectangle(bulletCollider,wall.collider) != false)
        } else if (bulletCollider instanceof Phaser.Rectangle) {
            colliding = (Phaser.Rectangle.intersects(bulletCollider,wall.collider) != false)
        }

        if (colliding) {
            if (bullet.bounces <= 0) return false;

            const xDifference = Math.abs(bulletCollider.x - wall.collider.centerX); 
            const yDifference = Math.abs(bulletCollider.y - wall.collider.centerY);

            if (xDifference > yDifference) bullet.dX *= -1;
            else bullet.dY *= -1;

            bullet.bounces--;
        }
    })
}

function calculateMovements(playerX,playerY,colliders,interval,lookAhead) {
    if (lookAhead == 0) return true;
    const newLookAhead = lookAhead - 1;

    //console.log("looking ahead: " + newLookAhead)

    const collidersReversed = colliders.reverse()

    const collidersNow = collidersReversed[newLookAhead]
        .concat(collidersReversed[newLookAhead - 1]);

    const distance = 0.24 * interval;

    let possibleMoves = [
        [0,0],
        [0,1],
        [0,-1],
        [-1,0],
        [1,0],
        [1,1],
        [1,-1],
        [-1,-1],
        [-1,1]
    ];

    possibleMoves = possibleMoves.filter(element => element[0] != inputMovement[0] 
        || element[1] != inputMovement[1]);

    possibleMoves.unshift(inputMovement);

    for (const move of possibleMoves) {
        //console.log("Testing Move: " + move)
        const playerCollider = new Phaser.Rectangle(0,0,50 + 10,50 + 10);

        newPlayerX = playerX + distance*move[0];
        newPlayerY = playerY + distance*move[1];
        playerCollider.centerX = newPlayerX;
        playerCollider.centerY = newPlayerY;

        playerColliders.push([newPlayerX,newPlayerY])
    
        const colliding = (() => { 
            for (collider of collidersNow) {
                if (collider instanceof Phaser.Circle) {
                    if (Phaser.Circle.intersectsRectangle(collider,playerCollider) != false) return true;
                } else if (collider instanceof Phaser.Rectangle) {
                    if(Phaser.Rectangle.intersects(collider,playerCollider) != false) return true;
                }
            } 

            return false; 
        })()

        if (colliding) {
            //console.log("current move does not work.")
        } else {
            //console.log("current move works. testing farther")
        }

        if (!colliding && calculateMovements(newPlayerX,newPlayerY,colliders,interval,newLookAhead) != false) {
            return move;
        }
    }

    return false;
}

function getBulletColliders(bulletDataInput,lookAheadTime) {
    const colliders = [];

    bulletDataInput.forEach(bullet => {
        if (!bullet) return;

        colliders.push({
            0: bulletInput => {
                return new Phaser.Circle(
                    bulletInput.x,
                    bulletInput.y,
                    15 + 5 //+ 0.425 * lookAheadTime
                )
            }
        }[bullet.type](bullet))
    })

    return colliders;
}

const makeBulletData = bullet => ({ 
    0: { // regular
        isCustom: true,

        type: 0,
        dX: bullet.dX,
        dY: bullet.dY,
        bounces: bullet.bounces,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 0.425,

        lookAhead: function(time) {
            const copy = { ...this }

            if (handleBulletCollision(copy) == false) return false;

            copy.x += time * copy.speed * copy.dX;
            copy.y += time * copy.speed * copy.dY;

            return copy
        }
    }, 
}[bullet.type])

function lookAhead(time,bulletDataInput) {
    const newBullets = [];

    bulletDataInput.forEach(bullet => {
        if (bullet.type != 0) return;

        if (bullet.team == server_tanks[name].team) return;

        let bulletData = bullet
        if (!bullet.isCustom) bulletData = makeBulletData(bullet);

        const futureBullet = bulletData.lookAhead(time)
        if (futureBullet != false) newBullets.push(futureBullet);
    });

    return newBullets;
}