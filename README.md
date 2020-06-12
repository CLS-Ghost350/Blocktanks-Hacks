# Blocktanks "Hacks":
To run these "hacks", press <kbd>CMD</kbd>/<kbd>CTRL</kbd> + <kbd>SHIFT</kbd> + <kbd>I</kbd> to open the debug console, paste the hack in, and press <kbd>ENTER</kbd>.

## Auto-Shoot "Hack":
```js
autoShoot = setInterval(() => { if (!controls.rightClick) socket.send("bullet",{ 
    angle:Math.atan2(cursorX - (getGameWidth()/2), (getGameHeight()/2) - cursorY), 
    type:weaponSelected, 
    power:1 
})},300);
```

or:
```js
autoShoot = setInterval(() => if (!controls.rightClick) fireBullet(), 300);
```

Auto-shoots when not holding right-click. 
To stop enter `clearInterval(autoShoot)`.

## Remove Roof "Hack":
```js
roofs.destroy();
```

Removes all roofs. You have to run it again each time a new game starts.

Constant Remove Roof "Hack":
```js
destoryRoofs = setInterval(() => roofs.destroy(), 10000);
```

Same as the remove roof "hack" but you only have to enter it in once. 
To stop enter `clearInterval(destoryRoofs)`.

## Dark Mode "Hack":
```js
setDarkMode(true);
```

Enables Dark Mode, a graphics setting used in Halloween. Has to be entered in before joining a game. Otherwise, bullets, nametags, etc. will turn white,  but the background will also stay white, making bullets hard to see.

## Christmas "Hack":
```js
function christmasTime() { return true; }
```

Enables Christmas graphics. However since the snowball assets were removed, it doesn't look too good. Only has to be run once.

## Stop Flashbang "Hack":
```js
flashBang = () => {};
```

Removes the flashbang effect. Only has to be run once.

## Tracer "Hack":
```js
game.state.render = () => {
    if (window.state != "game" || !server_tanks[name]) return;

    Object.entries(server_tanks).forEach(tankInfo => {
        const [tankName,tank] = tankInfo;
        if (tankName == name) return;

        if (!tank.tracer) tank.tracer = new Phaser.Line();
        
        tank.tracer.start.x = server_tanks[name].body.worldPosition.x;
        tank.tracer.start.y = server_tanks[name].body.worldPosition.y;

        tank.tracer.end.x = tank.body.worldPosition.x; 
        tank.tracer.end.y = tank.body.worldPosition.y;

        teamColor = "#7d7d7d";
        if (tank.team == "r" && server_tanks[name].team == "b") teamColor = "#ff0000";
        if (tank.team == "b" && server_tanks[name].team == "r") teamColor = "#0000ff";

        if (tank.body.alpha != 0) game.debug.geom(tank.tracer,teamColor);
    });
}
```

Creates tracers that point to players. Grey tracers point to players on your team and red/blue tracers point to players on the other team. 
To stop enter `game.state.render = null`.

## Aimbot "Hack"
```js
let oldFireBullet = fireBullet;

fireBullet = angle => {
    if (!controls.rightClick || weaponSelected == 7) return oldFireBullet(angle);

    let closestTankAngle = server_tanks[name].arm.rotation;
    let closestDistance = 1000000;

    Object.entries(server_tanks).forEach(tankInfo => {
        const [tankName,tank] = tankInfo;
        if (tankName == name || tank.body.alpha != 1 || 
        tank.team == server_tanks[name].team) return;

        const tankAngle = Math.atan2(
            tank.body.worldPosition.x - (getGameWidth()/2), 
            (getGameHeight()/2) - tank.body.worldPosition.y
        )   

        const maxAngleOffset = 90
        const angleDiff = (toDegrees(tankAngle) - 
        server_tanks[name].arm.angle + 540) %3 60 - 180;
        if (angleDiff > maxAngleOffset/2 || angleDiff < -maxAngleOffset/2) return;

        const distance = Math.hypot(
            cursorX - tank.body.worldPosition.x,
            cursorY - tank.body.worldPosition.y
        );

        if (distance < closestDistance) closestTankAngle = tankAngle;
    });

    oldFireBullet(closestTankAngle);
}
```

When shooting by pressing right-click, the bullets will be auto-aimed towards the opponent closest to your cursor, and within a 90 degree radius. Does not work with snipers. To stop enter `fireBullet = oldFireBullet`.

```js
script = document.createElement("SCRIPT")
att = document.createAttribute("scr")
att.value = "https://github.com/CLS-Ghost350/blocktanks-hacks/blob/master/hacks.js"
script.setAttributeNode(att)
document.head.appendChild(script)
```