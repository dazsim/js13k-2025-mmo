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

// New game connection states
class GameConnectionState extends GameState {
    constructor(game) {
        super(game);
        this.connectionType = null; // 'new', 'load', 'join'
        this.worldData = null;
        this.characterData = null;
    }
    
    enter() {
        this.showConnectionOptions();
    }
    
    showConnectionOptions() {
        // This will be implemented in the UI
        console.log('Showing connection options');
    }
    
    render(ctx) {
        // Render connection options UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('GAME CONNECTION', this.game.width / 2, 150);
        
        ctx.font = RU.f24;
        ctx.fillText('Press N for New Game', this.game.width / 2, 250);
        ctx.fillText('Press L to Load Game', this.game.width / 2, 300);
        ctx.fillText('Press J to Join Public Game', this.game.width / 2, 350);
        ctx.fillText('Press ESC to go back', this.game.width / 2, 400);
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('menu');
        } else if (keys['KeyN']) {
            this.game.changeState('newGame');
        } else if (keys['KeyL']) {
            this.game.changeState('loadGame');
        } else if (keys['KeyJ']) {
            this.game.changeState('joinGame');
        }
    }
}

class NewGameState extends GameState {
    constructor(game) {
        super(game);
        this.step = 'worldSetup'; // 'worldSetup', 'characterCreation', 'hosting'
        this.worldConfig = {
            name: '',
            seed: Math.floor(Math.random() * 1000000),
            maxPlayers: 4,
            isPublic: false
        };
        this.characterConfig = {
            name: '',
            class: 'warrior', // warrior, mage, archer
            appearance: {}
        };
    }
    
    enter() {
        this.step = 'worldSetup';
        this.showWorldSetup();
    }
    
    showWorldSetup() {
        // Show world configuration UI
        console.log('World setup step');
    }
    
    render(ctx) {
        // Render world setup UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('NEW GAME SETUP', this.game.width / 2, 150);
        
        ctx.font = RU.f24;
        ctx.fillText(`World Name: ${this.worldConfig.name || 'Enter name...'}`, this.game.width / 2, 250);
        ctx.fillText(`Seed: ${this.worldConfig.seed}`, this.game.width / 2, 300);
        ctx.fillText(`Max Players: ${this.worldConfig.maxPlayers} (Use ↑↓ arrows)`, this.game.width / 2, 350);
        ctx.fillText(`Public: ${this.worldConfig.isPublic ? 'Yes' : 'No'} (Press P to toggle)`, this.game.width / 2, 400);
        
        ctx.font = RU.f20;
        ctx.fillText('Press ENTER to create world', this.game.width / 2, 500);
        ctx.fillText('Press ESC to go back', this.game.width / 2, 550);
        ctx.fillText('Press P to toggle public/private', this.game.width / 2, 600);
        ctx.fillText('Type to enter world name', this.game.width / 2, 650);
    }
    
    showCharacterCreation() {
        this.step = 'characterCreation';
        console.log('Character creation step');
    }
    
    createWorld() {
        this.step = 'hosting';
        
        // Generate a unique world ID
        const worldId = 'world_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create world data
        this.game.worldData = {
            id: worldId,
            name: this.worldConfig.name || 'My World',
            seed: this.worldConfig.seed,
            maxPlayers: this.worldConfig.maxPlayers,
            isPublic: this.worldConfig.isPublic,
            timestamp: Date.now(),
            createdBy: this.game.playerId
        };
        
        // Set this player as host
        this.game.isHost = true;
        
        if (this.worldConfig.isPublic) {
            // Public game - connect to relay server
            this.game.networkManager.createHostedGame(this.worldConfig);
        } else {
            // Private game - no network connection needed
            console.log('Creating private world:', this.game.worldData.name);
        }
        
        this.game.changeState('gameplay');
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameConnection');
        } else if (keys['Enter']) {
            this.createWorld();
        } else if (keys['KeyP']) {
            this.worldConfig.isPublic = !this.worldConfig.isPublic;
        } else if (keys['ArrowUp']) {
            this.worldConfig.maxPlayers = Math.min(8, this.worldConfig.maxPlayers + 1);
        } else if (keys['ArrowDown']) {
            this.worldConfig.maxPlayers = Math.max(2, this.worldConfig.maxPlayers - 1);
        }
    }
    
    // Handle text input for world name
    handleTextInput(char) {
        if (char === 'Backspace') {
            this.worldConfig.name = this.worldConfig.name.slice(0, -1);
        } else if (char.length === 1 && char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
            // Only allow printable ASCII characters
            if (this.worldConfig.name.length < 20) { // Limit name length
                this.worldConfig.name += char;
            }
        }
    }
}

class LoadGameState extends GameState {
    constructor(game) {
        super(game);
        this.savedGames = [];
        this.selectedGame = null;
    }
    
    enter() {
        this.loadSavedGames();
    }
    
    loadSavedGames() {
        // Load saved games from localStorage
        const saved = localStorage.getItem('savedGames');
        this.savedGames = saved ? JSON.parse(saved) : [];
    }
    
