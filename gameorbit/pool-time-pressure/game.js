"use strict";

var Keys = {
    none: 0,
    back: 8,
    tab: 9,
    enter: 13,
    pause: 19,
    escape: 27,

    space: 32,

    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,

    insert: 45,
    del: 46,

    d0: 48,
    d1: 49,
    d2: 50,
    d3: 51,
    d4: 52,
    d5: 53,
    d6: 54,
    d7: 55,
    d8: 56,
    d9: 57,

    A: 65,     B: 66,      C: 67,      D: 68,       E: 69,      F: 70,
    G: 71,     H: 72,      I: 73,      J: 74,       K: 75,      L: 76,
    M: 77,     N: 78,      O: 79,      P: 80,       Q: 81,      R: 82,
    S: 83,     T: 84,      U: 85,      V: 86,       W: 87,      X: 88,
    Y: 89,     Z: 90,

    multiply: 42,
    add: 43,
    subtract: 45,
    decimal: 46,
    divide: 47
};
"use strict";

var Color = {
    aliceBlue: "#F0F8FF",
    antiqueWhite: "#FAEBD7",
    aqua: "#00FFFF",
    aquamarine: "#7FFFD4",
    azure: "#F0FFFF",
    beige: "#F5F5DC",
    bisque: "#FFE4C4",
    black: "#000000",
    blanchedAlmond: "#FFEBCD",
    blue: "#0000FF",
    blueViolet: "#8A2BE2",
    brown: "#A52A2A",
    burlyWood: "#DEB887",
    cadetBlue: "#5F9EA0",
    chartreuse: "#7FFF00",
    chocolate: "#D2691E",
    coral: "#FF7F50",
    cornflowerBlue: "#6495ED",
    cornsilk: "#FFF8DC",
    crimson: "#DC143C",
    cyan: "#00FFFF",
    darkBlue: "#00008B",
    darkCyan: "#008B8B",
    darkGoldenrod: "#B8860B",
    darkGray: "#A9A9A9",
    darkGreen: "#006400",
    darkKhaki: "#BDB76B",
    darkMagenta: "#8B008B",
    darkOliveGreen: "#556B2F",
    darkOrange: "#FF8C00",
    darkOrchid: "#9932CC",
    darkRed: "#8B0000",
    darkSalmon: "#E9967A",
    darkSeaGreen: "#8FBC8B",
    darkSlateBlue: "#483D8B",
    darkSlateGray: "#2F4F4F",
    darkTurquoise: "#00CED1",
    darkViolet: "#9400D3",
    deepPink: "#FF1493",
    deepSkyBlue: "#00BFFF",
    dimGray: "#696969",
    dodgerBlue: "#1E90FF",
    firebrick: "#B22222",
    floralWhite: "#FFFAF0",
    forestGreen: "#228B22",
    fuchsia: "#FF00FF",
    gainsboro: "#DCDCDC",
    ghostWhite: "#F8F8FF",
    gold: "#FFD700",
    goldenrod: "#DAA520",
    gray: "#808080",
    green: "#008000",
    greenYellow: "#ADFF2F",
    honeydew: "#F0FFF0",
    hotPink: "#FF69B4",
    indianRed: "#CD5C5C",
    indigo: "#4B0082",
    ivory: "#FFFFF0",
    khaki: "#F0E68C",
    lavender: "#E6E6FA",
    lavenderBlush: "#FFF0F5",
    lawnGreen: "#7CFC00",
    lemonChiffon: "#FFFACD",
    lightBlue: "#ADD8E6",
    lightCoral: "#F080FF",
    lightCyan: "#E0FFFF",
    lightGoldenrodYellow: "#FAFAD2",
    lightGray: "#D3D3D3",
    lightGreen: "#90EE90",
    lightPink: "#FFB6C1",
    lightSalmon: "#FFA07A",
    lightSeaGreen: "#20B2AA",
    lightSkyBlue: "#87CEFA",
    lightSlateGray: "#778899",
    lightSteelBlue: "#B0C4DE",
    lightYellow: "#FFFFE0",
    lime: "#00FF00",
    limeGreen: "#32CD32",
    linen: "#FAF0E6",
    magenta: "#FF00FF",
    maroon: "#800000",
    mediumAquamarine: "#66CDAA",
    mediumBlue: "#0000CD",
    mediumOrchid: "#BA55D3",
    mediumPurple: "#9370DB",
    mediumSeaGreen: "#3CB371",
    mediumSlateBlue: "#7B68EE",
    mediumSpringGreen: "#00FA9A",
    mediumTurquoise: "#48D1CC",
    mediumVioletRed: "#C71585",
    midnightBlue: "#191970",
    mintCream: "#F5FFFA",
    mistyRose: "#FFE4E1",
    moccasin: "#FFE4B5",
    navajoWhite: "#FFDEAD",
    navy: "#000080",
    oldLace: "#FDF5E6",
    olive: "#808000",
    oliveDrab: "#6B8E23",
    orange: "#FFA500",
    orangeRed: "#FF4500",
    orchid: "#DA70D6",
    paleGoldenrod: "#EEE8AA",
    paleGreen: "#98FB98",
    paleTurquoise: "#AFEEEE",
    paleVioletRed: "#DB7093",
    papayaWhip: "#FFEFD5",
    peachPuff: "#FFDAB9",
    peru: "#CD853F",
    pink: "#FFC0CB",
    plum: "#DDA0DD",
    powderBlue: "#B0E0E6",
    purple: "#800080",
    red: "#FF0000",
    rosyBrown: "#BC8F8F",
    royalBlue: "#4169E1",
    saddleBrown: "#8B4513",
    salmon: "#FA8072",
    sandyBrown: "#F4A460",
    seaGreen: "#2E8B57",
    seaShell: "#FFF5EE",
    sienna: "#A0522D",
    silver: "#C0C0C0",
    skyBlue: "#87CEEB",
    slateBlue: "#6A5ACD",
    slateGray: "#708090",
    snow: "#FFFAFA",
    springGreen: "#00FF7F",
    steelBlue: "#4682B4",
    tan: "#D2B48C",
    teal: "#008080",
    thistle: "#D8BFD8",
    tomato: "#FF6347",
    turquoise: "#40E0D0",
    violet: "#EE82EE",
    wheat: "#F5DEB3",
    white: "#FFFFFF",
    whiteSmoke: "#F5F5F5",
    yellow: "#FFFF00",
    yellowGreen: "#9ACD32"
};
"use strict";

function Vector2(x, y) {
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
}

Object.defineProperty(Vector2, "zero",
    {
        get: function () {
            return new Vector2();
        }
    });

Object.defineProperty(Vector2.prototype, "isZero",
    {
        get: function () {
            return this.x === 0 && this.y === 0;
        }
    });

Object.defineProperty(Vector2.prototype, "length",
    {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
    });

Vector2.prototype.addTo = function (v) {
    if (v.constructor === Vector2) {
        this.x += v.x;
        this.y += v.y;
    }
    else if (v.constructor === Number) {
        this.x += v;
        this.y += v;
    }
    return this;
};

Vector2.prototype.add = function (v) {
    var result = this.copy();
    return result.addTo(v);
};

Vector2.prototype.subtractFrom = function (v) {
    if (v.constructor === Vector2) {
        this.x -= v.x;
        this.y -= v.y;
    }
    else if (v.constructor === Number) {
        this.x -= v;
        this.y -= v;
    }
    return this;
};

Vector2.prototype.subtract = function (v) {
    var result = this.copy();
    return result.subtractFrom(v);
};

Vector2.prototype.divideBy = function (v) {
    if (v.constructor === Vector2) {
        this.x /= v.x;
        this.y /= v.y;
    }
    else if (v.constructor === Number) {
        this.x /= v;
        this.y /= v;
    }
    return this;
};

Vector2.prototype.divide = function (v) {
    var result = this.copy();
    return result.divideBy(v);
};

Vector2.prototype.multiplyWith = function (v) {
    if (v.constructor === Vector2) {
        this.x *= v.x;
        this.y *= v.y;
    }
    else if (v.constructor === Number) {
        this.x *= v;
        this.y *= v;
    }
    return this;
};

Vector2.prototype.multiply = function (v) {
    var result = this.copy();
    return result.multiplyWith(v);
};

Vector2.prototype.toString = function () {
    return "(" + this.x + ", " + this.y + ")";
};

Vector2.prototype.normalize = function () {
    var length = this.length;
    if (length === 0)
        return;
    this.divideBy(length);
};

Vector2.prototype.copy = function () {
    return new Vector2(this.x, this.y);
};

Vector2.prototype.equals = function (obj) {
    return this.x === obj.x && this.y === obj.y;
};

