class GameState {
    constructor(game) {
        this.game = game;
    }
    
    enter() {
        // Called when entering this state
    }
    
    exit() {
        // Called when exiting this state
    }
    
    update(deltaTime) {
        // Override in subclasses
    }
    
    render(ctx) {
        // Override in subclasses
    }
    
    handleInput(keys) {
        // Override in subclasses
    }
}

class NetworkManager {
    constructor( url) {
        this.url = url;
    }
    
    connect() {
        this.socket = new WebSocket(this.url);
    }
    
    disconnect() {
        this.socket.close();
    }
}

  class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Minimal zzfx generator for compact sound effects
    zzfx(...p) {
        let S = Math,
            R = 44100,
            x = S.PI * 2,
            t = p[2] * (1 + p[1] * (2 * S.random() - 1)),
            e = p[3] * R,
            a = p[4] * R,
            n = p[5] * R,
            i = p[6],
            o = [],
            A = 0;

        for (let c = 0; c < e + a + n; c++) {
            let s = c < e ? c / e : c < e + a ? 1 - (c - e) / a : 0;
            A += t * S.cos(i * c / R);
            o[c] = s * S.sin(A / R * x);
            t += p[7];
        }

        const B = this.context.createBuffer(1, o.length, R);
        B.getChannelData(0).set(o);
        const source = this.context.createBufferSource();
        source.buffer = B;
        source.connect(this.context.destination);
        source.start();
    }

    // Converts SFXR-like JSON to zzfx params
    playSound(params) {
        const soundParams = [
            params.v || 0.5,          // Volume
            0,                                // Randomness
            (params.f || 0.5) * 2000, // Base frequency
            params.a || 0.01,      // Attack
            params.s || 0.1,      // Sustain
            params.d || 0.2,        // Decay
            0,                                // Phase offset
            params.r || 0           // Frequency ramp
        ];
        this.zzfx(...soundParams);
    }
}

const audioManager = new AudioManager();

// add SOuNDBANK here

// Static utility functions for common rendering tasks
class RU {
    static f48 = '48px monospace';
    static f24 = '24px monospace';
    static f16 = '16px monospace';
    static f20 = '20px monospace';
    
    static function lerp(start, end, t) {
        return start + (end - start) * t;
    }

}

