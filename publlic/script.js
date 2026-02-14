const socket = io();
const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const msgEl = document.getElementById("msg");

let board=[],current='black',gameOver=false;
let sr=null,sc=null;
let touchStartX=null;

socket.on('init',data=>{
  board=data.board;
  current=data.current;
  gameOver=data.gameOver;
  draw();
});

socket.on('update',data=>{
  board=data.board;
  current=data.current;
  gameOver=data.gameOver;
  draw();
  if(data.winner)msgEl.textContent = data.winner.toUpperCase()+" WIN!!";
});

socket.on('rotate-request',data=>{
  sr=data.sr;
  sc=data.sc;
  msgEl.textContent="3x3 회전 스와이프 (좌:왼쪽 우:오른쪽)";
});

function draw(){
  boardEl.innerHTML="";
  for(let r=0;r<6;r++){
    for(let c=0;c<6;c++){
      const cell=document.createElement("div");
      cell.className="cell";
      if(c==2)cell.classList.add("bold-right");
      if(r==2)cell.classList.add("bold-bottom");

      if(!board[r][c]&&!gameOver){
        cell.addEventListener("click",()=>place(r,c));
        cell.addEventListener("touchstart",e=>touchStartX=e.touches[0].clientX);
        cell.addEventListener("touchend",touchEndCell);
      }
      if(board[r][c]){
        const dot = document.createElement("div");
        dot.className=board[r][c];
        cell.appendChild(dot);
      }
      boardEl.appendChild(cell);
    }
  }
  turnEl.textContent = gameOver ? "" : current.toUpperCase()+" TURN";
}

function place(r,c){
  socket.emit('place',{r,c});
}

function touchEndCell(e){
  if(sr===null||sc===null||touchStartX===null)return;
  let dx=e.changedTouches[0].clientX-touchStartX;
  if(Math.abs(dx)<20)return;
  const dir = dx<0?'left':'right';
  socket.emit('rotate',{sr,sc,dir});
  sr=sc=null;
  msgEl.textContent="";
  touchStartX=null;
}

function resetGame(){
  socket.emit('reset');
}
