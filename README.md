Multiplayer Odd/Even Tic-Tac-Toe

A real-time multiplayer game built with React and WebSockets that demonstrates distributed systems concepts including server authority and operational transforms.

## 🎮 Game Rules

- **5x5 board** with 25 squares, all starting at 0
- **Two players**: Odd Player and Even Player
- **Gameplay**: Click any square to increment its number by 1
- **No turns**: Both players can click any square at any time
- **Winning**:
  - **Odd Player** wins with 5 odd numbers in a row/column/diagonal
  - **Even Player** wins with 5 even numbers in a row/column/diagonal

## 🏗️ Architecture

### Frontend (React + TypeScript)

- Real-time WebSocket communication
- Optimistic UI updates
- Connection status management
- Chaos mode for testing race conditions

### Backend (Node.js + WebSocket)

- Server authority for game state
- Operational transforms (INCREMENT operations)
- Win condition detection
- Player management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to the project:**

   ```bash
   cd Multiplayer-Tictactoe
   ```

2. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the WebSocket server:**

   ```bash
   cd backend
   npm start
   ```

   Server will run on `ws://localhost:8080`

2. **Start the React development server:**

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

3. **Test multiplayer:**
   - Open two browser windows/tabs
   - Navigate to `http://localhost:5173` in both
   - Play against yourself!

## 🧠 Key Learning Concepts

### Server Authority

The server maintains the single source of truth for game state. All moves are processed by the server before being broadcast to clients.

### Operational Transforms

Instead of sending final states, we send operations (INCREMENT). This allows multiple simultaneous actions to be processed correctly:

```javascript
// Client sends operation
{ type: 'INCREMENT', square: 12 }

// Server processes and broadcasts result
{ type: 'UPDATE', square: 12, value: 6 }
```

### Race Condition Handling

When both players click the same square simultaneously:

1. Both INCREMENT messages are sent to server
2. Server processes them sequentially
3. Both increments are applied: 5 → 6 → 7
4. Both clicks count!

## 🎯 Features

- ✅ Real-time multiplayer gameplay
- ✅ Server authority for game state
- ✅ Operational transforms for concurrent actions
- ✅ Win condition detection
- ✅ Connection status indicators
- ✅ Chaos mode for testing race conditions
- ✅ Responsive design
- ✅ Game reset functionality

## 🧪 Testing Race Conditions

Enable "Chaos Mode" to simulate network lag and test how the system handles:

- Out-of-order message delivery
- Simultaneous clicks
- Network latency variations

## 📁 Project Structure

```
Multiplayer-Tictactoe/
├── backend/
│   ├── server.js          # WebSocket server with game logic
│   ├── package.json       # Backend dependencies
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── main.tsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md
```

## 🔧 Technical Implementation

### WebSocket Message Types

**Client → Server:**

- `INCREMENT`: Increment a square by 1
- `RESET_GAME`: Reset the game state

**Server → Client:**

- `PLAYER_ASSIGNED`: Assign player role and send initial board
- `UPDATE`: Broadcast square value update
- `GAME_OVER`: Announce winner and winning line
- `GAME_RESET`: Reset game state
- `ERROR`: Error messages

### Win Detection Algorithm

The server checks all possible winning lines:

- 5 rows: `[0,1,2,3,4]`, `[5,6,7,8,9]`, etc.
- 5 columns: `[0,5,10,15,20]`, `[1,6,11,16,21]`, etc.
- 2 diagonals: `[0,6,12,18,24]`, `[4,8,12,16,20]`

For each line, check if all values are odd (Odd Player wins) or even (Even Player wins).

## 🎓 Learning Outcomes

This project demonstrates:

1. **Why server authority matters** in distributed systems
2. **How operational transforms** solve concurrent modification problems
3. **Real-time communication** patterns with WebSockets
4. **Race condition handling** in multiplayer applications
5. **State synchronization** across multiple clients

These concepts apply to:

- Google Docs collaborative editing
- Figma real-time collaboration
- Multiplayer games
- Chat applications
- Any real-time collaborative tool

## 🐛 Troubleshooting

**Connection Issues:**

- Ensure backend server is running on port 8080
- Check firewall settings
- Verify WebSocket support in browser

**Game Not Starting:**

- Wait for both players to connect
- Check browser console for errors
- Ensure no other applications are using port 8080

## 📝 Assignment Requirements Met

- ✅ 5x5 board with number display
- ✅ WebSocket communication with operational transforms
- ✅ Server authority for game state
- ✅ Win detection for odd/even patterns
- ✅ Player assignment (Odd/Even)
- ✅ Game over handling
- ✅ Connection status management
- ✅ Real-time updates
- ✅ Multiplayer support

## 🎉 Success!

You've successfully implemented a distributed system that handles concurrent operations correctly. This knowledge applies to every real-time application you'll build!