    loadGame(gameId) {
        const gameData = this.savedGames.find(g => g.id === gameId);
        if (gameData) {
            this.game.worldData = gameData;
            this.game.changeState('gameplay');
        }
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameConnection');
        } else if (keys['Digit1'] || keys['Digit2'] || keys['Digit3'] || keys['Digit4'] || keys['Digit5'] || keys['Digit6'] || keys['Digit7'] || keys['Digit8'] || keys['Digit9']) {
            // Handle number keys 1-9 to load games
            let gameIndex = -1;
            if (keys['Digit1']) gameIndex = 0;
            else if (keys['Digit2']) gameIndex = 1;
            else if (keys['Digit3']) gameIndex = 2;
            else if (keys['Digit4']) gameIndex = 3;
            else if (keys['Digit5']) gameIndex = 4;
            else if (keys['Digit6']) gameIndex = 5;
            else if (keys['Digit7']) gameIndex = 6;
            else if (keys['Digit8']) gameIndex = 7;
            else if (keys['Digit9']) gameIndex = 8;
            
            if (gameIndex >= 0 && gameIndex < this.savedGames.length) {
                const selectedGame = this.savedGames[gameIndex];
                this.loadGame(selectedGame.id);
            }
        }
    }
    
    render(ctx) {
        // Render load game UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('LOAD GAME', this.game.width / 2, 150);
        
        if (this.savedGames.length === 0) {
            ctx.font = RU.f24;
            ctx.fillText('No saved games found', this.game.width / 2, 300);
        } else {
            ctx.font = RU.f20;
            ctx.textAlign = 'left';
            this.savedGames.forEach((game, index) => {
                const y = 250 + index * 60;
                ctx.fillText(`${index + 1}. ${game.name}`, 200, y);
                ctx.fillText(`Players: ${game.players || 0}`, 200, y + 2);
            });
            ctx.textAlign = 'center';
            ctx.fillText('Press 1-9 to load a game', this.game.width / 2, 500);
        }
        
        ctx.fillText('Press ESC to go back', this.game.width / 2, 550);
    }
}

class JoinGameState extends GameState {
    constructor(game) {
        super(game);
        this.publicGames = [];
        this.selectedGame = null;
        this.hasCharacter = false;
    }
    
    enter() {
        this.refreshPublicGames();
    }
    
    refreshPublicGames() {
        // Fetch public games from relay
        this.game.networkManager.getPublicGames();
        // The relay will send the list via onmessage, which updates this.game.publicGames
    }
    
    joinGame(gameId) {
        this.game.networkManager.joinGame(gameId).then(success => {
            if (success) {
                // Set basic worldData for joined game (needed for character creation)
                this.game.worldData = {
                    id: gameId,
                    name: 'Joined World',
                    isPublic: true,
                    timestamp: Date.now()
                };
                console.log('Set worldData for joined game:', this.game.worldData);
                this.checkCharacterExists(gameId);
            }
        });
    }
    
    checkCharacterExists(gameId) {
        // Check if player has a character in this world
        const characterKey = `character_${gameId}`;
        const character = localStorage.getItem(characterKey);
        
        if (character) {
            this.hasCharacter = true;
            this.game.characterData = JSON.parse(character);
            this.game.changeState('gameplay');
        } else {
            // No character exists, go to character creation
            this.game.changeState('characterCreation');
        }
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameConnection');
        } else if (keys['KeyR']) {
            this.refreshPublicGames();
        } else if (keys['Digit1'] || keys['Digit2'] || keys['Digit3'] || keys['Digit4'] || keys['Digit5'] || keys['Digit6'] || keys['Digit7'] || keys['Digit8'] || keys['Digit9']) {
            // Handle number keys 1-9 to join games
            let gameIndex = -1;
            if (keys['Digit1']) gameIndex = 0;
            else if (keys['Digit2']) gameIndex = 1;
            else if (keys['Digit3']) gameIndex = 2;
            else if (keys['Digit4']) gameIndex = 3;
            else if (keys['Digit5']) gameIndex = 4;
            else if (keys['Digit6']) gameIndex = 5;
            else if (keys['Digit7']) gameIndex = 6;
            else if (keys['Digit8']) gameIndex = 7;
            else if (keys['Digit9']) gameIndex = 8;
            
            if (gameIndex >= 0 && gameIndex < this.game.publicGames.length) {
                const selectedGame = this.game.publicGames[gameIndex];
                this.joinGame(selectedGame.gameId || selectedGame.id);
            }
        }
    }
    
    render(ctx) {
        // Render join game UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('JOIN PUBLIC GAME', this.game.width / 2, 150);
        
        if (this.game.publicGames.length === 0) {
            ctx.font = RU.f24;
            ctx.fillText('No public games available', this.game.width / 2, 300);
            ctx.fillText('Press R to refresh', this.game.width / 2, 350);
        } else {
            ctx.font = RU.f20;
            ctx.textAlign = 'left';
            this.game.publicGames.forEach((game, index) => {
                const y = 250 + index * 60;
                ctx.fillText(`${index + 1}. ${game.gameName || game.name}`, 200, y);
                ctx.fillText(`Players: ${game.players || 0}/${game.maxPlayers || 4}`, 200, y + 25);
            });
            ctx.textAlign = 'center';
            ctx.fillText('Press 1-9 to join a game', this.game.width / 2, 500);
        }
        
        ctx.fillText('Press ESC to go back', this.game.width / 2, 550);
    }
}

class CharacterCreationState extends GameState {
    constructor(game) {
        super(game);
        this.character = {
            name: '',
            class: 'warrior',
            appearance: {
                hair: 0,
                eyes: 0,
                skin: 0
            }
        };
        this.currentStep = 'name'; // 'name', 'class', 'appearance', 'confirm'
    }
    
    enter() {
        this.currentStep = 'name';
    }
    
