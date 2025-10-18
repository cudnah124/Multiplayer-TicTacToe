const WebSocket = require('ws');

// Game state
let gameState = {
  board: new Array(25).fill(0), // 5x5 board
  players: {
    odd: null,
    even: null
  },
  gameOver: false,
  winner: null,
  winningLine: null,
  moveHistory: [], // Track all moves for replay
  currentMoveIndex: 0 // For replay navigation
};

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server running on port 8080');

// Win detection lines (rows, columns, diagonals)
const WIN_LINES = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

function checkWinCondition() {
  for (const line of WIN_LINES) {
    const values = line.map(index => gameState.board[index]);
    
    // Check if all values in line are odd
    if (values.every(v => v % 2 === 1 && v > 0)) {
      return { winner: 'ODD', winningLine: line };
    }
    
    // Check if all values in line are even
    if (values.every(v => v % 2 === 0 && v > 0)) {
      return { winner: 'EVEN', winningLine: line };
    }
  }
  
  return null;
}

function broadcastToAllClients(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function resetGame() {
  gameState.board = new Array(25).fill(0);
  gameState.gameOver = false;
  gameState.winner = null;
  gameState.winningLine = null;
  gameState.moveHistory = [];
  gameState.currentMoveIndex = 0;
  // Don't reset players - keep them connected for new game
}

wss.on('connection', (ws) => {
  
  // Check if game is full
  if (gameState.players.odd && gameState.players.even) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Game is full. Only 2 players allowed.'
    }));
    ws.close();
    return;
  }
  
  // Assign player role
  let playerRole;
  if (!gameState.players.odd) {
    gameState.players.odd = ws;
    playerRole = 'ODD';
  } else if (!gameState.players.even) {
    gameState.players.even = ws;
    playerRole = 'EVEN';
  }
  
  // Send player assignment and current board state
  ws.send(JSON.stringify({
    type: 'PLAYER_ASSIGNED',
    player: playerRole,
    board: [...gameState.board]
  }));
  
  // If both players are connected, broadcast game ready
  if (gameState.players.odd && gameState.players.even) {
    broadcastToAllClients({
      type: 'GAME_READY',
      message: 'Both players connected. Game can begin!'
    });
  }
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Ignore moves if game is over (except for RESET_GAME)
      if (gameState.gameOver && message.type !== 'RESET_GAME') {
        return;
      }
      
      if (message.type === 'INCREMENT') {
        const { square } = message;
        
        // Validate square index
        if (square < 0 || square >= 25) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Invalid square index'
          }));
          return;
        }
        
        // Increment the square (server authority!)
        gameState.board[square] += 1;
        
        // Record the move in history
        const move = {
          square: square,
          value: gameState.board[square],
          player: ws === gameState.players.odd ? 'ODD' : 'EVEN',
          timestamp: Date.now()
        };
        gameState.moveHistory.push(move);
        
        // Broadcast the update to all clients
        broadcastToAllClients({
          type: 'UPDATE',
          square: square,
          value: gameState.board[square]
        });
        
        // Check for win condition
        const winResult = checkWinCondition();
        if (winResult) {
          gameState.gameOver = true;
          gameState.winner = winResult.winner;
          gameState.winningLine = winResult.winningLine;
          
          broadcastToAllClients({
            type: 'GAME_OVER',
            winner: winResult.winner,
            winningLine: winResult.winningLine
          });
        }
      }
      
      if (message.type === 'RESET_GAME') {
        resetGame();
        
        // Send game reset to all clients with their player assignments
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            let playerRole = null;
            if (client === gameState.players.odd) {
              playerRole = 'ODD';
            } else if (client === gameState.players.even) {
              playerRole = 'EVEN';
            }
            
            client.send(JSON.stringify({
              type: 'GAME_RESET',
              player: playerRole,
              board: [...gameState.board]
            }));
          }
        });
      }
      
      if (message.type === 'GET_MOVE_HISTORY') {
        ws.send(JSON.stringify({
          type: 'MOVE_HISTORY',
          history: gameState.moveHistory,
          currentIndex: gameState.currentMoveIndex
        }));
      }
      
      if (message.type === 'REPLAY_MOVE') {
        const { moveIndex } = message;
        
        if (moveIndex >= 0 && moveIndex < gameState.moveHistory.length) {
          gameState.currentMoveIndex = moveIndex;
          
          // Reconstruct board up to this move
          const newBoard = new Array(25).fill(0);
          for (let i = 0; i <= moveIndex; i++) {
            const move = gameState.moveHistory[i];
            newBoard[move.square] = move.value;
          }
          
          // Broadcast replay state
          broadcastToAllClients({
            type: 'REPLAY_UPDATE',
            board: newBoard,
            currentMove: moveIndex,
            totalMoves: gameState.moveHistory.length,
            move: gameState.moveHistory[moveIndex]
          });
        }
      }
      
      if (message.type === 'EXIT_REPLAY') {
        // Return to current game state
        broadcastToAllClients({
          type: 'REPLAY_EXIT',
          board: [...gameState.board],
          gameOver: gameState.gameOver,
          winner: gameState.winner,
          winningLine: gameState.winningLine
        });
      }
      
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    
    // If a player disconnects, end the game and reset players
    if (ws === gameState.players.odd || ws === gameState.players.even) {
      gameState.gameOver = true;
      
      // Clear the disconnected player
      if (ws === gameState.players.odd) {
        gameState.players.odd = null;
      }
      if (ws === gameState.players.even) {
        gameState.players.even = null;
      }
      
      broadcastToAllClients({
        type: 'PLAYER_DISCONNECTED',
        message: 'A player has disconnected. Game ended.'
      });
      
      // Reset game after a short delay
      setTimeout(() => {
        resetGame();
      }, 3000);
    }
  });
  
  ws.on('error', (error) => {
    // Silent error handling
  });
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  wss.close(() => {
    process.exit(0);
  });
});
