const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let board = Array.from({ length: 6 }, () => Array(6).fill(null));
let current = "black";
let gameOver = false;

io.on("connection", (socket) => {
  socket.emit("init", { board, current, gameOver });

  socket.on("place", ({ r, c }) => {
    if (gameOver || board[r][c] !== null) return;
    board[r][c] = current;

    let sr = r < 3 ? 0 : 3;
    let sc = c < 3 ? 0 : 3;

    socket.emit("rotate-request", { sr, sc });
    io.emit("update", { board, current, gameOver });
  });

  socket.on("rotate", ({ sr, sc, dir }) => {
    if (gameOver) return;

    rotateMatrix(sr, sc, dir);

    const winner = checkWin();
    if (winner) gameOver = true;
    current = current === "black" ? "white" : "black";

    io.emit("update", { board, current, gameOver, winner });
  });

  socket.on("reset", () => {
    board = Array.from({ length: 6 }, () => Array(6).fill(null));
    current = "black";
    gameOver = false;
    io.emit("init", { board, current, gameOver });
  });
});

function rotateMatrix(sr, sc, dir) {
  let temp = Array.from({ length: 3 }, () => Array(3));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      temp[r][c] = board[sr + r][sc + c];

  let rot = Array.from({ length: 3 }, () => Array(3));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      if (dir === "left") rot[2 - c][r] = temp[r][c];
      else rot[c][2 - r] = temp[r][c];
    }

  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      board[sr + r][sc + c] = rot[r][c];
}

function checkWin() {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  const colors = ["black", "white"];
  for (let color of colors) {
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== color) continue;
        for (let [dr, dc] of dirs) {
          let count = 1,
            nr = r + dr,
            nc = c + dc;
          while (
            nr >= 0 &&
            nr < 6 &&
            nc >= 0 &&
            nc < 6 &&
            board[nr][nc] === color
          ) {
            count++;
            nr += dr;
            nc += dc;
          }
          if (count >= 5) return color;
        }
      }
  }
  return null;
}

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