Vector2.prototype.distanceFrom = function(obj){
    return Math.sqrt((this.x-obj.x)*(this.x-obj.x) + (this.y-obj.y)*(this.y-obj.y));
}
﻿"use strict";

function ButtonState() {
    this.down = false;
    this.pressed = false;
}
"use strict";

function handleKeyDown(evt) {
    var code = evt.keyCode;
    if (code < 0 || code > 255)
        return;
    if (!Keyboard._keyStates[code].down)
        Keyboard._keyStates[code].pressed = true;
    Keyboard._keyStates[code].down = true;
}

function handleKeyUp(evt) {
    var code = evt.keyCode;
    if (code < 0 || code > 255)
        return;
    Keyboard._keyStates[code].down = false;
}

function Keyboard_Singleton() {
    this._keyStates = [];
    for (var i = 0; i < 256; ++i)
        this._keyStates.push(new ButtonState());
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}

Keyboard_Singleton.prototype.reset = function () {
    for (var i = 0; i < 256; ++i)
        this._keyStates[i].pressed = false;
};

Keyboard_Singleton.prototype.pressed = function (key) {
    return this._keyStates[key].pressed;
};

Keyboard_Singleton.prototype.down = function (key) {
    return this._keyStates[key].down;
};

var Keyboard = new Keyboard_Singleton();

"use strict";

function handleMouseMove(evt) {
    if(!Canvas2D._canvas) return;
    var rect = Canvas2D._canvas.getBoundingClientRect();
    
    var clientX = evt.clientX;
    var clientY = evt.clientY;
    if(evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
        // Only prevent default on move to allow clicking HTML buttons
        if (evt.type === 'touchmove') evt.preventDefault();
    } else if(evt.changedTouches && evt.changedTouches.length > 0) {
        clientX = evt.changedTouches[0].clientX;
        clientY = evt.changedTouches[0].clientY;
        if (evt.type === 'touchmove') evt.preventDefault();
    }

    if(clientX === undefined) return;

    var x = clientX - rect.left;
    var y = clientY - rect.top;

    var scaleX = Game.size ? (Game.size.x / rect.width) : (1500 / rect.width);
    var scaleY = Game.size ? (Game.size.y / rect.height) : (825 / rect.height);

    Mouse._position = new Vector2(x * scaleX, y * scaleY);
}

function handleMouseDown(evt) {
    // PMG Layout Sync (Ad Refresh on user action)
    if (typeof syncPMGLayout === "function") {
        const seconds = Math.round((Date.now() - (window.gameRecordTime || Date.now())) / 1000);
        if (seconds > (window.PMG_TICK_RATE || 60)) {
            syncPMGLayout();
            window.gameRecordTime = Date.now(); 
        }
    }

    handleMouseMove(evt);

    if (evt.type === 'touchstart' || evt.which === 1) {
        if (!Mouse._left.down)
            Mouse._left.pressed = true;
        Mouse._left.down = true;
    } else if (evt.which === 2) {
        if (!Mouse._middle.down)
            Mouse._middle.pressed = true;
        Mouse._middle.down = true;
    } else if (evt.which === 3) {
        if (!Mouse._right.down)
            Mouse._right.pressed = true;
        Mouse._right.down = true;
    }
}

function handleMouseUp(evt) {
    handleMouseMove(evt);

    if (evt.type === 'touchend' || evt.type === 'touchcancel' || evt.which === 1)
        Mouse._left.down = false;
    else if (evt.which === 2)
        Mouse._middle.down = false;
    else if (evt.which === 3)
        Mouse._right.down = false;
}

function Mouse_Singleton() {
    this._position = Vector2.zero;
    this._left = new ButtonState();
    this._middle = new ButtonState();
    this._right = new ButtonState();

    document.addEventListener('mousemove', handleMouseMove, {passive: false});
    document.addEventListener('mousedown', handleMouseDown, {passive: false});
    document.addEventListener('mouseup', handleMouseUp, {passive: false});
    
    document.addEventListener('touchmove', handleMouseMove, {passive: false});
    document.addEventListener('touchstart', handleMouseDown, {passive: false});
    document.addEventListener('touchend', handleMouseUp, {passive: false});
    document.addEventListener('touchcancel', handleMouseUp, {passive: false});
}

Object.defineProperty(Mouse_Singleton.prototype, "left",
    {
        get: function () {
            return this._left;
        }
    });

Object.defineProperty(Mouse_Singleton.prototype, "middle",
    {
        get: function () {
            return this._middle;
        }
    });

Object.defineProperty(Mouse_Singleton.prototype, "right",
    {
        get: function () {
            return this._right;
        }
    });

Object.defineProperty(Mouse_Singleton.prototype, "position",
    {
        get: function () {
            return this._position;
        }
    });

Mouse_Singleton.prototype.reset = function () {
    this._left.pressed = false;
    this._middle.pressed = false;
    this._right.pressed = false;
};

Mouse_Singleton.prototype.containsMouseDown = function (rect) {
    return this._left.down && rect.contains(this._position);
};

Mouse_Singleton.prototype.containsMousePress = function (rect) {
    return this._left.pressed && rect.contains(this._position);
};

var Mouse = new Mouse_Singleton();

const LOG = false;

const BALL_SIZE = 38;
const BORDER_SIZE = 57;
const HOLE_RADIUS = 46;

const DELTA = 1/100;

let DISPLAY = true;
let SOUND_ON = true;
let GAME_STOPPED = true;

let KEYBOARD_INPUT_ON = true;

let TRAIN_ITER = 100;
let AI_ON = true;
let AI_PLAYER_NUM = 1;
let DISPLAY_TRAINING = false;

"use strict";

function Canvas2D_Singleton() {
    this._canvas = null;
    this._canvasContext = null;
    this._canvasOffset = Vector2.zero;
}

Object.defineProperty(Canvas2D_Singleton.prototype, "offset",
    {
        get: function () {
            return this._canvasOffset;
        }
    });

Object.defineProperty(Canvas2D_Singleton.prototype, "scale",
    {
        get: function () {
            return new Vector2(this._canvas.width / Game.size.x,
                this._canvas.height / Game.size.y);
        }
    });

Canvas2D_Singleton.prototype.initialize = function (divName, canvasName) {
    this._canvas = document.getElementById(canvasName);
    this._div = document.getElementById(divName);

    if (this._canvas.getContext)
        this._canvasContext = this._canvas.getContext('2d');
    else {
        alert('Your browser is not HTML5 compatible.!');
        return;
    }
    window.onresize = Canvas2D_Singleton.prototype.resize;
    this.resize();
};

