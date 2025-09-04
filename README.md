# JS13K 2025 MMO Game

A multiplayer online game built for the JS13K game jam with a focus on MMO functionality.

## Game Connection Workflow

### 1. New Game Creation (Host Path)
- **Step 1: World Setup**
  - Configure max players (seed / name optional)
  - Choose whether to make it public
  - Generate procedural world

- **Step 2: Character Creation**
  - Choose character name. All players are space cats
  - Customize appearance(optional TODO)
  - Confirm character

- **Step 3: Hosting**
  - Game becomes the authoritative host
  - Other players connect as clients
  - Host controls world state and validates actions

### 2. Load Existing Game (Host Path)
- Load previously saved world from localStorage
- Restore world state (enemies, items, player progress)
- Option to open to public players
- Player becomes host of the loaded world

### 3. Join Public Game (Client Path)
- **Step 1: Browse Public Games**
  - View list of available public games
  - See player count and world info
  - Select game to join

- **Step 2: Character Check**
  - If player has existing character in this world:
    - Load character data
    - Join game immediately
  - If no character exists:
    - Go through character creation process
    - Character is tied to this specific world

## Architecture

### Game States
- `MenuState`: Main menu with connection options
- `GameConnectionState`: Connection type selection
- `NewGameState`: World and character creation
- `LoadGameState`: Saved game loading
- `JoinGameState`: Public game joining
- `CharacterCreationState`: Character customization
- `GameplayState`: Main game loop
- `PauseState`: Game pause overlay

### Network Manager
- WebSocket-based communication
- Host-client architecture
- Message handling for player actions
- Game state synchronization

### Data Persistence
- Local storage for saved games
- Character data tied to specific worlds
- Player ID generation and persistence

## Controls

- **Arrow Keys**: Move player
- **Space**: Menu selection / Fire weapon
- **Escape**: Pause / Back
- **S**: Save game (host only)
- **L**: Load game
- **J**: Join public game

## Development

### Running Locally
1. Open `index.html` in a web browser
2. Game will start in menu state
3. Use keyboard controls to navigate

### Network Setup
- Default WebSocket server: `ws://localhost:8080`
- Update `NetworkManager` constructor for different server

### Adding Features
- Extend `GameState` classes for new functionality
- Add message types to `NetworkManager`
- Implement UI rendering in state classes

## Technical Notes

- Built for JS13K size constraints
- Minimal dependencies (WebSocket only)
- Procedural world generation
- Client-side prediction with server validation
- Local-first architecture with network sync
