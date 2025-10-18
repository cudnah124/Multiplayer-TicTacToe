import React, { useState, useEffect, useRef } from "react";
import "./App.css";

interface GameState {
  board: number[];
  player: "ODD" | "EVEN" | null;
  gameOver: boolean;
  winner: "ODD" | "EVEN" | null;
  winningLine: number[] | null;
  connectionStatus: "connecting" | "connected" | "disconnected" | "waiting";
  isReplayMode: boolean;
  moveHistory: any[];
  currentMove: number;
  totalMoves: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    board: new Array(25).fill(0),
    player: null,
    gameOver: false,
    winner: null,
    winningLine: null,
    connectionStatus: "connecting",
    isReplayMode: false,
    moveHistory: [],
    currentMove: 0,
    totalMoves: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const [chaosMode, setChaosMode] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      setGameState((prev) => ({ ...prev, connectionStatus: "connected" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "PLAYER_ASSIGNED":
            setGameState((prev) => ({
              ...prev,
              player: message.player,
              board: message.board,
              connectionStatus: "waiting",
            }));
            break;

          case "GAME_READY":
            setGameState((prev) => ({
              ...prev,
              connectionStatus: "connected",
            }));
            break;

          case "UPDATE":
            setGameState((prev) => ({
              ...prev,
              board: prev.board.map((value, index) =>
                index === message.square ? message.value : value
              ),
            }));
            break;

          case "GAME_OVER":
            setGameState((prev) => ({
              ...prev,
              gameOver: true,
              winner: message.winner,
              winningLine: message.winningLine,
            }));
            break;

          case "GAME_RESET":
            setGameState((prev) => ({
              ...prev,
              board: message.board,
              gameOver: false,
              winner: null,
              winningLine: null,
              player: message.player || prev.player,
              connectionStatus: "connected",
            }));
            break;

          case "PLAYER_DISCONNECTED":
            setGameState((prev) => ({
              ...prev,
              gameOver: true,
              winner: null,
              connectionStatus: "waiting",
            }));
            break;

          case "MOVE_HISTORY":
            setGameState((prev) => ({
              ...prev,
              moveHistory: message.history,
              currentMove: message.currentIndex,
              totalMoves: message.history.length,
            }));
            break;

          case "REPLAY_UPDATE":
            setGameState((prev) => ({
              ...prev,
              board: message.board,
              currentMove: message.currentMove,
              totalMoves: message.totalMoves,
              isReplayMode: true,
            }));
            break;

          case "REPLAY_EXIT":
            setGameState((prev) => ({
              ...prev,
              board: message.board,
              gameOver: message.gameOver,
              winner: message.winner,
              winningLine: message.winningLine,
              isReplayMode: false,
            }));
            break;

          case "ERROR":
            break;
        }
      } catch (error) {
        // Silent error handling
      }
    };

    ws.onclose = () => {
      setGameState((prev) => ({ ...prev, connectionStatus: "disconnected" }));
    };

