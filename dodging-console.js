
const SETTINGS = {
    LOOK_AHEAD: 1,
    RUN_INTERVAL: 500
}

let foundBullets = []

setInterval(() => {
    if (state != "game" || server_tanks[name]?.body.alpha != 1) return;
    let lastFoundBulletsSet = bullets;
    foundBullets = []
    for (let i = 0; i < SETTINGS.LOOK_AHEAD; i++) {
        lastFoundBulletsSet = lookAhead(SETTINGS.RUN_INTERVAL,lastFoundBulletsSet);
        foundBullets.push(...lastFoundBulletsSet);
    }
},SETTINGS.RUN_INTERVAL)

game.state.render = () => {
    bullets.forEach(bullet => {
        if (!bullet.bulletAngle) {
            if (!bullet.oldX) {
                bullet.oldX = bullet.x; 
                bullet.oldY = bullet.y;
            } else {
                bullet.bulletAngle = Math.atan2(bullet.y - bullet.oldY,bullet.x - bullet.oldX);
                bullet.oldX = bullet.x; bullet.oldY = bullet.y;
                console.log(bullet.bulletAngle);
            }
        }

        bullet.bounces = 1;
    })

    foundBullets.forEach(bulletFound => {
        game.debug.pixel(bulletFound.x,bulletFound.y,"red",10);
    })
}

function calculateMovements() {

}

const makeBulletData = bullet => ({ 
    0: { // regular
        isCustom: true,

        type: 0,
        angle: bullet.bulletAngle,
        bounces: bullet.bounces,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 42.5,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    }, 

    3: { // quick
        isCustom: true,
        
        type: 3,
        angle: bullet.bulletAngle,
        bounces: bullet.bounces,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 72.5,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    }, 

    4: { // bomb
        isCustom: true,
        
        type: 4,
        angle: bullet.bulletAngle,
        bounces: bullet.bounces,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 35,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    }, 

    6: { // rocket
        isCustom: true,
        
        type: 6,
        angle: bullet.bulletAngle,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 72.5,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    },

    8: {  // minigun
        isCustom: true,
        
        type: 8,
        angle: bullet.bulletAngle,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 72.5,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    },

    5: { // shotgun
        isCustom: true,
        
        type: 5,
        angle: bullet.bulletAngle,
        bounces: bullet.bounces,
        breakTime: bullet.breakTime,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,

        speed: 72.5,

        lookAhead: function(time) {
            const copy = { ...this }

            copy.x += time / 1000 * this.speed * Math.cos(this.angle);
            copy.y += time / 1000 * this.speed * Math.sin(this.angle);

            return copy
        }
    },

    1: { // grenade
        isCustom: true,
        
        type: 1,
        angle: bullet.bulletAngle,
        explodeTime: bullet.explodeTime,
        x: bullet.worldPosition.x,
        y: bullet.worldPosition.y,
    },

    7: { // sniper
        isCustom: true,
        
        type: 7,
        start: { ...bullet.startpoint },
        end: { ...bullet.endpoint }
    },
}[bullet.type])


function lookAhead(time,bulletDataInput) {
    const newBullets = [];

    bulletDataInput.forEach(bullet => {
        if (bullet.type == 7 || bullet.type == 1) return;

        let bulletData = bullet
        if (!bullet.isCustom) bulletData = makeBulletData(bullet);

        newBullets.push(bulletData.lookAhead(time));
    });

    return newBullets;
}