Canvas2D_Singleton.prototype.clear = function () {
    this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

Canvas2D_Singleton.prototype.resize = function () {
    // CSS handles resizing natively via max-width and max-height constraints
    // Maintain internal resolution of canvas
    if(Canvas2D._canvas && Game.size) {
        Canvas2D._canvas.width = Game.size.x;
        Canvas2D._canvas.height = Game.size.y;
    }
};

Canvas2D_Singleton.prototype.drawImage = function (sprite, position, rotation, scale, origin) {
    var canvasScale = this.scale;

    position = typeof position !== 'undefined' ? position : Vector2.zero;
    rotation = typeof rotation !== 'undefined' ? rotation : 0;
    scale = typeof scale !== 'undefined' ? scale : 1;
    origin = typeof origin !== 'undefined' ? origin : Vector2.zero;

    this._canvasContext.save();
    this._canvasContext.scale(canvasScale.x, canvasScale.y);
    this._canvasContext.translate(position.x, position.y);
    this._canvasContext.rotate(rotation);
    this._canvasContext.drawImage(sprite, 0, 0,
        sprite.width, sprite.height,
        -origin.x * scale, -origin.y * scale,
        sprite.width * scale, sprite.height * scale);
    this._canvasContext.restore();
};

Canvas2D_Singleton.prototype.drawText = function (text, position, origin, color, textAlign, fontname, fontsize) {
    var canvasScale = this.scale;

    position = typeof position !== 'undefined' ? position : Vector2.zero;
    origin = typeof origin !== 'undefined' ? origin : Vector2.zero;
    color = typeof color !== 'undefined' ? color : Color.black;
    textAlign = typeof textAlign !== 'undefined' ? textAlign : "top";
    fontname = typeof fontname !== 'undefined' ? fontname : "sans-serif";
    fontsize = typeof fontsize !== 'undefined' ? fontsize : "20px";

    this._canvasContext.save();
    this._canvasContext.scale(canvasScale.x, canvasScale.y);
    this._canvasContext.translate(position.x - origin.x, position.y - origin.y);
    this._canvasContext.textBaseline = 'top';
    this._canvasContext.font = fontsize + " " + fontname;
    this._canvasContext.fillStyle = color.toString();
    this._canvasContext.textAlign = textAlign;
    this._canvasContext.fillText(text, 0, 0);
    this._canvasContext.restore();
};

var Canvas2D = new Canvas2D_Singleton();


"use strict";

function Score(position){
    this.position = position;
    this.origin = new Vector2(47,82);
    this.value = 0;
}

Score.prototype.reset = function(){
    this.position = position;
    this.origin = new Vector2(30,0);
    this.value = 0;
};

Score.prototype.draw = function () {
  Canvas2D.drawText(
      this.value, 
      this.position, 
      this.origin, 
      "#096834", 
      "top", 
      "Impact", 
      "200px"
    );
};

Score.prototype.drawLines = function (color) {
    
    for(let i=0; i<this.value; i++){

        let pos = this.position.add(new Vector2(i*15,0));

        Canvas2D.drawText(
            "I", 
            pos, 
            this.origin, 
            color, 
            "top", 
            "Arial", 
            "20px"
        );

    }
  };

Score.prototype.increment = function(){
    this.value++;
};
"use strict";

function Ball(initPos,color){
	this.initPos = initPos;
    this.position = initPos.copy();
    this.origin = new Vector2(25,25);
    this.velocity = Vector2.zero;
    this.color = color; 
    this.moving = false;
    this.visible = true;
    this.inHole = false;
}

Object.defineProperty(Ball.prototype, "color",
    {
    	get: function(){
    		if(this.sprite == sprites.redBall){
    			return Color.red;
    		}
    		else if(this.sprite == sprites.yellowBall){
    			return Color.yellow;
    		}
			else if(this.sprite == sprites.blackBall){
    			return Color.black;
    		}
    		else{
    			return Color.white;
    		}
    	},
        set: function (value) {
            if (value === Color.red){
                this.sprite = sprites.redBall;
            }
            else if(value == Color.yellow){
            	this.sprite = sprites.yellowBall;
            }
			else if(value == Color.black){
            	this.sprite = sprites.blackBall;
            }
            else{
            	this.sprite = sprites.ball;
            }
        }
    });

Ball.prototype.shoot = function(power, angle){
    if(power <= 0)
        return;

    this.moving = true;

    this.velocity = calculateBallVelocity(power,angle);
}

var calculateBallVelocity = function(power, angle){

    return new Vector2(100*Math.cos(angle)*power,100*Math.sin(angle)*power);
}

Ball.prototype.update = function(delta){

    this.updatePosition(delta);

    this.velocity.multiplyWith(0.98);

	if(this.moving && Math.abs(this.velocity.x) < 1 && Math.abs(this.velocity.y) < 1){
        this.stop();
    }
}

Ball.prototype.updatePosition = function(delta){

    if(!this.moving || this.inHole)
        return;
    var ball = this;
    var newPos = this.position.add(this.velocity.multiply(delta));


	if(Game.policy.isInsideHole(newPos)){
        if(Game.sound && SOUND_ON){
            var holeSound = sounds.hole.cloneNode(true);
            holeSound.volume = 0.5;
            holeSound.play();
        }
		this.position = newPos;
        this.inHole = true;
        setTimeout(function(){ball.visible=false;ball.velocity = Vector2.zero;}, 100);
        Game.policy.handleBallInHole(this);
		return;
	}

    var collision = this.handleCollision(newPos);

    if(collision){
		this.velocity.multiplyWith(0.95);
    }else{
    	this.position = newPos;
    }
}

Ball.prototype.handleCollision = function(newPos){

	var collision = false;

	if(Game.policy.isXOutsideLeftBorder(newPos, this.origin)){
        this.velocity.x = -this.velocity.x;
        this.position.x = Game.policy.leftBorderX + this.origin.x;
        collision = true;
    }
    else if(Game.policy.isXOutsideRightBorder(newPos, this.origin)){
        this.velocity.x = -this.velocity.x;
        this.position.x = Game.policy.rightBorderX - this.origin.x;
        collision = true;
    }

    if(Game.policy.isYOutsideTopBorder(newPos, this.origin)){
        this.velocity.y = -this.velocity.y;
        this.position.y = Game.policy.topBorderY + this.origin.y;
        collision = true;
    }
    else if(Game.policy.isYOutsideBottomBorder(newPos, this.origin)){
        this.velocity.y = -this.velocity.y;
        this.position.y = Game.policy.bottomBorderY - this.origin.y;
        collision = true;
    }

    return collision;
}

Ball.prototype.stop = function(){

    this.moving = false;
    this.velocity = Vector2.zero;
}

Ball.prototype.reset = function(){
	this.inHole = false;
	this.moving = false;
	this.velocity = Vector2.zero;
	this.position = this.initPos;
	this.visible = true;
}

Ball.prototype.out = function(){

	this.position = new Vector2(0, 900);
	this.visible = false;
	this.inHole = true;

}

Ball.prototype.draw = function () {
    if(!this.visible)
        return;

    Canvas2D.drawImage(this.sprite, this.position, 0, 1, new Vector2(25,25));
};
"use strict";

function Stick(position){
    this.position = position;
    this.origin = new Vector2(970,11);
    this.shotOrigin = new Vector2(950,11);
    this.shooting = false;
    this.visible = true;
    this.rotation = 0;
    this.power = 0;
    this.trackMouse = true;
}

Stick.prototype.handleInput = function (delta) {
    if(AI_ON && Game.policy.turn === AI_PLAYER_NUM) return;
    if(Game.policy.turnPlayed) return;

    if (Mouse.left.down) {
        // ALWAYS update rotation towards mouse position (behind the ball logic)
        var dx = Mouse.position.x - this.position.x;
        var dy = Mouse.position.y - this.position.y;
        
        // Point from mouse to ball
        this.rotation = Math.atan2(-dy, -dx);
        
        if (!this.charging) {
            this.charging = true;
            this.power = 0;
        }

        // Power scales with distance from cue ball
        var dist = Math.sqrt(dx*dx + dy*dy);
        // deadzone 40px, max power at ~200px drag
        this.power = Math.max(0, Math.min(75, (dist - 42) / 2.2));
        this.origin.x = 970 + this.power * 2;
    } else {
        if (this.charging) {
            if (this.power > 1) {
                this.shoot(this.power, this.rotation);
            } else {
                this.power = 0;
                this.origin = new Vector2(970, 11);
            }
            this.charging = false;
        } else {
            // Free look rotation
            var dx = Mouse.position.x - this.position.x;
            var dy = Mouse.position.y - this.position.y;
            this.rotation = Math.atan2(-dy, -dx);
        }
    }
};

Stick.prototype.shoot = function(power, rotation){
  this.power = power;
  this.rotation = rotation;

  if(Game.sound && SOUND_ON){
    var strike = sounds.strike.cloneNode(true);
    strike.volume = (this.power/(10))<1?(this.power/(10)):1;
    strike.play();
  }
  Game.policy.turnPlayed = true;
  this.shooting = true;
  this.origin = this.shotOrigin.copy();

  Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
  this.visible = false; // Fixed disappearance race condition!
}

Stick.prototype.update = function(){
  if(this.shooting && !Game.gameWorld.whiteBall.moving)
    this.reset();
};

Stick.prototype.reset = function(){
  this.position.x = Game.gameWorld.whiteBall.position.x;
  this.position.y = Game.gameWorld.whiteBall.position.y;
	this.origin = new Vector2(970,11);
  this.shooting = false;
  this.visible = true;
	this.power = 0;
};

Stick.prototype.draw = function () {
  if(!this.visible)
    return;

  // Draw Aim Projection line BEFORE drawing the stick
  if ((this.trackMouse || this.charging) && Canvas2D._canvasContext) {
      Canvas2D._canvasContext.save();
      Canvas2D._canvasContext.beginPath();
      Canvas2D._canvasContext.setLineDash([8, 8]);
      Canvas2D._canvasContext.moveTo(this.position.x, this.position.y);
      var endX = this.position.x + Math.cos(this.rotation) * 600;
      var endY = this.position.y + Math.sin(this.rotation) * 600;
      Canvas2D._canvasContext.lineTo(endX, endY);
      Canvas2D._canvasContext.strokeStyle = "rgba(255, 255, 255, 0.4)";
      Canvas2D._canvasContext.lineWidth = 2;
      Canvas2D._canvasContext.stroke();
      
      // Draw arrowhead
      Canvas2D._canvasContext.beginPath();
      Canvas2D._canvasContext.setLineDash([]);
      Canvas2D._canvasContext.translate(endX, endY);
      Canvas2D._canvasContext.rotate(this.rotation);
      Canvas2D._canvasContext.moveTo(0, 0);
      Canvas2D._canvasContext.lineTo(-12, -6);
      Canvas2D._canvasContext.lineTo(-12, 6);
      Canvas2D._canvasContext.fillStyle = "rgba(255, 255, 255, 0.6)";
      Canvas2D._canvasContext.fill();
      Canvas2D._canvasContext.restore();
  }

  Canvas2D.drawImage(sprites.stick, this.position,this.rotation,1, this.origin);

  // Draw Power visualizer if charging
  if (this.charging && Canvas2D._canvasContext) {
      Canvas2D._canvasContext.save();
      var barX = this.position.x - 40;
      var barY = this.position.y - 60;
      
      // Background
      Canvas2D._canvasContext.fillStyle = "rgba(0,0,0,0.6)";
      Canvas2D._canvasContext.fillRect(barX, barY, 80, 10);
      
      // Fill
      var powerRatio = this.power / 75;
      if(powerRatio < 0.3) Canvas2D._canvasContext.fillStyle = "#10b981";
      else if(powerRatio < 0.7) Canvas2D._canvasContext.fillStyle = "#facc15";
      else Canvas2D._canvasContext.fillStyle = "#ef4444";
      Canvas2D._canvasContext.fillRect(barX, barY, 80 * powerRatio, 10);
      
      // Border
      Canvas2D._canvasContext.strokeStyle = "white";
      Canvas2D._canvasContext.lineWidth = 1;
      Canvas2D._canvasContext.strokeRect(barX, barY, 80, 10);
      Canvas2D._canvasContext.restore();
  }
};
function Label(text, position, origin, color, textAlign, fontname, fontsize){

    this.text = typeof text !== 'undefined' ? text : '';
    this.position = typeof position !== 'undefined' ? position : Vector2.zero;
    this.origin = typeof origin !== 'undefined' ? origin : Vector2.zero;
    this.color = typeof color !== 'undefined' ? color : Color.black;
    this.textAlign = typeof textAlign !== 'undefined' ? textAlign : "top";
    this.fontname = typeof fontname !== 'undefined' ? fontname : "Courier New";
    this.fontsize = typeof fontsize !== 'undefined' ? fontsize : "20px";
}

Label.prototype.draw = function(){

    Canvas2D.drawText(
        this.text, 
        this.position,
        this.origin,
        this.color,
        this.textAlign,
        this.fontname,
        this.fontsize
    );

}
function Button(sprite, position, callback, hoverSprite){

    this.sprite = sprite;
    this.hoverSprite = hoverSprite ? hoverSprite : sprite;
    this.position = position;
    this.callback = callback;
}

Button.prototype.draw = function(){

    if(this.mouseInsideBorders()){
        Canvas2D.drawImage(this.hoverSprite, this.position, 0, 1);
        Canvas2D._canvas.style.cursor = "pointer";
    }
    else{
        Canvas2D.drawImage(this.sprite, this.position, 0, 0.98);
    }
}

Button.prototype.handleInput = function(){

    if(Mouse.left.pressed && this.mouseInsideBorders()){
        this.callback();
    }
}

Button.prototype.mouseInsideBorders = function(){
    
    var mousePos = Mouse.position;

    if(mousePos.x > this.position.x 
        &&
        mousePos.x < this.position.x + this.sprite.width
        &&
        mousePos.y > this.position.y
        &&
        mousePos.y < this.position.y + this.sprite.height
    ){
        return true;
    }

    return false;
}
function Menu(){
    
}

Menu.prototype.init = function
(
    backgroundSprite,
    labels,
    buttons,
    sound
){  
    this.background = backgroundSprite;
    this.labels = labels || [];
    this.buttons = buttons || [];
    this.sound = sound ? sound : undefined;

    this.active = false;
}

Menu.prototype.load = function(){
    if(this.sound) this.sound.currentTime = 0;
    this.active = true;

    requestAnimationFrame(this.menuLoop.bind(this));
    if(SOUND_ON && this.sound){
        this.sound.volume = 0.8;
    }

    if(this.sound) {
        var p = this.sound.play();
        if (p) p.catch(e => console.log('Audio blocked', e));
    }
}

Menu.prototype.draw = function(){

    Canvas2D._canvas.style.cursor = "auto"; 

    Canvas2D.drawImage(
        this.background, 
        Vector2.zero, 
        0, 
        1, 
        Vector2.zero
    );


    for(let i = 0 ; i < this.labels.length ; i++){
        this.labels[i].draw();
    }

    for(let i = 0 ; i < this.buttons.length ; i++){
        this.buttons[i].draw();
    }
}

Menu.prototype.handleInput = function(){

    for(let i = 0 ; i < this.buttons.length ; i++){
        this.buttons[i].handleInput();
    }
}

Menu.prototype.menuLoop = function(){
    if(this.active){
        try {
            this.handleInput();
            Canvas2D.clear();
            this.draw();
            Mouse.reset();
        } catch(e) {
            console.error("Menu loop crash:", e);
        }
        requestAnimationFrame(this.menuLoop.bind(this));
    }
}



function generateMainMenuLabels(headerText){

    let labels = [

        new Label(
            headerText, 
            new Vector2(100,0),
            Vector2.zero,
            "white",
            "left",
            "Bookman",
            "100px"
        ),
        new Label(
            "© 2018 Chen Shmilovich", 
            new Vector2(1250,700),
            Vector2.zero,
            "white",
            "left",
            "Bookman",
            "20px"
        )
    ];


    return labels;
}


function generateMainMenuButtons(inGame){



    let buttons = [];

    let dev = 0;

    if(inGame){
        dev = 200;
        buttons.push(
            new Button
                (
                    // CONTINUE BUTTON
                    sprites.continueButton, 
                    new Vector2(200,200),
                    function(){
                        Game.mainMenu.active = false;
                        GAME_STOPPED = false;
                        setTimeout(Game.continueGame,200);
                        sounds.fadeOut(Game.mainMenu.sound);
                    },
                    sprites.continueButtonHover
                )
        )
    }

    let muteSprite = sprites.muteButton;
    let muteSpriteHover = sprites.muteButtonHover;

    if(Game.mainMenu.sound && Game.mainMenu.sound.volume === 0){
        muteSprite = sprites.muteButtonPressed;
        muteSpriteHover = sprites.muteButtonPressedHover;
    }


    let muteButton = new Button
    (
        // MUTE BUTTON
        muteSprite, 
        new Vector2(1430,10),
        function(){
            if(Game.mainMenu.sound.volume == 0){
                SOUND_ON = true;
                Game.mainMenu.sound.volume = 0.8;
                this.sprite = sprites.muteButton;
                this.hoverSprite = sprites.muteButtonHover;
            }
            else{
                SOUND_ON = false;
                Game.mainMenu.sound.volume = 0.0;
                this.sprite = sprites.muteButtonPressed;
                this.hoverSprite = sprites.muteButtonPressedHover;
            }
        },
        muteSpriteHover
    );

    let backButton = new Button
    (
        //BACK
        sprites.backButton, 
        new Vector2(100,150),
        function(){
            Game.mainMenu.labels = generateMainMenuLabels("Classic 8-Ball");
            Game.mainMenu.buttons = generateMainMenuButtons(inGame);
        },
        sprites.backButtonHover
    );

    buttons = buttons.concat([
        new Button
        (
            // PLAYER vs PLAYER
            sprites.twoPlayersButton, 
            new Vector2(200,dev+200),
            function(){
                AI_ON = false;
                Game.mainMenu.active = false;
                GAME_STOPPED = false;
                setTimeout(Game.startNewGame,200);
                sounds.fadeOut(Game.mainMenu.sound);
            },
            sprites.twoPlayersButtonHover
        ),
        new Button
        (
            // PLAYER vs COMPUTER
            sprites.onePlayersButton, 
            new Vector2(200,dev+400),
            function(){
                Game.mainMenu.labels = generateMainMenuLabels("Choose Difficulty");

                Mouse.reset();
                Game.mainMenu.buttons = [
                    new Button
                    (
                        //EASY
                        sprites.easyButton, 
                        new Vector2(200,150),
                        function(){
                            AI_PLAYER_NUM = 1;
                            AI_ON = true;
                            TRAIN_ITER = 30;
                            Game.mainMenu.active = false;
                            GAME_STOPPED = false;
                            setTimeout(Game.startNewGame,200);
                            sounds.fadeOut(Game.mainMenu.sound);
                        },
                        sprites.easyButtonHover
                    ),
                    new Button
                    (
                        //MEDIUM
                        sprites.mediumButton, 
                        new Vector2(200,300),
                        function(){
                            AI_PLAYER_NUM = 1;
                            AI_ON = true;
                            TRAIN_ITER = 50;
                            Game.mainMenu.active = false;
                            GAME_STOPPED = false;
                            setTimeout(Game.startNewGame,200);
                            sounds.fadeOut(Game.mainMenu.sound);
                        },
                        sprites.mediumButtonHover
                    ),
                    new Button
                    (
                        //HARD
                        sprites.hardButton, 
                        new Vector2(200,450),
                        function(){
                            AI_PLAYER_NUM = 1;
                            AI_ON = true;
                            TRAIN_ITER = 100;
                            Game.mainMenu.active = false;
                            GAME_STOPPED = false;
                            setTimeout(Game.startNewGame,200);
                            sounds.fadeOut(Game.mainMenu.sound);
                        },
                        sprites.hardButtonHover
                    ),
                    new Button
                    (
                        //INSANE
                        sprites.insaneButton, 
                        new Vector2(200,600),
                        function(){
                            AI_PLAYER_NUM = 0;
                            AI_ON = true;
                            TRAIN_ITER = 700;
                            Game.mainMenu.active = false;
                            GAME_STOPPED = false;
                            setTimeout(Game.startNewGame,200);
                            sounds.fadeOut(Game.mainMenu.sound);
                        },
                        sprites.insaneButtonHover
                    ),
                    muteButton,
                    backButton

                ];
            },
            sprites.onePlayersButtonHover
        ),
        muteButton
    ]);

    return buttons;
}
function Opponent(power, rotation){
    this.power = power || (Math.random() * 75 + 1);
    this.rotation = rotation || (Math.random()*6.283)-3.141;
    this.evaluation = 0;
}
function AIPolicy(){
    
}

AIPolicy.prototype.evaluate = function(state, gamePolicy){

    let evaluation = 1;

    for (var i = 0 ; i < state.balls.length; i++){
        for(var j = i + 1 ; j < state.balls.length ; j++){

            let firstBall = state.balls[i];
            let secondBall = state.balls[j];

            if(firstBall === state.whiteBall || secondBall === state.whiteBall 
                || 
                firstBall.inHole || secondBall.inHole){
                continue;
            }
            evaluation += firstBall.position.distanceFrom(secondBall.position);
        }
    }

    evaluation = evaluation/5800;

    if(!gamePolicy.firstCollision){
        evaluation+= 100;
    }

    evaluation += 2000 * gamePolicy.validBallsInsertedOnTurn;

    gamePolicy.updateTurnOutcome();


    if(gamePolicy.won){
        if(!gamePolicy.foul){
            evaluation += 10000;
        }
        else{
            evaluation -= 10000;
        }
    }

    if(gamePolicy.foul){
        evaluation = evaluation - 3000;
    }

    return evaluation;
}
function AITrainer(){

    this.AIPolicy = new AIPolicy();

}

AITrainer.prototype.init = function(state, gamePolicy){

    AI.opponents = [];
    AI.currentOpponent = new Opponent();
    AI.finishedSession = true;
    AI.iteration = 0;

    AI.bestOpponentIndex = 0;
    AI.bestOpponentEval = 0;

    if(gamePolicy.foul){
        //TO DO: Pick best position for the white ball.
        state.whiteBall.position.x = 413;
        state.whiteBall.position.y = 413;
        state.whiteBall.inHole = false;
        gamePolicy.foul = false;
    }
    AI.initialState = JSON.parse(JSON.stringify(state));
    AI.initialGamePolicyState = JSON.parse(JSON.stringify(gamePolicy));

    AI.state = state;
    AI.gamePolicy = gamePolicy;

}

AITrainer.prototype.train = function(){

    if(AI.iteration === TRAIN_ITER){
        AI.finishedSession = true;
        AI.playTurn();
        return;
    }

    let ballsMoving = AI.state.ballsMoving();

    if(!ballsMoving){

        if(AI.iteration !== 0){
            AI.currentOpponent.evaluation = AI.AIPolicy.evaluate(this.state, this.gamePolicy);

            AI.opponents.push(JSON.parse(JSON.stringify(AI.currentOpponent)));

            if(AI.currentOpponent.evaluation > AI.bestOpponentEval){
                AI.bestOpponentEval = AI.currentOpponent.evaluation;
                AI.bestOpponentIndex =  AI.opponents.length - 1;
            }

            if(LOG){
                console.log('-------------'+new Number(AI.iteration+1)+'--------------------');
                console.log('Current evaluation: ' + AI.currentOpponent.evaluation);
                console.log('Current power: ' + AI.currentOpponent.power);
                console.log('Current rotation: ' + AI.currentOpponent.rotation);
                console.log('---------------------------------');
            }
        }

        AI.state.initiateState(AI.initialState.balls);
        AI.gamePolicy.initiateState(AI.initialGamePolicyState);
        AI.buildNewOpponent();
        AI.simulate();
    }

}

AITrainer.prototype.buildNewOpponent = function(){

    if(AI.iteration % 10 === 0){
        AI.currentOpponent = new Opponent();
        AI.iteration++;
        return;
    }

    let bestOpponent = AI.opponents[AI.bestOpponentIndex];

    let newPower = bestOpponent.power;
    newPower += + ((Math.random() * 30) - 15);
    newPower = newPower < 20 ? 20 : newPower;
    newPower = newPower > 75 ? 75 : newPower;

    let newRotation = bestOpponent.rotation;

    if(bestOpponent.evaluation > 0){
        newRotation += (1/bestOpponent.evaluation)*(Math.random() * 2 * Math.PI - Math.PI)
    }
    else{
        newRotation = (Math.random() * 2 * Math.PI - Math.PI);
    }

    AI.currentOpponent = new Opponent(newPower,newRotation);

    AI.iteration++;

}

AITrainer.prototype.simulate = function(){
    AI.state.stick.shoot(AI.currentOpponent.power, AI.currentOpponent.rotation);
}

AITrainer.prototype.playTurn = function(){

    bestOpponent = AI.opponents[AI.bestOpponentIndex];
    Game.gameWorld.stick.rotation = bestOpponent.rotation;
    Game.gameWorld.stick.trackMouse = false;

    setTimeout(() => {

        Game.gameWorld.stick.visible = true;
        Canvas2D.clear();
        Game.gameWorld.draw();

        Game.sound = true;
        Game.gameWorld.initiateState(AI.initialState.balls);
        Game.policy.initiateState(AI.initialGamePolicyState);

        DISPLAY = true;
        
        requestAnimationFrame(Game.mainLoop);

        Game.gameWorld.stick
        .shoot(
            bestOpponent.power, 
            bestOpponent.rotation
        );
        Game.gameWorld.stick.trackMouse = true;

    }, 1000);
}

AITrainer.prototype.opponentTrainingLoop = function(){

    Game.sound = false;
    DISPLAY = false;

    if(DISPLAY_TRAINING){
        if(!AI.finishedSession){
            AI.train();
            Game.gameWorld.handleInput(DELTA);
            Game.gameWorld.update(DELTA);
            Canvas2D.clear();
            Game.gameWorld.draw();
            Mouse.reset();
            setTimeout(AI.opponentTrainingLoop,0.00000000001);
        }
    }
    else{
        while(!AI.finishedSession){
            AI.train();
            Game.gameWorld.handleInput(DELTA);
            Game.gameWorld.update(DELTA);
            Mouse.reset();
        }
    }

}

AITrainer.prototype.startSession = function(){
    AI.finishedSession = false;

    setTimeout(() => {
        var wb = Game.gameWorld.whiteBall;
        if (!wb || wb.inHole) {
            AI.finishedSession = true;
            return;
        }

        var turn = Game.policy.turn;
        var currentColor = Game.policy.players[turn].color;
        var pockets = [
            new Vector2(62, 62), new Vector2(750, 32), new Vector2(1435, 62),
            new Vector2(62, 762), new Vector2(750, 794), new Vector2(1435, 762)
        ];

        var bestAngle = Math.random() * Math.PI * 2;
        var bestPower = 40;
        var bestScore = -1;

        var balls = Game.gameWorld.balls;
        for (var bi = 0; bi < balls.length; bi++) {
            var ball = balls[bi];
            if (ball.inHole || !ball.visible) continue;
            
            // Filter target balls
            var isTarget = false;
            if (currentColor) {
                isTarget = (ball.color === currentColor);
                if (!isTarget && ball.color === Color.black) {
                    var ownLeft = balls.filter(b => !b.inHole && b.color === currentColor).length;
                    if (ownLeft === 0) isTarget = true;
                }
            } else {
                isTarget = (ball.color !== Color.white && ball.color !== Color.black);
            }
            if (!isTarget) continue;

            for (var pi = 0; pi < pockets.length; pi++) {
                var pocket = pockets[pi];
                var btpX = pocket.x - ball.position.x;
                var btpY = pocket.y - ball.position.y;
                var btpLen = Math.sqrt(btpX*btpX + btpY*btpY);
                if (btpLen < 1) continue;

                var unitX = btpX / btpLen;
                var unitY = btpY / btpLen;
                var aimX = ball.position.x - unitX * 48.5;
                var aimY = ball.position.y - unitY * 48.5;

                var cbtX = aimX - wb.position.x;
                var cbtY = aimY - wb.position.y;
                var cbtLen = Math.sqrt(cbtX*cbtX + cbtY*cbtY);
                if (cbtLen < 1) continue;

                // High score for straight shots and closeness to pocket
                var dot = (cbtX * btpX + cbtY * btpY) / (cbtLen * btpLen);
                if (dot < 0.2) continue; // Skip cut shots > 78 degrees

                var shotScore = (1200 / (btpLen + 30)) + (300 / (cbtLen + 100));
                shotScore *= Math.pow(dot, 3); // Weight straightness heavily

                // Path blockage check (simple)
                var blocked = false;
                for (var oi = 0; oi < balls.length; oi++) {
                    if (oi === bi || balls[oi].inHole || !balls[oi].visible || balls[oi].color === Color.white) continue;
                    var obX = balls[oi].position.x - wb.position.x;
                    var obY = balls[oi].position.y - wb.position.y;
                    var proj = (obX * cbtX + obY * cbtY) / (cbtLen * cbtLen);
                    if (proj > 0.1 && proj < 0.9) {
                        var perpX = obX - proj * cbtX;
                        var perpY = obY - proj * cbtY;
                        if (Math.sqrt(perpX*perpX + perpY*perpY) < 45) { blocked = true; break; }
                    }
                }
                if (blocked) shotScore *= 0.1;

                if (shotScore > bestScore) {
                    bestScore = shotScore;
                    bestAngle = Math.atan2(cbtY, cbtX);
                    bestPower = Math.min(68, 22 + btpLen * 0.05 + cbtLen * 0.1);
                    bestAngle += (Math.random() - 0.5) * 0.012; // Slight spread for realism
                }
            }
        }

        Game.gameWorld.stick.shoot(bestPower, bestAngle);
        AI.finishedSession = true;
    }, 1100);
}

const AI = new AITrainer();

function Player(matchScore, totalScore){
    this.color = undefined;
    this.matchScore = matchScore;
    this.totalScore = totalScore;
}

function GamePolicy(){

    this.turn = 0;
    this.firstCollision = true;
    let player1TotalScore = new Score(new Vector2(Game.size.x/2 - 75,Game.size.y/2 - 45));
    let player2TotalScore = new Score(new Vector2(Game.size.x/2 + 75,Game.size.y/2 - 45));

    let player1MatchScore = new Score(new Vector2(Game.size.x/2 - 280,108));
    let player2MatchScore = new Score(new Vector2(Game.size.x/2 + 230,108));

    this.players = [new Player(player1MatchScore,player1TotalScore), new Player(player2MatchScore,player2TotalScore)];
    this.foul = false;
    this.scored = false;
    this.won = false;
    this.turnPlayed = false;
    this.validBallsInsertedOnTurn = 0;

    this.leftBorderX = BORDER_SIZE;
    this.rightBorderX = Game.size.x - BORDER_SIZE;
    this.topBorderY = BORDER_SIZE;
    this.bottomBorderY = Game.size.y - BORDER_SIZE;

    this.topCenterHolePos = new Vector2(750,32);
    this.bottomCenterHolePos = new Vector2(750,794);
    this.topLeftHolePos = new Vector2(62,62);
    this.topRightHolePos = new Vector2(1435,62);
    this.bottomLeftHolePos = new Vector2(62,762)
    this.bottomRightHolePos = new Vector2(1435,762);
}

GamePolicy.prototype.reset = function(){
    this.turn = 0;
    this.players[0].matchScore.value = 0;
    this.players[0].color = undefined;
    this.players[1].matchScore.value = 0;
    this.players[1].color = undefined;
    this.foul = false;
    this.scored = false;
    this.turnPlayed = false;
    this.won = false;
    this.firstCollision = true;
    this.validBallsInsertedOnTurn = 0;
}
GamePolicy.prototype.drawScores = function(){
    // Delegate rendering to HTML HUD overlay — see index.html #poolHUD
    if(typeof updatePoolHUD === 'function') updatePoolHUD(this);
};

GamePolicy.prototype.checkColisionValidity = function(ball1,ball2){

    let currentPlayerColor = this.players[this.turn].color;

    if(this.players[this.turn].matchScore.value == 7 &&
       (ball1.color == Color.black || ball2.color == Color.black)){
        this.firstCollision = false;
        return;
       }

    if(!this.firstCollision)
        return;

    if(currentPlayerColor == undefined){
        this.firstCollision = false;
        return;
    }

    if(ball1.color == Color.white){
        if(ball2.color != currentPlayerColor){
            this.foul = true;
        }
        this.firstCollision = false;
    }

    if(ball2.color == Color.white){
        if(ball1.color != currentPlayerColor){
            this.foul = true;
        }
        this.firstCollision = false;
    }
}
GamePolicy.prototype.handleBallInHole = function(ball){

    setTimeout(function(){ball.out();}, 100);

    let currentPlayer = this.players[this.turn];
    let secondPlayer = this.players[(this.turn+1)%2];

    if(currentPlayer.color == undefined){
        if(ball.color === Color.red){
            currentPlayer.color = Color.red;
            secondPlayer.color = Color.yellow;
        }
        else if(ball.color === Color.yellow){
            currentPlayer.color = Color.yellow;
            secondPlayer.color = Color.red;
        }
        else if(ball.color === Color.black){
            this.won = true; 
            this.foul = true;
        }
        else if(ball.color === Color.white){
            this.foul = true;
        }
    }

    if(currentPlayer.color === ball.color){
        currentPlayer.matchScore.increment();
        this.scored = true;
        this.validBallsInsertedOnTurn++;
    }
    else if(ball.color === Color.white){

        if(currentPlayer.color != undefined){
            this.foul = true;

            let ballsSet = Game.gameWorld.getBallsSetByColor(currentPlayer.color);

            let allBallsInHole = true;

            for (var i = 0 ; i < ballsSet.length; i++){
                if(!ballsSet[i].inHole){
                    allBallsInHole = false;
                }
            }

            if(allBallsInHole){
                this.won = true;
            }
        }
    }
    else if(ball.color === Color.black){

        if(currentPlayer.color != undefined){
            let ballsSet = Game.gameWorld.getBallsSetByColor(currentPlayer.color);

            for (var i = 0 ; i < ballsSet.length; i++){
                if(!ballsSet[i].inHole){
                    this.foul = true;
                }
            }
            
            this.won = true;
        }
    }
    else{
        secondPlayer.matchScore.increment();
        this.foul = true;
    }
}

GamePolicy.prototype.switchTurns = function(){
    this.turn++;
    this.turn%=2;
}

GamePolicy.prototype.updateTurnOutcome = function(){
    
    if(!this.turnPlayed){
        return;
    }

    if(this.firstCollision == true){
        this.foul = true;
    }

    if(this.won){
        
        if(!this.foul){
            this.players[this.turn].totalScore.increment();
            if(AI.finishedSession){
                // Removed auto-reset to let the Win Popup handle the UI interaction
                // this.reset()
                // setTimeout(function(){Game.gameWorld.reset();
                // }, 1000);
            }
        }
        else{
            this.players[(this.turn+1)%2].totalScore.increment();
            if(AI.finishedSession){
                // Removed auto-reset to let the Win Popup handle the UI interaction
                // this.reset();
                // setTimeout(function(){Game.gameWorld.reset();
                // }, 1000);
            }
        }
        return;
    }

    if(!this.scored || this.foul)
        this.switchTurns();

    if(this.foul) {
        Game.gameWorld.whiteBall.position = Game.gameWorld.whiteBallStartingPosition.copy();
        Game.gameWorld.whiteBall.inHole = false;
        if(Game.gameWorld.stick) {
            Game.gameWorld.stick.position = Game.gameWorld.whiteBall.position.copy();
            Game.gameWorld.stick.visible = true;
        }
    }

    this.foul = false;
    this.scored = false;
    this.turnPlayed = false;
    this.firstCollision = true;
    this.validBallsInsertedOnTurn = 0;

    setTimeout(function(){Game.gameWorld.whiteBall.visible=true;}, 50);

    if(AI_ON && this.turn === AI_PLAYER_NUM && AI.finishedSession){
        AI.startSession();
    }
}

GamePolicy.prototype.handleFoul = function(){

    if(!Mouse.left.down){
        Game.gameWorld.whiteBall.position = Mouse.position;
    }

}
GamePolicy.prototype.isXOutsideLeftBorder = function(pos, origin){
    return (pos.x - origin.x) < this.leftBorderX;
}
GamePolicy.prototype.isXOutsideRightBorder = function(pos, origin){
    return (pos.x + origin.x) > this.rightBorderX;
}
GamePolicy.prototype.isYOutsideTopBorder = function(pos, origin){
    return (pos.y - origin.y) < this.topBorderY;
}
GamePolicy.prototype.isYOutsideBottomBorder = function(pos , origin){
    return (pos.y + origin.y) > this.bottomBorderY;
}

GamePolicy.prototype.isOutsideBorder = function(pos,origin){
    return this.isXOutsideLeftBorder(pos,origin) || this.isXOutsideRightBorder(pos,origin) || 
    this.isYOutsideTopBorder(pos, origin) || this.isYOutsideBottomBorder(pos , origin);
}

GamePolicy.prototype.isInsideTopLeftHole = function(pos){
    return this.topLeftHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideTopRightHole = function(pos){
    return this.topRightHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideBottomLeftHole = function(pos){
    return this.bottomLeftHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideBottomRightHole = function(pos){
    return this.bottomRightHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideTopCenterHole = function(pos){
    return this.topCenterHolePos.distanceFrom(pos) < (HOLE_RADIUS + 6);
}

GamePolicy.prototype.isInsideBottomCenterHole = function(pos){
    return this.bottomCenterHolePos.distanceFrom(pos) < (HOLE_RADIUS + 6);
}

GamePolicy.prototype.isInsideHole = function(pos){
    return this.isInsideTopLeftHole(pos) || this.isInsideTopRightHole(pos) || 
           this.isInsideBottomLeftHole(pos) || this.isInsideBottomRightHole(pos) ||
           this.isInsideTopCenterHole(pos) || this.isInsideBottomCenterHole(pos);
}

GamePolicy.prototype.initiateState = function(policyState){

    this.turn = policyState.turn;
    this.firstCollision = policyState.firstCollision;
    this.foul = policyState.foul;
    this.scored = policyState.scored;
    this.won = policyState.won;
    this.turnPlayed = policyState.turnPlayed;
    this.validBallsInsertedOnTurn = policyState.validBallsInsertedOnTurn;

    this.players[0].totalScore.value = policyState.players[0].totalScore.value;
    this.players[1].totalScore.value = policyState.players[1].totalScore.value;

    this.players[0].matchScore.value = policyState.players[0].matchScore.value;
    this.players[0].color = policyState.players[0].color;
    this.players[1].matchScore.value = policyState.players[1].matchScore.value;
    this.players[1].color = policyState.players[1].color;

}
"use strict";

function GameWorld() {

    this.whiteBallStartingPosition = new Vector2(413,413);

    this.redBalls = [
    new Ball(new Vector2(1056,433),Color.red),//3
    new Ball(new Vector2(1090,374),Color.red),//4
    new Ball(new Vector2(1126,393),Color.red),//8
    new Ball(new Vector2(1126,472),Color.red),//10;
    new Ball(new Vector2(1162,335),Color.red),//11
    new Ball(new Vector2(1162,374),Color.red),//12
    new Ball(new Vector2(1162,452),Color.red)//14
    ]

    this.yellowBalls = [
    new Ball(new Vector2(1022,413),Color.yellow),//1
    new Ball(new Vector2(1056,393),Color.yellow),//2
    new Ball(new Vector2(1090,452),Color.yellow),//6
    new Ball(new Vector2(1126,354),Color.yellow),//7
    new Ball(new Vector2(1126,433),Color.yellow),//9
    new Ball(new Vector2(1162,413),Color.yellow),//13
    new Ball(new Vector2(1162,491),Color.yellow)//15
    ];

    this.whiteBall = new Ball(new Vector2(413,413),Color.white);
    this.blackBall = new Ball(new Vector2(1090,413),Color.black);

    this.balls = [
    this.yellowBalls[0],
    this.yellowBalls[1],
    this.redBalls[0],
    this.redBalls[1],
    this.blackBall,
    this.yellowBalls[2],
    this.yellowBalls[3],
    this.redBalls[2],
    this.yellowBalls[4],
    this.redBalls[3],
    this.redBalls[4],
    this.redBalls[5],
    this.yellowBalls[5],
    this.redBalls[6],
    this.yellowBalls[6],
    this.whiteBall]

    this.stick = new Stick({ x : 413, y : 413 });

    this.gameOver = false;
}

GameWorld.prototype.getBallsSetByColor = function(color){

    if(color === Color.red){
        return this.redBalls;
    }
    if(color === Color.yellow){
        return this.yellowBalls;
    }
    if(color === Color.white){
        return this.whiteBall;
    }
    if(color === Color.black){
        return this.blackBall;
    }
}

GameWorld.prototype.handleInput = function (delta) {
    this.stick.handleInput(delta);
};

GameWorld.prototype.update = function (delta) {
    this.stick.update(delta);

    for (var i = 0 ; i < this.balls.length; i++){
        for(var j = i + 1 ; j < this.balls.length ; j++){
            this.handleCollision(this.balls[i], this.balls[j], delta);
        }
    }

    for (var i = 0 ; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }

    if(!this.ballsMoving() && AI.finishedSession){
        Game.policy.updateTurnOutcome();
        if(Game.policy.foul){
            this.ballInHand();
        }
    }

};

GameWorld.prototype.ballInHand = function(){
    if(AI_ON && Game.policy.turn === AI_PLAYER_NUM){
        return;
    }

    KEYBOARD_INPUT_ON = false;
    this.stick.visible = false;
    if(!Mouse.left.down){
        this.whiteBall.position = Mouse.position;
    }
    else{
        let ballsOverlap = this.whiteBallOverlapsBalls();

        if(!Game.policy.isOutsideBorder(Mouse.position,this.whiteBall.origin) &&
            !Game.policy.isInsideHole(Mouse.position) &&
            !ballsOverlap){
            KEYBOARD_INPUT_ON = true;
            Keyboard.reset();
            Mouse.reset();
            this.whiteBall.position = Mouse.position;
            this.whiteBall.inHole = false;
            Game.policy.foul = false;
            this.stick.position = this.whiteBall.position;
            this.stick.visible = true;
        }
    }

}

GameWorld.prototype.whiteBallOverlapsBalls = function(){

    let ballsOverlap = false;
    for (var i = 0 ; i < this.balls.length; i++) {
        if(this.whiteBall !== this.balls[i]){
            if(this.whiteBall.position.distanceFrom(this.balls[i].position)<BALL_SIZE){
                ballsOverlap = true;
            }
        }
    }

    return ballsOverlap;
}

GameWorld.prototype.ballsMoving = function(){

    var ballsMoving = false;

    for (var i = 0 ; i < this.balls.length; i++) {
        if(this.balls[i].moving){
            ballsMoving = true;
        }
    }

    return ballsMoving;
}

GameWorld.prototype.handleCollision = function(ball1, ball2, delta){

    if(ball1.inHole || ball2.inHole)
        return;

    if(!ball1.moving && !ball2.moving)
        return;

    var ball1NewPos = ball1.position.add(ball1.velocity.multiply(delta));
    var ball2NewPos = ball2.position.add(ball2.velocity.multiply(delta));

    var dist = ball1NewPos.distanceFrom(ball2NewPos);

    if(dist<BALL_SIZE){
        Game.policy.checkColisionValidity(ball1, ball2);

        var power = (Math.abs(ball1.velocity.x) + Math.abs(ball1.velocity.y)) + 
                    (Math.abs(ball2.velocity.x) + Math.abs(ball2.velocity.y));
        power = power * 0.00482;

        if(Game.sound && SOUND_ON){
            var ballsCollide = sounds.ballsCollide.cloneNode(true);
            ballsCollide.volume = (power/(20))<1?(power/(20)):1;
            ballsCollide.play();
        }

        var opposite = ball1.position.y - ball2.position.y;
        var adjacent = ball1.position.x - ball2.position.x;
        var rotation = Math.atan2(opposite, adjacent);

        ball1.moving = true;
        ball2.moving = true;

        var velocity2 = new Vector2(90*Math.cos(rotation + Math.PI)*power,90*Math.sin(rotation + Math.PI)*power);
        ball2.velocity = ball2.velocity.addTo(velocity2);

        ball2.velocity.multiplyWith(0.97);

        var velocity1 = new Vector2(90*Math.cos(rotation)*power,90*Math.sin(rotation)*power);
        ball1.velocity = ball1.velocity.addTo(velocity1);

        ball1.velocity.multiplyWith(0.97);
    }

}

GameWorld.prototype.draw = function () {
    var ctx = Canvas2D._canvasContext;
    var W = Game.size.x;
    var H = Game.size.y;
    var BORDER = 68;

    // Draw original background sprite
    Canvas2D.drawImage(sprites.background);

    // Apply a clear blue tint to the felt area only
    ctx.save();
    ctx.globalAlpha = 0.65; // High visibility shift
    ctx.fillStyle = '#062a6e'; // Deep midnight blue tint
    ctx.fillRect(BORDER + 4, BORDER + 4, W - (BORDER + 4) * 2, H - (BORDER + 4) * 2);
    ctx.restore();

    Game.policy.drawScores();

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].draw();
    }

    this.stick.draw();
};

GameWorld.prototype.reset = function () {
    this.gameOver = false;

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
    }

    this.stick.reset();

    if(AI_ON && AI_PLAYER_NUM === 0){
        AI.startSession();
    }
};

GameWorld.prototype.initiateState = function(balls){
    
    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].position.x = balls[i].position.x;
        this.balls[i].position.y = balls[i].position.y;
        this.balls[i].visible = balls[i].visible;
        this.balls[i].inHole = balls[i].inHole;
    }

    this.stick.position = this.whiteBall.position;
}


