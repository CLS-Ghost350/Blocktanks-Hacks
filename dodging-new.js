const SETTINGS = {
    LOOK_AHEAD: 10,
    RUN_INTERVAL: 100
}

function toHexColor(rgb) {
    let hex = "#";
    for (const color of rgb) hex += color.toString(16).padStart(2, '0');
    return hex;
}

function valueToColor(value) {
    const moduloValue = value % 255;
    let color;

    if (value < 255) color = [ 255, moduloValue, 0 ];
    else if (value < 510) color = [ 255 - moduloValue, 255, 0 ];
    else if (value < 765) color = [ 0, 255, moduloValue ];
    else if (value < 1020) color = [ 0, 255 - moduloValue, 255 ];
    else if (value < 1275) color = [ moduloValue, 0, 255 ];
    else if (value < 1530) color = [ 255, 0, 255 - moduloValue ];
    else return undefined;

    return color;
}
//for (let i = 0; i < 1530; i += 30) console.log(i + "; " + valueToColor(i));
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

let bulletColliders = [];
let playerColliders = [];
let plannedColliders = [];

let movesTested = 0;

setInterval(() => {
    if (state != "game" || !server_tanks[name] || server_tanks[name].body.alpha == 0) return;
    let lastFoundBulletsSet = bullets;
    bulletColliders = [];
    movesTested = 0;

    for (let i = 0; i < SETTINGS.LOOK_AHEAD; i++) {
        lastFoundBulletsSet = lookAhead(SETTINGS.RUN_INTERVAL,lastFoundBulletsSet);
        bulletColliders.push(getBulletColliders(lastFoundBulletsSet,SETTINGS.RUN_INTERVAL/* + ping */));
    }

    playerColliders = [];
    plannedColliders = [];

    const timeID = Date.now()
    //console.time(timeID)

    const moves = calculateMovements(
        getGameWidth() / 2,
        getGameHeight() / 2,
        bulletColliders,
        SETTINGS.RUN_INTERVAL,
        SETTINGS.LOOK_AHEAD
    );

    //console.log(playerColliders.length)

    //console.timeEnd(timeID)

    //console.log("move: " + move)

    controls.w = false;
    controls.s = false;
    controls.a = false;
    controls.d = false;
    
    if (moves == false) {
        flashText("Cannot evade incoming bullets.");
        console.log("Cannot evade incoming bullets.")
        console.log(movesTested);

        if (inputMovement[1] == -1) controls.w = true;
        else if (inputMovement[1] == 1) controls.s = true;

        if (inputMovement[0] == 1) controls.d = true;
        else if (inputMovement[0] == -1) controls.a = true;
    } else {
        if (moves[2][1] == -1) controls.w = true;
        else if (moves[2][1] == 1) controls.s = true;

        if (moves[2][0] == 1) controls.d = true;
        else if (moves[2][0] == -1) controls.a = true;
    }
},SETTINGS.RUN_INTERVAL)

game.state.render = () => {
    if (state != "game" || !server_tanks[name] || server_tanks[name].body.alpha == 0) return;

    bullets.forEach(bullet => {
        //if (bullet.team == server_tanks[name].team) return;

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

        if (bullet.bounces === undefined) bullet.bounces = 1;

        handleBulletCollision(bullet);
    })
    
    maze_walls.forEach(wall => {
        wall.collider = new Phaser.Rectangle(wall.worldPosition.x,wall.worldPosition.y,100,100);
    });

    playerColliders.forEach(collider => {
        const playerCollider = new Phaser.Rectangle(0,0,50 + 10,50 + 10)
        playerCollider.centerX = collider[0];
        playerCollider.centerY = collider[1];
        //game.debug.geom(playerCollider)
    })

    plannedColliders.slice().reverse().forEach((collider,i) => {
        const plannedCollider = new Phaser.Rectangle(0,0,50 + 10,50 + 10)
        plannedCollider.centerX = collider[0];
        plannedCollider.centerY = collider[1];
        game.debug.geom(plannedCollider,toHexColor(valueToColor(i*50)))
    })

    bulletColliders?.forEach((timeStep,i) => timeStep.forEach(collider => {
        game.debug.geom(collider,toHexColor(valueToColor(i*50)));
    }));

    // flashText(JSON.stringify(inputMovement))
}

function handleBulletCollision(bullet) {
    let bulletData = bullet;
    if (!bullet.isCustom) bulletData = makeBulletData(bullet);

    const bulletCollider = getBulletColliders([bulletData],0)[0]

    const mazeWallsArray = [];
    maze_walls.forEach(wall => mazeWallsArray.push(wall))

    for (const wall of mazeWallsArray) {
        if (!wall.collider) continue;

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
    }
}

function calculateMovements(playerX,playerY,colliders,interval,lookAhead) {
    const newLookAhead = lookAhead - 1;

    //console.log("looking ahead: " + newLookAhead)

    const collidersReversed = [...colliders].reverse()

    const collidersNow = collidersReversed[newLookAhead]
        .concat(collidersReversed[newLookAhead - 1]);

    const distance = 0.1 * interval;

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

    possibleMoves = possibleMoves.filter(element => element[0] != inputMovement[0] || element[1] != inputMovement[1]);
    possibleMoves.unshift(inputMovement);

    for (const move of possibleMoves) {
        //console.log("Testing Move: " + move)
        movesTested++;
        const playerCollider = new Phaser.Rectangle(0,0,50 + 10,50 + 10);

        let newPlayerX = playerX + distance*move[0];
        let newPlayerY = playerY + distance*move[1];
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

        if (!colliding) {
            let nextMoves = [];
            if (lookAhead != 1) nextMoves = calculateMovements(newPlayerX,newPlayerY,colliders,interval,newLookAhead);

            if (lookAhead == 1 || nextMoves != false) {
                plannedColliders.push([newPlayerX,newPlayerY])
                return [ move, ...nextMoves ];
            }
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