    ws.onerror = (error) => {
      setGameState((prev) => ({ ...prev, connectionStatus: "disconnected" }));
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSquareClick = (squareIndex: number) => {
    if (
      !wsRef.current ||
      gameState.gameOver ||
      gameState.connectionStatus !== "connected"
    ) {
      return;
    }

    // Send increment message to server
    const message = {
      type: "INCREMENT",
      square: squareIndex,
    };

    // Chaos mode: add random delay to simulate network issues
    const sendMessage = () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify(message));
      }
    };

    if (chaosMode) {
      const delay = Math.random() * 1000;
      setTimeout(sendMessage, delay);
    } else {
      sendMessage();
    }
  };

  const handleResetGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "RESET_GAME" }));
    }
  };

  const handleStartReplay = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "GET_MOVE_HISTORY" }));
    }
  };

  const handleReplayMove = (moveIndex: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "REPLAY_MOVE",
          moveIndex: moveIndex,
        })
      );
    }
  };

  const handleExitReplay = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "EXIT_REPLAY" }));
    }
  };

  const getSquareColor = (value: number, index: number) => {
    if (gameState.winningLine && gameState.winningLine.includes(index)) {
      return "#ff6b6b"; // Red for winning line
    }
    if (value === 0) return "#f0f0f0"; // Gray for empty
    if (value % 2 === 1) return "#4ecdc4"; // Teal for odd
    return "#45b7d1"; // Blue for even
  };

  const getConnectionStatusText = () => {
    switch (gameState.connectionStatus) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "waiting":
        return "Waiting for opponent...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const getConnectionStatusColor = () => {
    switch (gameState.connectionStatus) {
      case "connected":
        return "#4caf50";
      case "waiting":
        return "#ff9800";
      case "disconnected":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Multiplayer </h1>
        <h1> Odd/Even Tic-Tac-Toe </h1>
        <div className="game-info">
          <div className="connection-status">
            <span
              className="status-indicator"
              style={{ backgroundColor: getConnectionStatusColor() }}
            ></span>
            {getConnectionStatusText()}
          </div>
          {gameState.player && (
            <div className="player-info">
              You are: <strong>{gameState.player} Player</strong>
            </div>
          )}
        </div>
      </header>

      <main className="game-container">
        {gameState.gameOver ? (
          <div className="game-over">
            <h2>
              {gameState.winner
                ? `🎉 ${gameState.winner} Player Wins!`
                : gameState.connectionStatus === "waiting"
                ? "Waiting for opponent to reconnect..."
                : "Game Over"}
            </h2>
            {gameState.connectionStatus === "connected" && (
              <button onClick={handleResetGame} className="reset-button">
                New Game
              </button>
            )}
            {gameState.connectionStatus === "waiting" && (
              <p>Please wait for another player to join...</p>
            )}
          </div>
        ) : (
          <div className="game-board">
            {gameState.board.map((value, index) => (
              <button
                key={index}
                className="square"
                onClick={() => handleSquareClick(index)}
                style={{
                  backgroundColor: getSquareColor(value, index),
                  color: value === 0 ? "#666" : "#fff",
                }}
                disabled={gameState.connectionStatus !== "connected"}
              >
                {value}
              </button>
            ))}
          </div>
        )}

        <div className="game-controls">
          {!gameState.isReplayMode && (
            <div className="replay-controls">
              <button
                onClick={handleStartReplay}
                className="replay-button"
                disabled={gameState.moveHistory.length === 0}
              >
                📹 View Replay
              </button>
            </div>
          )}

          {gameState.isReplayMode && (
            <div className="replay-navigation">
              <div className="replay-info">
                Move {gameState.currentMove + 1} of {gameState.totalMoves}
              </div>
              <div className="replay-buttons">
                <button
                  onClick={() => handleReplayMove(0)}
                  disabled={gameState.currentMove === 0}
                  className="replay-nav-button"
                >
                  ⏮️ Start
                </button>
                <button
                  onClick={() =>
                    handleReplayMove(Math.max(0, gameState.currentMove - 1))
                  }
                  disabled={gameState.currentMove === 0}
                  className="replay-nav-button"
                >
                  ⏪ Previous
                </button>
                <button
                  onClick={() =>
                    handleReplayMove(
                      Math.min(
                        gameState.totalMoves - 1,
                        gameState.currentMove + 1
                      )
                    )
                  }
                  disabled={gameState.currentMove >= gameState.totalMoves - 1}
                  className="replay-nav-button"
                >
                  Next ⏩
                </button>
                <button
                  onClick={() => handleReplayMove(gameState.totalMoves - 1)}
                  disabled={gameState.currentMove >= gameState.totalMoves - 1}
                  className="replay-nav-button"
                >
                  End ⏭️
                </button>
                <button
                  onClick={handleExitReplay}
                  className="exit-replay-button"
                >
                  ❌ Exit Replay
                </button>
              </div>
            </div>
          )}

          <div className="chaos-mode">
            <label>
              <input
                type="checkbox"
                checked={chaosMode}
                onChange={(e) => setChaosMode(e.target.checked)}
              />
              Chaos Mode (Simulate Network Lag)
            </label>
          </div>

          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Click any square to increment its number by 1</li>
              <li>
                <strong>Odd Player</strong> wins with 5 odd numbers in a
                row/column/diagonal
              </li>
              <li>
                <strong>Even Player</strong> wins with 5 even numbers in a
                row/column/diagonal
              </li>
              <li>Both players can click any square at any time!</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