"use strict";

var requestAnimationFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

function Game_Singleton() {
    this.size = undefined;
    this.spritesStillLoading = 0;
    this.gameWorld = undefined;
    this.sound = true;

    this.mainMenu = new Menu();
}

Game_Singleton.prototype.start = function (divName, canvasName, x, y) {
    this.size = new Vector2(x,y);
    Canvas2D.initialize(divName, canvasName);
    this.loadAssets();
    this.assetLoadingLoop();
};

Game_Singleton.prototype.initialize = function () {
    this.gameWorld = new GameWorld();
    this.policy = new GamePolicy();
    AI.init(this.gameWorld, this.policy);
    Game.sound = true; // Ensure SFX are enabled by default
};

Game_Singleton.prototype.initMenus = function(inGame){

    let labels = generateMainMenuLabels("Classic 8-Ball");

    let buttons = generateMainMenuButtons(inGame);

    this.mainMenu.init
    (
        sprites.mainMenuBackground,
        labels,
        buttons,
        sounds.jazzTune
    );
}

Game_Singleton.prototype.loadSprite = function (imageName) {
    console.log("Loading sprite: " + imageName);
    var image = new Image();
    image.src = imageName;
    this.spritesStillLoading += 1;
    image.onload = function () {
        Game.spritesStillLoading -= 1;
    };
    return image;
};