    createCharacter() {
        // Validate character data
        if (!this.character.name || this.character.name.trim() === '') {
            console.error('Cannot create character: name is required');
            return;
        }

        // Save character locally
        const characterKey = `character_${this.game.worldData.id}`;
        localStorage.setItem(characterKey, JSON.stringify(this.character));

        this.game.characterData = this.character;
        this.game.changeState('gameplay');
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameConnection');
        } else if (keys['Enter']) {
            this.createCharacter();
        }
    }
    
    // Handle text input for character name
    handleTextInput(char) {
        if (char === 'Backspace') {
            this.character.name = this.character.name.slice(0, -1);
        } else if (char.length === 1 && char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
            // Only allow printable ASCII characters
            if (this.character.name.length < 20) { // Limit name length
                this.character.name += char;
            }
        }
    }
    
    render(ctx) {
        // Render character creation UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('CHARACTER CREATION', this.game.width / 2, 150);
        
        ctx.font = RU.f24;
        const nameText = this.character.name || 'Enter name...';
        const nameColor = this.character.name ? '#fff' : '#888';
        ctx.fillStyle = nameColor;
        ctx.fillText(`Name: ${nameText}`, this.game.width / 2, 250);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Class: ${this.character.class}`, this.game.width / 2, 300);
        
        // Show cursor for name input
        if (this.character.name.length < 20) {
            const cursorX = this.game.width / 2 + ctx.measureText(`Name: ${this.character.name}`).width / 2 + 5;
            ctx.fillStyle = '#0f0';
            ctx.fillRect(cursorX, 235, 2, 20);
            ctx.fillStyle = '#fff';
        }
        
        ctx.font = RU.f20;
        ctx.fillText('Type to enter character name', this.game.width / 2, 400);
        ctx.fillText('Press ENTER to confirm character', this.game.width / 2, 430);
        ctx.fillText('Press ESC to go back', this.game.width / 2, 460);
        
        // Show warning if name is empty
        if (!this.character.name || this.character.name.trim() === '') {
            ctx.fillStyle = '#f00';
            ctx.fillText('Please enter a character name', this.game.width / 2, 500);
            ctx.fillStyle = '#fff';
        }
    }
}

// Game state classes
class MenuState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        console.log('Entering menu state');
    }
    
    render(ctx) {
        // Render menu UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('JS13K MMO GAME', this.game.width / 2, 150);
        
        ctx.font = RU.f24;
        ctx.fillText('Press SPACE to start', this.game.width / 2, 250);
        ctx.fillText('Press L to load game', this.game.width / 2, 300);
        ctx.fillText('Press J to join game', this.game.width / 2, 350);
    }
    
    handleInput(keys) {
        if (keys['Space']) {
            this.game.changeState('gameConnection');
        } else if (keys['KeyL']) {
            this.game.changeState('loadGame');
        } else if (keys['KeyJ']) {
            this.game.changeState('joinGame');
        }
    }
}

class GameplayState extends GameState {
    constructor(game) {
        super(game);
        this.otherPlayers = new Map();
        this.lastSentPos = null;
    }
    
    enter() {
        console.log('Entering gameplay state');
        // Initialize player if not exists
        if (!this.game.player) {
            this.game.player = {
                x: this.game.width / 2,
                y: this.game.height / 2,
                width: 20,
                height: 20,
                speed: 5
            };
        }

        // If client, send player state to host and ensure we have game state
        if (!this.game.isHost && this.game.networkManager && this.game.networkManager.gameSocket && this.game.networkManager.gameSocket.readyState === WebSocket.OPEN) {
            console.log('🎮 Client entering gameplay');

            // Always request game state to ensure we have current player list
            console.log('📡 Client requesting initial game state');
            this.game.networkManager.requestGameState();

            console.log('Client player data:', {
                playerId: this.game.networkManager.playerId,
                name: this.game.characterData?.name,
                position: { x: this.game.player.x, y: this.game.player.y }
            });
            this.game.networkManager.sendPlayerState();
        }
    }
    
    update(deltaTime) {
        // Update player movement
        if (this.game.keys['ArrowUp']) {
            this.game.player.y -= this.game.player.speed;
        }
        if (this.game.keys['ArrowDown']) {
            this.game.player.y += this.game.player.speed;
        }
        if (this.game.keys['ArrowLeft']) {
            this.game.player.x -= this.game.player.speed;
        }
        if (this.game.keys['ArrowRight']) {
            this.game.player.x += this.game.player.speed;
        }
        
        // Keep player in bounds
        this.game.player.x = Math.max(0, Math.min(this.game.width - this.game.player.width, this.game.player.x));
        this.game.player.y = Math.max(0, Math.min(this.game.height - this.game.player.height, this.game.player.y));
        
        // Send player position to all players when moving (for public games)
        if (this.game.worldData?.isPublic && this.game.networkManager && this.game.networkManager.gameSocket && this.game.networkManager.gameSocket.readyState === WebSocket.OPEN) {
            // Only send movement updates if player actually moved
            const currentPos = { x: this.game.player.x, y: this.game.player.y };
            if (!this.lastSentPos || this.lastSentPos.x !== currentPos.x || this.lastSentPos.y !== currentPos.y) {
                // Send movement action to all players
                this.game.networkManager.sendPlayerAction({
                    type: 'move',
                    playerId: this.game.networkManager.playerId,
                    name: this.game.characterData?.name || 'Player',
                    x: this.game.player.x,
                    y: this.game.player.y,
                    width: this.game.player.width,
                    height: this.game.player.height,
                    class: this.game.characterData?.class || 'warrior'
                });

                // Store last sent position
                this.lastSentPos = { ...currentPos };
            }
        }

        // Host: broadcast game state periodically (only for public games)
        if (this.game.isHost && this.game.networkManager && this.game.networkManager.gameSocket && this.game.worldData?.isPublic) {
            // Update host player position in connected players list
            if (this.game.networkManager.connectedPlayers.has(this.game.networkManager.playerId)) {
                const hostPlayer = this.game.networkManager.connectedPlayers.get(this.game.networkManager.playerId);
                hostPlayer.x = this.game.player.x;
                hostPlayer.y = this.game.player.y;
            }

            // Only broadcast every few frames to reduce network traffic
            if (this.game.frameCount % 30 === 0) { // Every 30 frames (roughly every 0.5 seconds at 60fps)
                console.log('Host: Broadcasting periodic game state update');
                this.game.networkManager.broadcastGameState({
                    worldState: {
                        enemies: this.game.enemies || [],
                        metal: this.game.metal || [],
                        stars: this.game.stars || []
                    },
                    players: Array.from(this.game.networkManager.connectedPlayers.values())
                });
            }
        }

        // Client: periodically check if we have game state (fallback mechanism)
        if (!this.game.isHost && this.game.networkManager && this.game.networkManager.gameSocket && this.game.worldData?.isPublic) {
            // Check every 60 frames (1 second) if we don't have any connected players
            if (this.game.frameCount % 60 === 0 && this.game.networkManager.connectedPlayers.size === 0) {
                console.log('Client: No connected players, requesting game state as fallback');
                this.game.networkManager.requestGameState();
            }
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Render player
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.game.player.x, this.game.player.y, this.game.player.width, this.game.player.height);

        // Render player name above player
        ctx.fillStyle = '#fff';
        ctx.font = RU.f16;
        ctx.textAlign = 'center';
        ctx.fillText(this.game.characterData?.name || 'Player', this.game.player.x + this.game.player.width / 2, this.game.player.y - 10);

        // Render other players from network manager
        if (this.game.networkManager && this.game.networkManager.connectedPlayers) {
            let otherPlayersCount = 0;
            // Only log every 60 frames to avoid spam
            const shouldLog = this.game.frameCount % 60 === 0;
            if (shouldLog) {
                console.log(`Frame ${this.game.frameCount}: Rendering ${this.game.networkManager.connectedPlayers.size} total players`);
            }
            this.game.networkManager.connectedPlayers.forEach(player => {
                // Skip rendering the current player (they're already rendered above)
                if (player.id === this.game.networkManager.playerId) {
                    return;
                }
                otherPlayersCount++;
                if (shouldLog) {
                    console.log(`Rendering player: ${player.name} at (${player.x}, ${player.y})`);
                }

                // Different colors for different player classes
                let playerColor = '#00f'; // Default blue
                if (player.class === 'warrior') playerColor = '#f00'; // Red for warriors
                else if (player.class === 'mage') playerColor = '#f0f'; // Magenta for mages
                else if (player.class === 'archer') playerColor = '#ff0'; // Yellow for archers

                ctx.fillStyle = playerColor;
                ctx.fillRect(player.x, player.y, player.width || 20, player.height || 20);

                // Render player name above other players
                ctx.fillStyle = '#fff';
                ctx.font = RU.f16;
                ctx.textAlign = 'center';
                ctx.fillText(player.name || 'Player', player.x + (player.width || 20) / 2, player.y - 10);
            });
            if (otherPlayersCount === 0) {
                console.log('No other players to render');
            }
        } else {
            console.log('No network manager or connected players available for rendering');
        }
        
        // Render UI
        ctx.fillStyle = '#fff';
        ctx.font = RU.f16;
        ctx.textAlign = 'left';
        ctx.fillText(`Host: ${this.game.isHost ? 'Yes' : 'No'}`, 10, 20);
        // Calculate total player count from network manager
        const totalPlayers = this.game.networkManager && this.game.networkManager.connectedPlayers ?
            this.game.networkManager.connectedPlayers.size : 1;
        ctx.fillText(`Players: ${totalPlayers}`, 10, 40);
        ctx.fillText(`Game Type: ${this.game.worldData?.isPublic ? 'Public' : 'Private'}`, 10, 60);
        
        if (this.game.isHost) {
            ctx.fillText('Press S to save game', 10, 80);
        }
    }
    
    handleInput(keys) {
        if (keys['KeyS'] && this.game.isHost) {
            this.game.saveGame();
        }
    }
}

class HighScoreState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        console.log('Entering high score state');
    }
    
    render(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', this.game.width / 2, 150);
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('menu');
        }
    }
}

class ShopState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        console.log('Entering shop state');
    }
    
    render(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', this.game.width / 2, 150);
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameplay');
        }
    }
}

class PauseState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        console.log('Entering pause state');
    }
    
    render(ctx) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = RU.f48;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.game.width / 2, 200);
        
        ctx.font = RU.f24;
        ctx.fillText('Press ESC to resume', this.game.width / 2, 280);
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('gameplay');
        }
    }
}

// Enhanced NetworkManager for MMO functionality
class NetworkManager {
    constructor(url) {
        this.baseUrl = url;
        this.lobbySocket = null; // For lobby operations (listing games, creating games)
        this.gameSocket = null;  // For specific game room operations
        this.isHost = false;
        this.gameId = null;
        this.playerId = null;
        this.connectedPlayers = new Map();
        this.messageHandlers = new Map();
        
        this.setupMessageHandlers();
    }
    
    setupMessageHandlers() {
        this.messageHandlers.set('playerJoined', this.handlePlayerJoined.bind(this));
        this.messageHandlers.set('playerLeft', this.handlePlayerLeft.bind(this));
        this.messageHandlers.set('gameState', this.handleGameState.bind(this));
        this.messageHandlers.set('playerAction', this.handlePlayerAction.bind(this));
    }
    
    // Connect to lobby for game discovery and creation
    async connectToLobby() {
        if (this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            this.lobbySocket = new WebSocket(this.baseUrl + '/space-cats/lobby');
            
            this.lobbySocket.onopen = () => {
                console.log('Connected to lobby');
                resolve();
            };
            
            this.lobbySocket.onmessage = (event) => {
                this.handleLobbyMessage(event.data);
            };
            
            this.lobbySocket.onerror = (error) => {
                console.error('Lobby WebSocket error:', error);
                reject(error);
            };
            
            this.lobbySocket.onclose = () => {
                console.log('Disconnected from lobby');
            };
        });
    }
    
    // Connect to specific game room
    async connectToGameRoom(gameId) {
        if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            this.gameSocket.close();
        }
        
        return new Promise((resolve, reject) => {
            this.gameSocket = new WebSocket(this.baseUrl + '/space-cats/' + gameId);
            
            this.gameSocket.onopen = () => {
                console.log(`Connected to game room: ${gameId}`);
                resolve();
            };
            
            this.gameSocket.onmessage = (event) => {
                this.handleGameMessage(event.data);
            };
            
            this.gameSocket.onerror = (error) => {
                console.error('Game room WebSocket error:', error);
                reject(error);
            };
            
            this.gameSocket.onclose = () => {
                console.log(`Disconnected from game room: ${gameId}`);
                
                // Remove game from lobby if we're the host
                if (this.isHost && this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
                    const removeMessage = `remove ${this.gameId}`;
                    this.lobbySocket.send(removeMessage);
                    console.log('Removed game from lobby:', removeMessage);
                }
            };
        });
    }
    
    // Handle lobby messages (game listings, etc.)
    handleLobbyMessage(data) {
        console.log('Raw lobby message:', data);
        
        try {
            if (data.startsWith('@')) {
                // Relay message format with @ prefix
                const parts = data.split(' ');
                const messageType = parts[0].substring(1);
                const messageData = parts.slice(1).join(' ');
                
                if (messageType === 'games') {
                    // Parse games list from relay
                    const games = this.parseGamesList(messageData);
                    this.game.publicGames = games;
                    console.log('Received public games list:', games);
                } else if (messageType === 'created') {
                    console.log('Game created successfully on relay');
                } else if (messageType === 'error') {
                    console.error('Relay error:', messageData);
                }
            } else if (data.startsWith('+')) {
                // Relay connection success message
                console.log('Relay connection established:', data);
            } else if (data.startsWith('-')) {
                // Relay error message
                console.error('Relay error:', data);
            } else if (data.trim() === '') {
                // Empty message, ignore
                return;
            } else {
                // Handle lobby protocol messages
                const parts = data.split(' ');
                const command = parts[0];
                
                if (command === 'list') {
                    // Client is requesting list of games - respond if we're hosting
                    if (this.isHost && this.gameId) {
                        const gameInfo = `game ${this.gameId} ${this.game.worldData?.name || 'My World'} ${this.connectedPlayers.size + 1} ${this.game.worldData?.maxPlayers || 4}`;
                        this.lobbySocket.send(gameInfo);
                        console.log('Responded to game list request with:', gameInfo);
                    }
                } else if (command === 'game') {
                    // Another host is advertising their game
                    if (parts.length >= 5) {
                        const gameInfo = {
                            id: parts[1],
                            name: parts[2],
                            players: parseInt(parts[3]) || 0,
                            maxPlayers: parseInt(parts[4]) || 4
                        };
                        
                        // Add to public games list if not already there
                        const existingIndex = this.game.publicGames.findIndex(g => g.id === gameInfo.id);
                        if (existingIndex >= 0) {
                            this.game.publicGames[existingIndex] = gameInfo;
                        } else {
                            this.game.publicGames.push(gameInfo);
                        }
                        console.log('Received game info from lobby:', gameInfo);
                    }
                } else if (command === 'remove') {
                    // A game is being removed from the lobby
                    if (parts.length >= 2) {
                        const gameId = parts[1];
                        const existingIndex = this.game.publicGames.findIndex(g => g.id === gameId);
                        if (existingIndex >= 0) {
                            this.game.publicGames.splice(existingIndex, 1);
                            console.log('Removed game from lobby:', gameId);
                        }
                    }
                } else {
                    // Try JSON parsing for other messages
                    try {
                        const message = JSON.parse(data);
                        this.handleLobbyMessage(message);
                    } catch (jsonError) {
                        // Not JSON, treat as raw relay message
                        console.log('Raw relay message (not JSON):', data);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing lobby message:', error, 'Raw data:', data);
        }
    }
    
    // Handle game room messages (player actions, game state)
    handleGameMessage(data) {
        console.log('Raw game message:', data);
        
        try {
            if (data.startsWith('@')) {
                // Relay message format with @ prefix
                const parts = data.split(' ');
                const messageType = parts[0].substring(1);
                const messageData = parts.slice(1).join(' ');
                
                if (messageType === 'joined') {
                    this.handlePlayerJoined({ playerId: messageData });
                } else if (messageType === 'left') {
                    this.handlePlayerLeft({ playerId: messageData });
                } else if (messageType === 'state') {
                    try {
                        const stateData = JSON.parse(messageData);
                        this.handleGameState(stateData);
                    } catch (e) {
                        this.handleGameState({ raw: messageData });
                    }
                } else if (messageType === 'action') {
                    try {
                        // Handle format: "move {json}" or just "{json}"
                        let jsonData = messageData;
                        if (messageData.startsWith('move ') || messageData.startsWith('shoot ')) {
                            // Skip the action type and space
                            const spaceIndex = messageData.indexOf(' ');
                            if (spaceIndex !== -1) {
                                jsonData = messageData.substring(spaceIndex + 1);
                            }
                        }
                        console.log('Parsing @action JSON:', jsonData);
                        const actionData = JSON.parse(jsonData);
                        console.log('📨 Received @action:', actionData);
                        this.handlePlayerAction(actionData);
                    } catch (e) {
                        console.error('Error parsing @action message:', e, 'Raw data:', messageData);
                        this.handlePlayerAction({ raw: messageData });
                    }
                } else if (messageType === 'playerState') {
                    try {
                        // Handle format: "playerState {json}" (remove any prefix if present)
                        let jsonData = messageData;
                        if (messageData.startsWith('playerState ')) {
                            jsonData = messageData.substring('playerState '.length);
                        }
                        const playerState = JSON.parse(jsonData);
                        console.log('Received @playerState message from relay:', playerState);
                        this.handlePlayerState(playerState);
                    } catch (e) {
                        console.error('Error parsing @playerState message:', e, 'Raw data:', messageData);
                    }
                }
            } else if (data.startsWith('+')) {
                // Relay connection success message
                console.log('Game room connection established:', data);
            } else if (data.startsWith('-')) {
                // Relay error message
                console.error('Game room relay error:', data);
            } else if (data.trim() === '') {
                // Empty message, ignore
                return;
            } else if (data.startsWith('playerState ')) {
                // Direct player state message (not through relay)
                const playerStateData = data.substring('playerState '.length);
                try {
                    // Handle format: "playerState {json}" (data is already the JSON part)
                    const playerState = JSON.parse(playerStateData);
                    console.log('Received direct playerState:', playerState);
                    this.handlePlayerState(playerState);
                } catch (e) {
                    console.error('Error parsing direct player state:', e, 'Raw data:', playerStateData);
                }
            } else if (data.startsWith('join ')) {
                // Direct join message (not through relay)
                const playerId = data.substring('join '.length);
                console.log('📨 Received direct join from:', playerId);
                this.handlePlayerJoined({ playerId: playerId });
            } else if (data.startsWith('action ')) {
                // Direct action message (not through relay)
                const actionDataStr = data.substring('action '.length);
                try {
                    // Handle format: "action move {json}" or "action {json}"
                    let jsonStartIndex = 0;
                    if (actionDataStr.startsWith('move ') || actionDataStr.startsWith('shoot ')) {
                        // Skip the action type and space
                        jsonStartIndex = actionDataStr.indexOf(' ') + 1;
                    }
                    const jsonData = actionDataStr.substring(jsonStartIndex);
                    console.log('Parsing action JSON:', jsonData);
                    const actionData = JSON.parse(jsonData);
                    console.log('📨 Received direct action:', actionData);
                    this.handlePlayerAction(actionData);
                } catch (e) {
                    console.error('Error parsing direct action:', e, 'Raw data:', actionDataStr);
                }
            } else {
                // Try JSON parsing for other messages
                try {
                    const message = JSON.parse(data);
                    this.handleGameMessage(message);
                } catch (jsonError) {
                    // Not JSON, treat as raw relay message
                    console.log('Raw game room relay message (not JSON):', data);
                }
            }
        } catch (error) {
            console.error('Error parsing game message:', error, 'Raw data:', data);
        }
    }
    
    // Parse games list from relay response
    parseGamesList(data) {
        try {
            // Try to parse as JSON first
            return JSON.parse(data);
        } catch (e) {
            // Fallback: parse space-separated format
            const lines = data.split('\n').filter(line => line.trim());
            return lines.map(line => {
                const parts = line.split(' ');
                if (parts.length >= 3) {
                    return {
                        id: parts[0],
                        name: parts[1],
                        players: parseInt(parts[2]) || 0,
                        maxPlayers: parseInt(parts[3]) || 4
                    };
                }
                return null;
            }).filter(game => game !== null);
        }
    }
    
    // Host functionality - create game and broadcast to lobby
    async createHostedGame(worldConfig) {
        // First connect to lobby
        await this.connectToLobby();
        
        // Generate game ID
        const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.gameId = gameId;
        
        // Set this as host before advertising
        this.isHost = true;

        // Initialize host player in connected players list
        if (!this.connectedPlayers.has(this.playerId)) {
            this.connectedPlayers.set(this.playerId, {
                id: this.playerId,
                name: this.game.characterData?.name || 'Host',
                x: this.game.player?.x || this.game.width / 2,
                y: this.game.player?.y || this.game.height / 2,
                width: this.game.player?.width || 20,
                height: this.game.player?.height || 20,
                class: this.game.characterData?.class || 'warrior'
            });
            console.log('Host: Initialized self in connected players list');
        }

        // Advertise game in lobby
        if (this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            const gameInfo = `game ${gameId} ${worldConfig.name || 'My World'} 1 ${worldConfig.maxPlayers}`;
            this.lobbySocket.send(gameInfo);
            console.log(`Advertised game in lobby: ${gameInfo}`);
        } else {
            console.warn('Cannot advertise game - lobby socket not ready');
        }
        
        // Connect to the specific game room
        await this.connectToGameRoom(gameId);
        
        console.log(`Created hosted game: ${gameId}`);
    }
    
    // Client functionality - join existing game
    async joinGame(gameId) {
        // Connect to the specific game room
        await this.connectToGameRoom(gameId);

        this.isHost = false;
        this.gameId = gameId;

        // Wait for WebSocket to be fully open before sending
        if (this.gameSocket.readyState === WebSocket.OPEN) {
            // Send join message to game room
            this.gameSocket.send(`join ${this.playerId}`);
            console.log('Client: Sent join message to game room');

            // Request current game state from host
            this.requestGameState();
        } else {
            // Wait for connection to open
            this.gameSocket.onopen = () => {
                this.gameSocket.send(`join ${this.playerId}`);
                console.log('Client: Sent join message to game room (delayed)');

                // Request current game state from host
                this.requestGameState();
            };
        }

        return true;
    }
    
    // Get public games from lobby
    async getPublicGames() {
        await this.connectToLobby();
        
        // Clear existing games list
        this.game.publicGames = [];
        
        // Request games list from lobby using 'list' command
        if (this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            this.lobbySocket.send('list');
            console.log('Sent list request to lobby');
        } else {
            console.warn('Cannot request games list - lobby socket not ready');
        }
        
        // Return empty array - hosts will respond via lobby messages
        return [];
    }
    
    // Send player actions to game room
    sendPlayerAction(action) {
        if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            const message = `action ${action.type} ${JSON.stringify(action)}`;
            this.gameSocket.send(message);
        }
    }
    
    // Host: broadcast game state to game room
    broadcastGameState(gameState) {
        if (this.isHost && this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            console.log('📡 Host broadcasting game state to all clients');
            console.log('Broadcast includes players:', gameState.players?.map(p => `${p.name}(${p.x},${p.y})`) || 'none');
            const message = `state ${JSON.stringify(gameState)}`;
            this.gameSocket.send(message);
            console.log('✅ Host broadcast sent');
        } else {
            console.log('❌ Host cannot broadcast - not host or socket not ready');
        }
    }
    
    // Message handlers
    handlePlayerJoined(data) {
        if (data.playerInfo) {
            // Full player info provided (from relay)
            this.connectedPlayers.set(data.playerId, data.playerInfo);
            console.log(`👤 Player ${data.playerInfo.name} joined the game (with info)`);
        } else {
            // Only playerId provided (direct join) - create placeholder
            const placeholderPlayer = {
                id: data.playerId,
                name: `Player_${data.playerId.substring(0, 8)}`, // Use part of playerId as name
                x: this.game.width / 2,
                y: this.game.height / 2,
                width: 20,
                height: 20,
                class: 'warrior'
            };
            this.connectedPlayers.set(data.playerId, placeholderPlayer);
            console.log(`👤 Player joined the game: ${data.playerId} (placeholder created)`);
            console.log('Placeholder player:', placeholderPlayer);
        }

        // Update lobby with new player count if hosting
        if (this.isHost && this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            const gameInfo = `game ${this.gameId} ${this.game.worldData?.name || 'My World'} ${this.connectedPlayers.size} ${this.game.worldData?.maxPlayers || 4}`;
            this.lobbySocket.send(gameInfo);
            console.log('Updated lobby with new player count:', gameInfo);
        }

        // Immediately broadcast current game state to ensure new player gets all info
        if (this.isHost) {
            console.log('🎯 Host broadcasting current game state to new player');
            this.broadcastGameState({
                worldState: {
                    enemies: this.game.enemies || [],
                    metal: this.game.metal || [],
                    stars: this.game.stars || []
                },
                players: Array.from(this.connectedPlayers.values())
            });
        }
    }
    
    handlePlayerLeft(data) {
        const player = this.connectedPlayers.get(data.playerId);
        const playerName = player ? player.name : data.playerId;
        this.connectedPlayers.delete(data.playerId);
        console.log(`👋 Player ${playerName} left the game`);

        // Update lobby with new player count if hosting
        if (this.isHost && this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            const gameInfo = `game ${this.gameId} ${this.game.worldData?.name || 'My World'} ${this.connectedPlayers.size} ${this.game.worldData?.maxPlayers || 4}`;
            this.lobbySocket.send(gameInfo);
            console.log('Updated lobby with new player count:', gameInfo);
        }
    }
    
    handleGameState(data) {
        // Update game state from host
        if (!this.isHost) {
            this.game.updateFromNetwork(data);
        }
    }
    
    // Handle player state from clients
    handlePlayerState(playerState) {
        // Host: store new player's state
        if (this.isHost) {
            console.log('Host: Received player state:', playerState);

            // Add player to connected players list
            this.connectedPlayers.set(playerState.playerId, {
                id: playerState.playerId,
                name: playerState.name,
                x: playerState.x,
                y: playerState.y,
                width: playerState.width,
                height: playerState.height,
                class: playerState.class
            });

            console.log(`Host: Added new player ${playerState.name} to connected players`);
            console.log('Host: Current connected players:', Array.from(this.connectedPlayers.values()));

            // Also add host player to connected players list if not already there
            if (!this.connectedPlayers.has(this.playerId)) {
                this.connectedPlayers.set(this.playerId, {
                    id: this.playerId,
                    name: this.game.characterData?.name || 'Host',
                    x: this.game.player?.x || 0,
                    y: this.game.player?.y || 0,
                    width: this.game.player?.width || 20,
                    height: this.game.player?.height || 20,
                    class: this.game.characterData?.class || 'warrior'
                });
                console.log('Host: Added self to connected players list');
            }

            // Broadcast updated player list to all clients
            console.log('Host: Broadcasting updated player list after receiving player state');
            this.broadcastGameState({
                worldState: {
                    enemies: this.game.enemies || [],
                    metal: this.game.metal || [],
                    stars: this.game.stars || []
                },
                players: Array.from(this.connectedPlayers.values())
            });
        }
    }

    handlePlayerAction(data) {
        // Handle actions from other players
        console.log('🎮 Processing player action:', data);

        if (data.playerId !== this.playerId) {
            console.log('📨 Received player action from:', data.playerId, 'Type:', data.type);

            if (data.type === 'move') {
                // Update other player position in connected players list
                let player = this.connectedPlayers.get(data.playerId);
                if (!player) {
                    // If player not found, register them (fallback mechanism as suggested)
                    console.log('👤 Player not found in connected list, registering from movement data:', data);
                    player = {
                        id: data.playerId,
                        name: data.name || 'Unknown Player',
                        x: data.x,
                        y: data.y,
                        width: data.width || 20,
                        height: data.height || 20,
                        class: data.class || 'warrior'
                    };
                    this.connectedPlayers.set(data.playerId, player);
                    console.log('✅ Registered new player from movement data:', player);
                } else {
                    // Update existing player position
                    console.log(`📍 Before: Player ${data.name} at (${player.x}, ${player.y})`);
                    player.x = data.x;
                    player.y = data.y;
                    console.log(`📍 After: Updated player ${data.name} position to (${player.x}, ${player.y})`);
                }

                // If we're the host, broadcast the updated player list to all clients
                if (this.isHost) {
                    console.log('Host: Broadcasting updated player positions after movement');
                    const gameState = {
                        worldState: {
                            enemies: this.game.enemies || [],
                            metal: this.game.metal || [],
                            stars: this.game.stars || []
                        },
                        players: Array.from(this.connectedPlayers.values())
                    };
                    console.log('Broadcasting players:', gameState.players.map(p => `${p.name}(${p.x},${p.y})`));
                    this.broadcastGameState(gameState);
                }
            }

            // Let the game handle other action types
            this.game.handlePlayerAction(data);
        }
    }

    // Send player state to host (for new connections)
    sendPlayerState() {
        if (!this.game || !this.gameSocket || this.gameSocket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send player state: game or socket not ready');
            return;
        }

        // Ensure player has a position (initialize if needed)
        if (!this.game.player) {
            this.game.player = {
                x: this.game.width / 2,
                y: this.game.height / 2,
                width: 20,
                height: 20,
                speed: 5
            };
        }

        // Only send player state if we have character data (meaning we're in gameplay)
        if (!this.game.characterData) {
            console.log('Cannot send player state: no character data yet');
            return;
        }

        const playerState = {
            playerId: this.playerId,
            name: this.game.characterData.name,
            x: this.game.player.x,
            y: this.game.player.y,
            width: this.game.player.width,
            height: this.game.player.height,
            class: this.game.characterData.class
        };

        const message = `playerState ${JSON.stringify(playerState)}`;
        this.gameSocket.send(message);
        console.log('Client: Sent player state to host via relay:', message);
    }

    // Request current game state from host
    requestGameState() {
        if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            this.gameSocket.send('requestState');
            console.log('📡 Client: Requested game state from host');
            console.log('📡 Client: Requesting world state and connected players list');
        } else {
            console.warn('❌ Client: Cannot request game state - socket not ready');
        }
    }

    // Cleanup and disconnect
    disconnect() {
        // Remove game from lobby if hosting
        if (this.isHost && this.lobbySocket && this.lobbySocket.readyState === WebSocket.OPEN) {
            const removeMessage = `remove ${this.gameId}`;
            this.lobbySocket.send(removeMessage);
            console.log('Removed game from lobby:', removeMessage);
        }
        
        // Close sockets
        if (this.gameSocket) {
            this.gameSocket.close();
        }
        if (this.lobbySocket) {
            this.lobbySocket.close();
        }
        
        // Reset state
        this.isHost = false;
        this.gameId = null;
        this.connectedPlayers.clear();
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
    
    static lerp(start, end, t) {
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
        
        // Network and MMO support
        this.networkManager = new NetworkManager('wss://relay.js13kgames.com');
        this.networkManager.game = this; // Set reference back to game
        this.worldData = null;
        this.characterData = null;
        this.isHost = false;
        this.connectedPlayers = new Map();
        this.publicGames = []; // List of public games from relay
        
        // Generate unique player ID
        this.playerId = this.generatePlayerId();
        this.networkManager.playerId = this.playerId;
        
        
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
            gameConnection: new GameConnectionState(this),
            newGame: new NewGameState(this),
            loadGame: new LoadGameState(this),
            joinGame: new JoinGameState(this),
            characterCreation: new CharacterCreationState(this),
            gameplay: new GameplayState(this),
            highscore: new HighScoreState(this),
                    shop: new ShopState(this),
        pause: new PauseState(this)
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
            
            // Text input handling for NewGameState
            if (this.currentState === this.states.newGame) {
                if (e.code === 'Backspace') {
                    this.currentState.handleTextInput('Backspace');
                } else if (e.key && e.key.length === 1) {
                    this.currentState.handleTextInput(e.key);
                }
            }
            
            // Text input handling for CharacterCreationState
            if (this.currentState === this.states.characterCreation) {
                if (e.code === 'Backspace') {
                    this.currentState.handleTextInput('Backspace');
                } else if (e.key && e.key.length === 1) {
                    this.currentState.handleTextInput(e.key);
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

        this.frameCount++;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    simpleNoise(x) {
        // Simple pseudo-random noise function using trigonometric approach
        return Math.sin(x * 12.9898) * Math.cos(x * 78.233) * 43758.5453 % 1;
    }
    
    // Network update methods for MMO functionality
    updateFromNetwork(networkData) {
        // Update game state from network (for clients)
        if (this.worldData && networkData.worldState) {
            // Update world state from host
            this.updateWorldFromNetwork(networkData.worldState);
        }
        
        if (networkData.players) {
            // Update other players' positions/actions
            this.updatePlayersFromNetwork(networkData.players);
        }
    }
    
    updateWorldFromNetwork(worldState) {
        // Update world objects, enemies, etc. from host
        if (worldState.enemies) {
            this.enemies = worldState.enemies;
        }
        if (worldState.metal) {
            this.metal = worldState.metal;
        }
        if (worldState.stars) {
            this.stars = worldState.stars;
        }
    }
    
    updatePlayersFromNetwork(players) {
        console.log('📨 Client: Updating players from network, received:', players.length, 'players');
        console.log('Received players:', players.map(p => `${p.name}(${p.x},${p.y})`));

        // Update other players' data
        this.connectedPlayers.clear();

        // Also update the NetworkManager's connectedPlayers for consistency
        if (this.networkManager) {
            this.networkManager.connectedPlayers.clear();
        }

        players.forEach(player => {
            // Include ALL players (including host) except ourselves
            if (player.id !== this.networkManager.playerId) {
                // Ensure player has required properties
                const playerData = {
                    id: player.id,
                    name: player.name || 'Player',
                    x: player.x || 0,
                    y: player.y || 0,
                    width: player.width || 20,
                    height: player.height || 20,
                    class: player.class || 'warrior'
                };
                this.connectedPlayers.set(player.id, playerData);

                // Also update NetworkManager's list
                if (this.networkManager) {
                    this.networkManager.connectedPlayers.set(player.id, playerData);
                }
                console.log(`✅ Client: Registered player from network: ${playerData.name} (${playerData.id}) at (${playerData.x}, ${playerData.y})`);
            } else {
                console.log('⏭️ Client: Skipping self player:', player.name);
            }
        });

        console.log(`📊 Client: Now has ${this.connectedPlayers.size} connected players (excluding self)`);
        console.log('👥 Client connected players:', Array.from(this.connectedPlayers.values()).map(p => p.name));
    }
    
    handlePlayerAction(actionData) {
        // Handle actions from other players
        if (actionData.type === 'move') {
            // Update other player position in NetworkManager's connectedPlayers
            if (this.networkManager && this.networkManager.connectedPlayers) {
                const player = this.networkManager.connectedPlayers.get(actionData.playerId);
                if (player) {
                    player.x = actionData.x;
                    player.y = actionData.y;
                }
            }
        } else if (actionData.type === 'shoot') {
            // Handle other player shooting
            // This could create visual effects or sounds
        }
    }
    
    // Save game state (for host)
    saveGame() {
        if (this.isHost && this.worldData) {
            const saveData = {
                id: this.worldData.id,
                name: this.worldData.name,
                timestamp: Date.now(),
                worldState: {
                    enemies: this.enemies,
                    metal: this.metal,
                    stars: this.stars,
                    player: this.player
                }
            };
            
            // Save to localStorage
            const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
            const existingIndex = savedGames.findIndex(g => g.id === saveData.id);
            
            if (existingIndex >= 0) {
                savedGames[existingIndex] = saveData;
            } else {
                savedGames.push(saveData);
            }
            
            localStorage.setItem('savedGames', JSON.stringify(savedGames));
        }
    }
    
    // Load game state
    loadGame(gameId) {
        const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
        const gameData = savedGames.find(g => g.id === gameId);
        
        if (gameData) {
            this.worldData = gameData;
            this.isHost = true; // Loading a game makes you the host
            
            // Restore world state
            if (gameData.worldState) {
                this.enemies = gameData.worldState.enemies || [];
                this.metal = gameData.worldState.metal || [];
                this.stars = gameData.worldState.stars || [];
                if (gameData.worldState.player) {
                    this.player = gameData.worldState.player;
                }
            }
            
            return true;
        }
        return false;
    }
    
    // Generate unique player ID
    generatePlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('playerId', playerId);
        }
        return playerId;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
});