// Main Game class with state management
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // State management
        this.states = {};
        this.currentState = null;
        this.previousStateName = null; // Simple tracking of where we came from
        
        // Game data (shared across states)
        this.gameData = {
            score: 0,
            lives: 3,
            level: 1,
            highScore: 0,
            metal: 0, // Metal collected from asteroids
            shopVisited: false, // Track if shop has been visited
            turboMultiplier: 1 // Global speed multiplier for turbo effect
        };
        
        // Game objects (for gameplay state)
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        this.particles = [];
        this.metal = [];
        this.proximityBombs = [];
        
        this.keys = {};
        this.keys['StartPressed'] = false; // Initialize StartPressed flag
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.starSpawnTimer = 0;
        
        // Controller support
        this.controllers = [];
        this.controllerConnected = false;
        
       
        
        // Screen shake system
        this.screenShake = {
            intensity: 0,
            duration: 0,
            maxIntensity: 100, // Increased from 10 to allow much bigger shakes
            decayRate: 0.9    // Slower decay for longer-lasting shakes
        };
        
        this.init();
    }
    
    init() {
        this.setupStates();
        this.bindEvents();
        this.checkExistingControllers();
        this.changeState('menu');
        this.gameLoop();
    }
    
    checkExistingControllers() {
        // Check if any controllers are already connected
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0];
        if (!gamepad) return;
        
        this.controllers[0] = gamepad;
        this.controllerConnected = true;
        
        // Store initial button states for existing controllers too
        this.initialButtonStates = {};
        for (let j = 0; j < gamepad.buttons.length; j++) {
            this.initialButtonStates[j] = gamepad.buttons[j]?.pressed || false;
        }
        
    }
    
    setupStates() {
        // Create all game states
        this.states = {
            menu: new MenuState(this),
            gameplay: new GameplayState(this),
            pause: new PauseState(this),
            gameOver: new GameOverState(this),
            win: new WinState(this),
            highscore: new HighScoreState(this),
            shop: new ShopState(this)
        };
    }
    
    changeState(stateName) {
        if (this.currentState) {
            this.currentState.exit();
            // Store the current state name as previous
            for (let [name, state] of Object.entries(this.states)) {
                if (state === this.currentState) {
                    this.previousStateName = name;
                    break;
                }
            }
        }
        
        this.currentState = this.states[stateName];
        if (this.currentState) {
            this.currentState.enter();
        } else {
            console.error('Failed to change state to:', stateName);
        }
    }
    
    goBack() {
        // Hard-coded navigation based on current state
        if (this.currentState === this.states.shop) {
            this.changeState('gameplay'); // Shop always goes back to gameplay
        } else if (this.currentState === this.states.pause) {
            this.changeState('gameplay'); // Pause goes back to gameplay
        }
        // If we're in gameplay or menu, goBack does nothing
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Global key handling
            if (e.code === 'Escape') {
                if (this.currentState === this.states.gameplay) {
                    this.changeState('pause');
                } else if (this.currentState === this.states.pause) {
                    this.changeState('gameplay');
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Controller support
        window.addEventListener('gamepadconnected', (e) => {
            this.controllers[e.gamepad.index] = e.gamepad;
            this.controllerConnected = true;
            
            // Store initial button states to detect stuck buttons
            this.initialButtonStates = {};
            for (let i = 0; i < e.gamepad.buttons.length; i++) {
                this.initialButtonStates[i] = e.gamepad.buttons[i]?.pressed || false;
            }
            

        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            delete this.controllers[e.gamepad.index];
            this.controllerConnected = Object.keys(this.controllers).length > 0;
        });
    }
    
    update(deltaTime) {
        // Update controller input
        this.updateControllerInput();
        
        if (this.currentState) {
            this.currentState.update(deltaTime);
            this.currentState.handleInput(this.keys);
        }
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
    }
    
    updateControllerInput() {
    // Initial button states stored: {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false, 10: false, 11: false, 12: false, 13: true, 14: false, 15: false, 16: false}updateControllerInput() {
        // Get the current gamepad state (required for fresh input data)
        const gamepads = navigator.getGamepads();
        let controller = gamepads[0];

        // find controller
        for (let i = 0; i < gamepads.length; i++) {
            controller = gamepads[i];
            if (controller) {
                break;
            }
        }
        
        
        
        if (!controller) {
            
            return;
        }
        
        // Update our stored controller reference
        this.controllers[0] = controller;
        
        // Reset ALL controller-mapped keys to false first (assume no movement/action)
        this.keys['ControllerSpace'] = false;
        this.keys['ControllerQ'] = false;
        this.keys['ControllerShift'] = false;
        this.keys['ControllerC'] = false;
        
        // Reset movement keys to false (assume no movement)
        this.keys['ArrowUp'] = false;
        this.keys['ArrowDown'] = false;
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
        
        // Reset controller-mapped regular keys to false
        this.keys['Space'] = false;
        this.keys['Escape'] = false;
        // Note: StartPressed is NOT reset here - it's handled in the button logic below
        
        // Map controller buttons to controller-specific keys
        if (controller.buttons[0] && controller.buttons[0].pressed) { // A button
            this.keys['ControllerSpace'] = true; // Fire laser
            this.keys['Space'] = true; // Also for menu selection
        }
        
        if (controller.buttons[1] && controller.buttons[1].pressed) { // B button
            this.keys['ControllerQ'] = true; // Fire rocket
        }
        
        if (controller.buttons[2] && controller.buttons[2].pressed) { // X button
            this.keys['ControllerShift'] = true; // Turbo
        }
        
        if (controller.buttons[3] && controller.buttons[3].pressed) { // Y button
            this.keys['ControllerC'] = true; // Cloak
        }
        
        // Select button (button 8) - no longer used for pause
        // if (controller.buttons[8] && controller.buttons[8].pressed) { // Select button
        //     // Removed pause functionality - now only Start button (button 9) pauses
        // }
        
        // Start button (button 9) for pause/menu
        if (controller.buttons[9] && controller.buttons[9].pressed) { // Start button
            if (!this.keys['StartPressed']) { // Prevent multiple triggers
                this.keys['StartPressed'] = true;
                
                // Handle pause/resume based on current state
                if (this.currentState === this.states.gameplay) {
                    this.changeState('pause');
                } else if (this.currentState === this.states.pause) {
                    this.changeState('gameplay');
                }
            }
        } else {
            if (this.keys['StartPressed']) {
                this.keys['StartPressed'] = false;
            }
        }
        
        // D-pad and analog stick movement
        const leftStickX = controller.axes[0];
        const leftStickY = controller.axes[1];
        
        // Map analog stick to movement (with deadzone) - map to actual arrow keys
        const deadzone = 0.1;
        if (Math.abs(leftStickX) > deadzone) {
            if (leftStickX > 0) {
                this.keys['ArrowRight'] = true;
            } else {
                this.keys['ArrowLeft'] = true;
            }
        }
        
        if (Math.abs(leftStickY) > deadzone) {
            if (leftStickY > 0) {
                this.keys['ArrowDown'] = true;
            } else {
                this.keys['ArrowUp'] = true;
            }
        }
        
        // D-pad support (alternative movement) - map to actual arrow keys
        // Simplified D-pad handling - just check if buttons are pressed
        if (controller.buttons[12] && controller.buttons[12].pressed) { // D-pad up
            this.keys['ArrowUp'] = true;
        }
        if (controller.buttons[13] && controller.buttons[13].pressed) { // D-pad down
            this.keys['ArrowDown'] = true;
        }
        if (controller.buttons[14] && controller.buttons[14].pressed) { // D-pad left
            this.keys['ArrowLeft'] = true;
        }
        if (controller.buttons[15] && controller.buttons[15].pressed) { // D-pad right
            this.keys['ArrowRight'] = true;
        }
        
    }
    
    triggerScreenShake(intensity = 100, duration = 400) {
        this.screenShake.intensity = Math.min(intensity, this.screenShake.maxIntensity);
        this.screenShake.duration = duration;
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.intensity *= this.screenShake.decayRate;
            
            // Stop shake completely when intensity gets very low or duration expires
            if (this.screenShake.intensity < 0.5 || this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
                this.screenShake.duration = 0;
            }
        }
    }
    
    getScreenShakeOffset() {
        if (this.screenShake.intensity <= 0) return { x: 0, y: 0 };
        
        return {
            x: (Math.random() - 0.5) * 4 * this.screenShake.intensity, // Double the range for bigger shake
            y: (Math.random() - 0.5) * 4 * this.screenShake.intensity  // Double the range for bigger shake
        };
    }
    
    render() {
        // Apply screen shake offset
        const shakeOffset = this.getScreenShakeOffset();
        this.ctx.save();
        this.ctx.translate(shakeOffset.x, shakeOffset.y);
        
        if (this.currentState) {
            this.currentState.render(this.ctx);
        }
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    simpleNoise(x) {
        // Simple pseudo-random noise function using trigonometric approach
        return Math.sin(x * 12.9898) * Math.cos(x * 78.233) * 43758.5453 % 1;
    }
}