Game_Singleton.prototype.assetLoadingLoop = function () {
    if (Game.spritesStillLoading > 0)
        requestAnimationFrame(Game.assetLoadingLoop);
    else {
        Game.initialize();
        // Hide loader and show HTML Menu
        var loader = document.getElementById('pmg-loader');
        if(loader) loader.classList.add('hidden');
        var modeScreen = document.getElementById('modeScreen');
        if(modeScreen) modeScreen.style.display = 'flex';
    }
};

Game_Singleton.prototype.startMode = function(isAI) {
    document.getElementById('modeScreen').style.display = 'none';
    AI_ON = isAI;
    window.POOL_AI_ON = isAI; // expose for HUD
    window.POOL_AI_NUM = 1;   // AI is always player index 1
    if(isAI) {
        AI_PLAYER_NUM = 1;
        TRAIN_ITER = 30; // Medium-easy default
    }
    if (SOUND_ON && sounds && sounds.jazzTune) {
        // Disabled background music as requested
        // sounds.jazzTune.volume = 0.5;
        // var p = sounds.jazzTune.play();
        // if(p) p.catch(function(){}); 
    }
    GAME_STOPPED = false;
    Game.startNewGame();
};

Game_Singleton.prototype.handleInput = function(){
    if(Keyboard.down(Keys.escape)){
        GAME_STOPPED = true;
        document.getElementById('modeScreen').style.display = 'flex';
    }
}

Game_Singleton.prototype.startNewGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    Game.gameWorld = new GameWorld();
    Game.policy = new GamePolicy();

    Canvas2D.clear();

    AI.init(Game.gameWorld, Game.policy);

    if(AI_ON && AI_PLAYER_NUM == 0){
        AI.startSession();
    }
    Game.mainLoop();
}

Game_Singleton.prototype.continueGame = function(){
    Canvas2D._canvas.style.cursor = "auto";

    requestAnimationFrame(Game.mainLoop);
}

Game_Singleton.prototype.mainLoop = function () {
    if(DISPLAY && !GAME_STOPPED){
        try {
            Game.gameWorld.handleInput(DELTA);
            Game.gameWorld.update(DELTA);
            Canvas2D.clear();
            Game.gameWorld.draw();
            Mouse.reset();
            Game.handleInput();
        } catch(e) {
            console.error("Main loop crash:", e);
        }
        requestAnimationFrame(Game.mainLoop);
    }
};

var Game = new Game_Singleton();
window.gameRecordTime = Date.now();


"use strict";

var sprites = {};
var sounds = {};

Game.loadAssets = function () {
    var loadSprite = function (sprite) {
        return Game.loadSprite("assets/sprites/" + sprite);
    };

     var loadSound = function (sound) {
        return new Audio("assets/sounds/" + sound);
    };

    sprites.mainMenuBackground = loadSprite("main_menu_background.png");
    sprites.background = loadSprite("spr_background4.png");
    sprites.ball = loadSprite("spr_ball2.png");
    sprites.redBall = loadSprite("spr_redBall2.png");
    sprites.yellowBall = loadSprite("spr_yellowBall2.png");
    sprites.blackBall = loadSprite("spr_blackBall2.png");
    sprites.stick = loadSprite("spr_stick.png");
    sprites.twoPlayersButton = loadSprite("2_players_button.png");
    sprites.twoPlayersButtonHover = loadSprite("2_players_button_hover.png");
    sprites.onePlayersButton = loadSprite("1_player_button.png");
    sprites.onePlayersButtonHover = loadSprite("1_player_button_hover.png");
    sprites.muteButton = loadSprite("mute_button.png");
    sprites.muteButtonHover = loadSprite("mute_button_hover.png");
    sprites.muteButtonPressed = loadSprite("mute_button_pressed.png");
    sprites.muteButtonPressedHover = loadSprite("mute_button_pressed_hover.png");
    sprites.easyButton = loadSprite("easy_button.png");
    sprites.easyButtonHover = loadSprite("easy_button_hover.png");
    sprites.mediumButton = loadSprite("medium_button.png");
    sprites.mediumButtonHover = loadSprite("medium_button_hover.png");
    sprites.hardButton = loadSprite("hard_button.png");
    sprites.hardButtonHover = loadSprite("hard_button_hover.png");
    sprites.backButton = loadSprite("back_button.png");
    sprites.backButtonHover = loadSprite("back_button_hover.png");
    sprites.continueButton = loadSprite("continue_button.png");
    sprites.continueButtonHover = loadSprite("continue_button_hover.png");
    sprites.insaneButton = loadSprite("insane_button.png");
    sprites.insaneButtonHover = loadSprite("insane_button_hover.png");
    sprites.aboutButton = loadSprite("about_button.png");
    sprites.aboutButtonHover = loadSprite("about_button_hover.png");
    sprites.controls = loadSprite("controls.png");

    sounds.side = loadSound("Side.wav");
    sounds.ballsCollide = loadSound("BallsCollide.wav");
    sounds.strike = loadSound("Strike.wav");
    sounds.hole = loadSound("Hole.wav");
    
    // Bossa Antigua Kevin MacLeod (incompetech.com)
    // Licensed under Creative Commons: By Attribution 3.0 License
    // http://creativecommons.org/licenses/by/3.0/
    sounds.jazzTune = loadSound("Bossa Antigua.mp3");
}

sounds.fadeOut = function(sound) {

    var fadeAudio = setInterval(function () {

        if(GAME_STOPPED)
            return;

        // Only fade if past the fade out point or not at zero already
        if ((sound.volume >= 0.05)) {
            sound.volume -= 0.05;
        }
        else{
            sound.pause();
            clearInterval(fadeAudio);
        }
    }, 400);
}