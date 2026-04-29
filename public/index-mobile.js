if(sessionStorage.getItem("deviceMode") !== "mobile"){
window.location.href = "/lobby.html";
}

let bgMusic;
let musicEnabled = true;
let sfxEnabled = true;   // 🔥 ADICIONE ISSO
let currentVolume = 0.2;
let masterVolume = 0.2;
let activePiece = null;
let selectedSlotCard = null;
let lastPlayedCardId = null;
let lastPlayedSlot = null;
let lastPlayedCardEl = null;
let lastServerSlots = null;
let draggingTwist = null;
let selectedFrom = null;
let selectedCard = null;
let selectedIndex = null;
let selectedSlot = null;
let selectedCardId = null;
let formationEditMode = false;
let formationTemp = null;
let lastGoalTime = 0;
let lastDragTwistMouse = { x: 0, y: 0 };

let formation = {
blue: { A:3, M:4, D:3, G:3 },
red:  { A:3, M:4, D:3, G:3 }
};

let formationLocked = {
blue: false,
red: false
};

let formationTokens = {
blue: 3,
red: 3
};

let serverHandCounts = {
blue: null,
red: null
};

let expulsions = {
blue:{ total:0, A:0, M:0, D:0 },
red:{ total:0, A:0, M:0, D:0 }
};

function setLastPlayedCard(el){

if(lastPlayedCardEl){
  lastPlayedCardEl.classList.remove("last-played-card");
}

lastPlayedCardEl = el;

if(lastPlayedCardEl){
  lastPlayedCardEl.classList.add("last-played-card");
}

}
let lastPlayedColor = null;

// 🔥 carregar preferências salvas
window.addEventListener("DOMContentLoaded", () => {

bgMusic = document.getElementById("bgMusic");
// recuperar estado salvo
const savedMusic = sessionStorage.getItem("musicEnabled");
const savedVolume = sessionStorage.getItem("musicVolume");

const savedSfx = sessionStorage.getItem("sfxEnabled");
if(savedSfx !== null){
sfxEnabled = savedSfx === "true";
}

if(savedMusic !== null){
  musicEnabled = savedMusic === "true";
}

if(savedVolume !== null){
  currentVolume = parseFloat(savedVolume);
}

masterVolume = currentVolume;
bgMusic.volume = currentVolume;

// atualizar botão
const musicBtn = document.getElementById("musicToggle");
if(musicBtn){
  musicBtn.innerText = musicEnabled ? "🎵 ON" : "🎵 OFF";
}

const sfxBtn = document.getElementById("sfxToggle");

if(sfxBtn){
  sfxBtn.innerText = sfxEnabled ? "🔊 ON" : "🔇 OFF";
}

const slider = document.getElementById("volumeSlider");

if(slider){

  slider.value = currentVolume;

  slider.addEventListener("input", ()=>{

  currentVolume = parseFloat(slider.value);
  masterVolume = currentVolume;

  bgMusic.volume = currentVolume;

  sessionStorage.setItem("musicVolume", currentVolume);

});

}

});

function positionDecks(){

document.querySelectorAll(".deck-wrapper").forEach(deck => {

  const anchorId = deck.dataset.anchor
  const anchor   = document.getElementById(anchorId)

  if(!anchor) return

  deck.style.left = anchor.style.left
  deck.style.top  = anchor.style.top

})

}

window.addEventListener("load", ()=>{
positionDecks();
positionSlots();
updateBoardTransform();
updateFormationUI();
updateHandCounters();
bindFormationTouch();
});

function startMusicOnFirstInteraction(){

if(!musicEnabled) return;

bgMusic.play().catch(()=>{});

document.removeEventListener("click", startMusicOnFirstInteraction);
}

document.addEventListener("click", startMusicOnFirstInteraction);

const audioCache = {};

function playSFX(src){

if(!sfxEnabled) return;

if(!audioCache[src]){
  audioCache[src] = new Audio(src);
}

const sound = audioCache[src].cloneNode();
sound.volume = masterVolume;
sound.play().catch(()=>{});
}

const SOUNDS = {
drag: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/dragtoken_th8vbx.mp3",
draw: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/drawcard_ui0b56.mp3",
shuffle: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/shufflecard_k795un.mp3",
throw: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868298/throwingcard_uf8his.mp3",
kick: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771880976/kickball_ebq3wi.mp3",
whistle: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868298/whistle_zwznax.mp3",
drop: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1773593574/dragcard_qgappw.mp3",
};

document.getElementById("musicToggle")
?.addEventListener("click", ()=>{

  musicEnabled = !musicEnabled;

  sessionStorage.setItem("musicEnabled", musicEnabled);

  if(musicEnabled){
    bgMusic.play();
    document.getElementById("musicToggle").innerText = "🎵 ON";
  } else {
    bgMusic.pause();
    document.getElementById("musicToggle").innerText = "🎵 OFF";
  }

});

const subSound = new Audio("https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868298/whistle_zwznax.mp3");
subSound.preload = "auto";

function showSubEffect(){
const overlay = document.getElementById("subOverlay");
if(!overlay) return;

overlay.style.display = "flex";

if(sfxEnabled){
  subSound.currentTime = 0;
  subSound.volume = masterVolume;
  subSound.play().catch(()=>{});
}

clearTimeout(window.subOverlayTimer);
window.subOverlayTimer = setTimeout(()=>{
  overlay.style.display = "none";
}, 2200); // use o MESMO tempo do gol se quiser igual
}

function playGoalEffect(){

const now = Date.now();

if(now - lastGoalTime < 1000) return;
lastGoalTime = now;

playSFX("https://res.cloudinary.com/dzjwlafsx/video/upload/v1775058629/gol_wc76tf.mp3");

const overlay = document.getElementById("goalOverlay");
if(!overlay) return;

overlay.style.display = "flex";

setTimeout(()=>{
  overlay.style.display = "none";
}, 2000);
}

document.getElementById("sfxToggle")
?.addEventListener("click", ()=>{

sfxEnabled = !sfxEnabled;

sessionStorage.setItem("sfxEnabled", sfxEnabled);

document.getElementById("sfxToggle").innerText =
  sfxEnabled ? "🔊 ON" : "🔇 OFF";

});


const socket = io(window.location.origin, {
transports: ["polling", "websocket"],
reconnection: true,
reconnectionAttempts: Infinity,
reconnectionDelay: 1000,
reconnectionDelayMax: 5000,
timeout: 20000
});
// 🔥 LISTENERS DEVEM VIR ANTES DO joinRoom

socket.on("syncPlayers", (players)=>{
if(!players) return;

playerBlueNameEl.innerText = players.blue;
playerRedNameEl.innerText  = players.red;
});

socket.on("syncSpectators", (list)=>{
const el = spectatorListEl;

if(!list || list.length === 0){
  el.innerText = "Nenhum";
  return;
}

  el.innerHTML = list
  .map(name => `<span style="color:yellow">${name}</span>`)
  .join(", ");
});

socket.on("syncTokens", (tokens)=>{

setTimeout(()=>{

  Object.keys(tokens).forEach(anchor=>{

    const el = document.getElementById(anchor);
    if(!el) return;

    const pos = clampTokenPosition(
      parseFloat(tokens[anchor].x),
      parseFloat(tokens[anchor].y)
    );

    el.style.left = pos.x + "px";
    el.style.top  = pos.y + "px";

  });

  applyAnchors();

}, 50);

});

socket.on("actionLog", ({ text, color })=>{
addLogEntry(text, color);
}); 

let decks = {}; // cliente não controla decks, apenas evita erro

const board = document.getElementById("board");

let pinchZoom = 1;
let pinchStartDist = null;
let moveQueue = [];
let moveScheduled = false;

function processMoveQueue(){

moveQueue.forEach(move => {

  const anchor = document.getElementById(move.anchor);
  if(!anchor) return;

  const pos = clampTokenPosition(
    parseFloat(move.x),
    parseFloat(move.y)
  );

  anchor.style.left = pos.x + "px";
  anchor.style.top  = pos.y + "px";

});

applyAnchors();

moveQueue = [];
moveScheduled = false;

}

board.addEventListener("touchstart", (e)=>{

const clickable = e.target.closest(
".hand-card, .fan-card, .slot-pile, .deck-wrapper, button, .piece, .twist-card"
);

// 🔥 se tocou em algo interativo, NÃO faz pan
if(clickable) return;

});

function applyAnchors(){

  document.querySelectorAll(".piece").forEach(piece=>{
    const anchor = document.getElementById(piece.dataset.anchor);
    if(!anchor) return;

    piece.style.left = anchor.style.left;
    piece.style.top  = anchor.style.top;

    if(
      piece.classList.contains("cardred") ||
      piece.dataset.anchor?.startsWith("red")
    ){
      piece.style.zIndex = 999999;
      piece.style.pointerEvents = "auto";
    }
  });

  updateExpulsionTokenScale();
}

function positionSlots(){

document.querySelectorAll(".slot-pile").forEach(slot=>{

  const anchorId = slot.dataset.anchor;
  const anchor = document.getElementById(anchorId);

  if(!anchor) return;

  slot.style.left = anchor.style.left;
  slot.style.top  = anchor.style.top;

  // 🔥 SEM MAIS NADA
});

}

const slotPositionsSecondHalf = {

A: {left: "783px", top: "370px"},
M: {left: "626px", top: "370px"},
D: {left: "464px", top: "370px"},
G: {left: "305px", top: "370px"},

A_red: {left: "344px", top: "235px"},
M_red: {left: "502px", top: "235px"},
D_red: {left: "663px", top: "235px"},
G_red: {left: "823px", top: "235px"}
};


// ===========================
// 🔥 CACHE DE ELEMENTOS FIXOS
// ===========================

const handEl        = document.getElementById("hand");
const handRedEl     = document.getElementById("hand_red");
const topbarEl      = document.getElementById("topbar");
const tempoStatusEl = document.getElementById("tempoStatus");
const roomCodeBoxEl = document.getElementById("roomCodeBox");
const spectatorListEl = document.getElementById("spectatorList");
const playerBlueNameEl = document.getElementById("playerBlueName");
const playerRedNameEl  = document.getElementById("playerRedName");

const playerRole = sessionStorage.getItem("playerRole");
if(playerRole === "blue"){
document.body.classList.add("blue-view");
}

if(playerRole === "red"){
document.body.classList.add("red-view");
}

if(playerRole === "red"){
document.body.classList.add("red-player");
}
const playerName = sessionStorage.getItem("playerName");

const handInnerBlue = handEl.querySelector(".hand-inner");
const handInnerRed  = handRedEl.querySelector(".hand-inner");

const slotPileEls = document.querySelectorAll(".slot-pile");
const deckWrapperEls = document.querySelectorAll(".deck-wrapper");

function updateBoardTransform(){

const baseWidth  = 1152;
const baseHeight = 658;

const topbarHeight = document.getElementById("topbar").offsetHeight;
const handHeight = 90;
const safeBottom = 20;

const availableWidth  = window.innerWidth;
const availableHeight = window.innerHeight - topbarHeight - handHeight - safeBottom;

const scaleX = availableWidth / baseWidth;
const scaleY = availableHeight / baseHeight;

let scale = Math.min(scaleX, scaleY);
scale *= 1.6 * pinchZoom;

if(playerRole === "red"){
  board.style.transform =
    `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale}) rotate(180deg)`;
}else{
  board.style.transform =
    `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
}

}

let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;


board.addEventListener("touchstart", (e)=>{

const clickable = e.target.closest(
  ".hand-card, .fan-card, .slot-pile, .deck-wrapper, button, .piece, .twist-card"
);

// se tocou em algo interativo, NÃO faz pan
if(clickable){
  isPanning = false;
  return;
}

if(e.touches.length === 1){
  isPanning = true;
  startX = e.touches[0].clientX - panX;
  startY = e.touches[0].clientY - panY;
}

if(e.touches.length === 2){

  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;

  pinchStartDist = Math.sqrt(dx*dx + dy*dy);
}

}, {passive:false});


board.addEventListener("touchmove", (e)=>{

if(activePiece){
  return;
}

if(e.touches.length === 2){

  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;

  const dist = Math.sqrt(dx*dx + dy*dy);

  if(pinchStartDist){
    const ratio = dist / pinchStartDist;

    pinchZoom *= ratio;
    pinchZoom = Math.max(0.5, Math.min(3, pinchZoom));

    pinchStartDist = dist;

    updateBoardTransform();
  }

  return;
}

if(!isPanning) return;

panX = e.touches[0].clientX - startX;
panY = e.touches[0].clientY - startY;

updateBoardTransform();

}, {passive:false});


board.addEventListener("touchend", ()=>{
isPanning = false;
});


board.addEventListener("touchend", ()=>{
pinchStartDist = null;
});

window.addEventListener("resize", updateBoardTransform);
window.addEventListener("load", updateBoardTransform);


const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("room");

if(!roomCode || !playerName || !playerRole){
console.log("Sessão inválida. Voltando para lobby.");
window.location.href = "/";
throw new Error("Sessão inválida");
}

// 🚀 ENTRA NA SALA
socket.emit("reconnectRoom", {
name: playerName,
role: playerRole,
roomCode: roomCode
});

function rejoinCurrentRoom(){
if(!playerName || !playerRole || !roomCode) return;

socket.emit("reconnectRoom", {
  name: playerName,
  role: playerRole,
  roomCode: roomCode
});
}

socket.on("connect", () => {
console.log("✅ socket conectado:", socket.id);
rejoinCurrentRoom();
});

socket.on("reconnect", () => {
console.log("🔁 socket reconectado:", socket.id);
rejoinCurrentRoom();
});

socket.on("disconnect", (reason) => {
console.log("❌ socket desconectado:", reason);
addLogEntry?.("Conexão instável. Tentando reconectar...", "white");
});

socket.on("connect_error", (err) => {
console.log("❌ connect_error:", err.message);
});

// 4️⃣ Mostra código
roomCodeBoxEl.innerText = "Sala: " + roomCode;

roomCodeBoxEl.addEventListener("click", copyRoomCode);


if(roomCode && playerRole === "spectator"){

    let markVisible = false;

    board.addEventListener("click", (e)=>{

    const p = getCorrectPoint(e.clientX, e.clientY);
    const x = p.x;
    const y = p.y;

      if(markVisible){
        socket.emit("removeMark");
        markVisible = false;
      } else {
        socket.emit("spectatorMark", {x,y});
        markVisible = true;
      }

    });

  }


socket.on("spawnMark", ({x,y})=>{

  // remove qualquer anterior
  const existing = document.querySelector(".spectator-cross");
  if(existing) existing.remove();

  const cross = document.createElement("img");
  cross.src = "https://i.imgur.com/ql48f5G.png";
  cross.className = "spectator-cross";

  cross.style.left = x + "px";
  cross.style.top  = y + "px";

  board.appendChild(cross);

    // 🔥 some automaticamente após 3 segundos
setTimeout(()=>{
  cross.remove();
},5000);

});
socket.on("removeMark", ()=>{
  const existing = document.querySelector(".spectator-cross");
  if(existing) existing.remove();
});

console.log("Jogador:", playerName, "Role:", playerRole);

if (playerRole !== "blue") {
handInnerBlue.style.display = "none";
}

if (playerRole !== "red") {
handInnerRed.style.display = "none";
}




console.log("Jogador entrou como:", playerRole);
/* ===================== */
/* DADOS */
let draggedFreeCard = null;

let hand = [];
let hand_red = [];

/* ===================== */
/* EMBARALHAR TODOS OS DECKS NO INÍCIO */

function shuffleAllDecks(){
console.log("Decks sincronizados pelo servidor.");
}


let slotPiles = {
A:[], M:[], D:[], G:[],
A_red:[], M_red:[], D_red:[], G_red:[],
P1:[], P2:[], P1_red:[], P2_red:[]
};

let slotFanOpen = {
A:false,M:false,D:false,G:false,
A_red:false,M_red:false,D_red:false,G_red:false,
P1:false,P2:false,
P1_red:false,P2_red:false
};



/* ===================== */
/* SLOT HIGHLIGHT */

function highlightSlot(type){

const f = formation[playerRole];
const counts = (playerRole === "blue") ? hand : hand_red;

const base = type.replace("_red","");
const current = counts.filter(c => c.type === type).length;

if(base !== "P" && base !== "T" && f && current >= f[base]){
  return;
}

clearHighlight();

document.querySelector(`.slot-pile[data-slot="${type}"]`)
  ?.classList.add("highlight");

if(type === "P"){
  ["P1","P2"].forEach(p=>{
    document.querySelector(`.slot-pile[data-slot="${p}"]`)
      ?.classList.add("highlight");
  });
}

if(type === "P_red"){
  ["P1_red","P2_red"].forEach(p=>{
    document.querySelector(`.slot-pile[data-slot="${p}"]`)
      ?.classList.add("highlight");
  });
}

document.querySelector(`[data-deck="${type}"]`)
  ?.closest(".deck-wrapper")
  ?.classList.add("highlight-zone");

if(type === "T"){
  return;
}

if(type.includes("_red")){
  document.getElementById("hand_red")
    ?.classList.add("highlight-zone");
} else {
  document.getElementById("hand")
    ?.classList.add("highlight-zone");
}
}

function clearHighlight() {

/* Remove slot highlight */
slotPileEls.forEach(s => s.classList.remove("highlight"));

/* Remove deck highlight */
document.querySelectorAll(".deck-wrapper")
  .forEach(d => d.classList.remove("highlight-zone"));

/* Remove highlight das mãos */
document.getElementById("hand")
  ?.classList.remove("highlight-zone");

document.getElementById("hand_red")
  ?.classList.remove("highlight-zone");
}

function selectElement(el){

document.querySelectorAll(".selected-card, .selected-zone")
  .forEach(e => e.classList.remove("selected-card","selected-zone"));

el.classList.add("selected-card");
}

function clearSelection(){
selectedCard = null;
selectedFrom = null;
selectedIndex = null;
selectedSlot = null;
selectedCardId = null;
selectedSlotCard = null;

document.querySelectorAll(".selected-card, .selected-zone")
  .forEach(c => c.classList.remove("selected-card", "selected-zone"));

clearHighlight();
}

let radialMenu = null;

function closeRadial(){
if(radialMenu){
  radialMenu.remove();
  radialMenu = null;
}
clearHighlight();
}

function openRadial(x, y, options){

closeRadial();

radialMenu = document.createElement("div");
radialMenu.className = "radial-menu";
radialMenu.style.display = "flex";
radialMenu.style.flexDirection = "column";
radialMenu.style.gap = "6px";

const menuWidth = 140;
const menuHeight = options.length * 40;

let posX = x + 10;
let posY = y + 10;

if(posX + menuWidth > window.innerWidth){
  posX = x - menuWidth - 10;
}

if(posY + menuHeight > window.innerHeight){
  posY = y - menuHeight - 10;
}

if(posX < 0) posX = 10;
if(posY < 0) posY = 10;

radialMenu.style.left = posX + "px";
radialMenu.style.top  = posY + "px";

options.forEach((opt)=>{
  const btn = document.createElement("div");
  btn.className = "radial-btn";
  btn.innerText = opt.label;

  btn.onclick = ()=>{
    opt.action();
    if(opt.keepOpen){
      if(radialMenu){
        radialMenu.remove();
        radialMenu = null;
      }
      return;
    }
    closeRadial();
  };

  radialMenu.appendChild(btn);
});

document.body.appendChild(radialMenu);
}

function updateHandCounters(){

function countTypes(handArray){
  return {
    A: handArray.filter(c=>c.type==="A").length,
    M: handArray.filter(c=>c.type==="M").length,
    D: handArray.filter(c=>c.type==="D").length,
    G: handArray.filter(c=>c.type==="G").length,
    P: handArray.filter(c=>c.type==="P").length,

    A_red: handArray.filter(c=>c.type==="A_red").length,
    M_red: handArray.filter(c=>c.type==="M_red").length,
    D_red: handArray.filter(c=>c.type==="D_red").length,
    G_red: handArray.filter(c=>c.type==="G_red").length,
    P_red: handArray.filter(c=>c.type==="P_red").length
  };
}


function formatAdj(value){
  if(value > 0) return `+${value}`;
  return `${value}`;
}

function renderBlueCounter(data){
  if(!data) return;

  const fBlue = formation.blue;
  const adjBlue = getTotalAdjustments("blue");
  const limitBlue = getExpulsionLimit("blue");

  const totalBlue = data.A + data.M + data.D + data.G;

  const el = document.getElementById("counter_blue");
  if(!el) return;

  el.innerHTML =
    `A:${data.A}/${fBlue.A} M:${data.M}/${fBlue.M} D:${data.D}/${fBlue.D} G:${data.G}/${fBlue.G}<br>` +
    `Total: ${totalBlue}/${limitBlue}<br>` +
    `A: ${formatAdj(adjBlue.A)}<br>` +
    `M: ${formatAdj(adjBlue.M)}<br>` +
    `D: ${formatAdj(adjBlue.D)}<br>` +
    `G: ${formatAdj(adjBlue.G)}`;
}

function renderRedCounter(data){
  if(!data) return;

  const fRed = formation.red;
  const adjRed = getTotalAdjustments("red");
  const limitRed = getExpulsionLimit("red");

  const totalRed = data.A_red + data.M_red + data.D_red + data.G_red;

  const el = document.getElementById("counter_red");
  if(!el) return;

  el.innerHTML =
    `A:${data.A_red}/${fRed.A} M:${data.M_red}/${fRed.M} D:${data.D_red}/${fRed.D} G:${data.G_red}/${fRed.G}<br>` +
    `Total: ${totalRed}/${limitRed}<br>` +
    `A: ${formatAdj(adjRed.A)}<br>` +
    `M: ${formatAdj(adjRed.M)}<br>` +
    `D: ${formatAdj(adjRed.D)}<br>` +
    `G: ${formatAdj(adjRed.G)}`;
}

const localBlue = countTypes(hand);
const localRed = countTypes(hand_red);

if(playerRole === "blue"){
  renderBlueCounter(localBlue);
  renderRedCounter(serverHandCounts.red || localRed);
}

if(playerRole === "red"){
  renderRedCounter(localRed);
  renderBlueCounter(serverHandCounts.blue || localBlue);
}

if(playerRole === "spectator"){
  renderBlueCounter(serverHandCounts.blue || localBlue);
  renderRedCounter(serverHandCounts.red || localRed);
}
}

function getFormationAdjustments(f){
  const adj = {
    A: 0,
    M: 0,
    D: 0,
    G: 0
  };

  if(f.A === 4){
    adj.M = -1;
    adj.D = -1;
  }

  if(f.A === 5){
    adj.M = -2;
    adj.D = -1;
  }

  if(f.M === 3){
    adj.A = -1;
    adj.D = -1;
  }

  if(f.D === 3){
    adj.D = 1;
    adj.G = 1;
  }

  if(f.D === 4){
    adj.A = 1;
    adj.D = 1;
  }

  if(f.D === 5){
    adj.A = 1;
    adj.M = 1;
  }

  return adj;
}

function getExpulsionLimit(role){
const total = expulsions?.[role]?.total || 0;
return Math.max(9, 13 - total);
}

function getExpulsionAdjustment(role, type){
const exp = expulsions?.[role];
if(!exp) return 0;

// ônus acumulado por posição
// 1 expulsão naquela posição = -1
// 2 expulsões naquela posição = -2 acumulado visual
return -(exp[type] || 0);
}

function getTotalAdjustments(role){
  const f = formation[role];
  const base = getFormationAdjustments(f);

  return {
    A: base.A + getExpulsionAdjustment(role, "A"),
    M: base.M + getExpulsionAdjustment(role, "M"),
    D: base.D + getExpulsionAdjustment(role, "D"),
    G: base.G + getExpulsionAdjustment(role, "G") // 🔥 ADICIONE ISSO
  };
}

function updateFormationUI(){

const tableBlue = document.getElementById("formationTable");
const tableRed  = document.getElementById("formationTable_red");

function updateOneTable(table, data, isEditing){
  if(!table || !data) return;

  if(isEditing){
    table.classList.add("editing");
  }else{
    table.classList.remove("editing");
  }

  ["A","M","D"].forEach(type=>{
    table.querySelectorAll(`.formation-cell[data-type="${type}"]`)
      .forEach(c => c.classList.remove("active"));

    const selected = table.querySelector(
      `.formation-cell[data-type="${type}"][data-value="${data[type]}"]`
    );

    if(selected){
      selected.classList.add("active");
    }
  });
}

const blueData =
  (playerRole === "blue" && formationEditMode && formationTemp)
    ? formationTemp
    : formation.blue;

const redData =
  (playerRole === "red" && formationEditMode && formationTemp)
    ? formationTemp
    : formation.red;

updateOneTable(
  tableBlue,
  blueData,
  playerRole === "blue" && formationEditMode
);

updateOneTable(
  tableRed,
  redData,
  playerRole === "red" && formationEditMode
);

const container = document.getElementById("formationContainer");

if(container && !container.querySelector(".expulsion-btn")){

const btn = document.createElement("button");
btn.className = "expulsion-btn";
btn.innerText = "Expulsão";

btn.style.marginTop = "6px";

btn.onclick = openExpulsionMenu;

container.appendChild(btn);
}
}


function startFormationEditMobile(tableId){
if(playerRole !== "blue" && playerRole !== "red") return;

formationEditMode = true;
formationTemp = {
  ...formation[playerRole]
};

positionFormationActions(tableId || getCurrentFormationTableId());

const actions = document.getElementById("formationActions");
if(actions){
  actions.style.display = "flex";
}

updateFormationUI();
}

function cancelFormationMobile(){
formationEditMode = false;
formationTemp = null;

const actions = document.getElementById("formationActions");
if(actions){
  actions.style.display = "none";
}

updateFormationUI();
updateHandCounters();
}

function confirmFormationMobile(){

if(!formationEditMode || !formationTemp) return;

const total = 
  (parseInt(formationTemp.A) || 0) +
  (parseInt(formationTemp.M) || 0) +
  (parseInt(formationTemp.D) || 0);

if(total !== 10){
  openInfoModal(
    "Formação inválida",
    "A soma de A + M + D deve ser exatamente 10."
  );
  return;
}

socket.emit("updateFormation", {
  formation: {
    ...formationTemp,
    G: 3
  }
});

formation[playerRole] = {
  ...formationTemp,
  G: 3
};  

formationEditMode = false;
formationTemp = null;

const actions = document.getElementById("formationActions");
if(actions){
  actions.style.display = "none";
}

updateFormationUI();
updateHandCounters();
}

document.getElementById("formationCancelBtn")
?.addEventListener("click", cancelFormationMobile);

document.getElementById("formationConfirmBtn")
?.addEventListener("click", confirmFormationMobile);

function bindFormationTouch(){

const tableBlue = document.getElementById("formationTable");
const tableRed  = document.getElementById("formationTable_red");

[tableBlue, tableRed].filter(Boolean).forEach(table=>{

  table.addEventListener("touchstart", onFormationTouchStart, { passive:false });
  table.addEventListener("click", onFormationTouchStart);

});
}

function positionFormationActions(tableId){

const actions = document.getElementById("formationActions");
const table = document.getElementById(tableId);

if(!actions || !table) return;

const rect = table.getBoundingClientRect();

actions.style.position = "fixed";
actions.style.display = "flex";
actions.style.top = "";
actions.style.bottom = "";
actions.style.transform = "none";

// azul: abre à direita da tabela
if(tableId === "formationTable"){
  actions.style.left = (rect.right + 12) + "px";
  actions.style.top  = (rect.top + rect.height / 2 - 35) + "px";
}

// vermelho: abre à esquerda da tabela
if(tableId === "formationTable_red"){
  actions.style.left = (rect.left - 152) + "px";
  actions.style.top  = (rect.top + rect.height / 2 - 35) + "px";
}

// evita sair da tela
const menuWidth = 140;
const menuHeight = 80;

let left = parseFloat(actions.style.left);
let top = parseFloat(actions.style.top);

if(left < 8) left = 8;
if(left + menuWidth > window.innerWidth - 8){
  left = window.innerWidth - menuWidth - 8;
}

if(top < 8) top = 8;
if(top + menuHeight > window.innerHeight - 8){
  top = window.innerHeight - menuHeight - 8;
}

actions.style.left = left + "px";
actions.style.top = top + "px";
}

function getCurrentFormationTableId(){
return playerRole === "red" ? "formationTable_red" : "formationTable";
}


function openExpulsionMenu(){

if(playerRole !== "blue" && playerRole !== "red"){
  alert("Espectadores não podem usar expulsão.");
  return;
}

createExpulsionModal();
}

function createExpulsionModal(){

// remove se já existir
document.getElementById("expulsionModal")?.remove();

const modal = document.createElement("div");
modal.id = "expulsionModal";

modal.style.position = "fixed";
modal.style.inset = "0";
modal.style.background = "rgba(0,0,0,0.6)";
modal.style.display = "flex";
modal.style.justifyContent = "center";
modal.style.alignItems = "center";
modal.style.zIndex = "999999";

modal.innerHTML = `
  <div style="
    background:#111;
    padding:10px;
    border-radius:12px;
    text-align:center;
    min-width:260px;
    font-family:Arial, sans-serif;
    color:white;
    font-size:13px;
  ">
    <h3 style="margin-top:0;">Escolha a posição da expulsão</h3>

    <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
      <button data-exp="A">Ataque</button>
      <button data-exp="M">Meio</button>
      <button data-exp="D">Defesa</button>
    </div>

    <button id="cancelExpulsion" style="margin-top:12px;">
      Cancelar
    </button>
  </div>
`;

document.body.appendChild(modal);

// cancelar
modal.querySelector("#cancelExpulsion").onclick = () => modal.remove();

// botões
modal.querySelectorAll("[data-exp]").forEach(btn => {
  btn.onclick = () => {
    const pos = btn.dataset.exp;
    modal.remove();
    confirmExpulsion(pos);
  };
});
}

function confirmExpulsion(pos){

const total = expulsions[playerRole]?.total || 0;

if(total >= 4){
  alert("Limite de expulsões atingido.");
  return;
}

const proxima = total + 1;

const nomes = {
  A:"Ataque",
  M:"Meio-campo",
  D:"Defesa"
};

const ok = confirm(
  `Confirmar expulsão em ${nomes[pos]}?\n\n` +
  `Expulsão nº ${proxima}\n` +
  `Ônus aplicado: -${proxima}\n\n` +
  `Isso irá sacrificar 1 carta dessa posição e reduzir 1 da tabela.`
);

if(!ok) return;

socket.emit("useExpulsion", { position: pos });
}

function onFormationTouchStart(e){

if(e.target.closest(".piece, .cardred")) return;

const table = e.currentTarget;
const cell = e.target.closest(".formation-cell");
if(!cell) return;

const isBlueTable = table.id === "formationTable";
const isRedTable  = table.id === "formationTable_red";

if(playerRole === "blue" && !isBlueTable) return;
if(playerRole === "red" && !isRedTable) return;
if(playerRole === "spectator") return;

e.preventDefault();
e.stopPropagation();

const touch = e.touches?.[0] || e.changedTouches?.[0];
const x = touch ? touch.clientX : (e.clientX || window.innerWidth / 2);
const y = touch ? touch.clientY : (e.clientY || window.innerHeight / 2);

if(!formationEditMode){
  openRadial(x, y, [
  {
    label: "Alterar formação",
    action: ()=>{
      startFormationEditMobile(table.id);
    }
  },
  {
    label: "Expulsão",
    action: openExpulsionMenu
  },
  {
    label: "Cancelar",
    action: ()=>{}
  }
]);
  return;
}

const type = cell.dataset.type;
const value = parseInt(cell.dataset.value);

if(!type || Number.isNaN(value) || !formationTemp) return;

formationTemp[type] = value;
updateFormationUI();
updateHandCounters();

positionFormationActions(table.id);
const actions = document.getElementById("formationActions");
if(actions){
  actions.style.display = "flex";
}
}


function highlightTwistDeck(){

clearHighlight();

document.querySelector('[data-deck="T"]')
  ?.closest(".deck-wrapper")
  ?.classList.add("highlight-zone");

}

/* ===================== */
/* BLOQUEIO DE JOGADA ATÉ TER 13 CARTAS */

function mustRefillHand(player){

const currentHand = player === "blue" ? hand : hand_red;

const totalAMDG = currentHand.filter(c =>
  c.type === "A" || c.type === "M" || c.type === "D" || c.type === "G" ||
  c.type === "A_red" || c.type === "M_red" || c.type === "D_red" || c.type === "G_red"
).length;

const amdgDecks = player === "blue"
  ? ["A","M","D","G"]
  : ["A_red","M_red","D_red","G_red"];

const anyDeckEmpty = amdgDecks.some(type =>
  !decks[type] || decks[type].length === 0
);

if(anyDeckEmpty){
  return false;
}

const required = getExpulsionLimit(player);
return totalAMDG < required;
}

function getHandArrayByPlayer(player){
return player === "blue" ? hand : hand_red;
}

function getFormationByPlayer(player){
return player === "blue" ? formation.blue : formation.red;
}

function countTypeInHand(player, deckType){
const currentHand = getHandArrayByPlayer(player);
return currentHand.filter(c => c.type === deckType).length;
}

function getBaseType(deckType){
return deckType.replace("_red", "");
}

function canDrawFromDeck(player, deckType){

if(deckType === "P" || deckType === "P_red" || deckType === "T"){
  return true;
}

const baseType = getBaseType(deckType);
const f = getFormationByPlayer(player);

if(!f || !f[baseType]){
  return true;
}

const currentCount = countTypeInHand(player, deckType);
return currentCount < f[baseType];
}

function canPlayCardFromHand(player, cardType){

const baseType = getBaseType(cardType);

if(baseType === "P" || baseType === "T"){
  return true;
}

return !mustRefillHand(player);
}


function renderHand() {

const handDiv = handInnerBlue;
const handDivRed = handInnerRed;

// ✅ preserva contador e remove só as cartas/grupos
handDiv.querySelectorAll(".hand-group").forEach(g => g.remove());
handDivRed.querySelectorAll(".hand-group").forEach(g => g.remove());

function renderGroup(handArray, targetDiv){

  const isRedHand = targetDiv.closest("#hand_red") !== null;

  const groups = {
    A: [], M: [], D: [], G: [], P: [],
    A_red: [], M_red: [], D_red: [], G_red: [], P_red: []
  };

  handArray.forEach(card => {
    if(groups[card.type]) groups[card.type].push(card);
  });

  const order = isRedHand
    ? ["P_red", null, "G_red", "D_red", "M_red", "A_red"]
    : ["A", "M", "D", "G", null, "P"];

  order.forEach(type => {

    if(type === null){
      const spacerGroup = document.createElement("div");
      spacerGroup.className = "hand-group spacer";
      targetDiv.appendChild(spacerGroup);
      return;
    }

    if(groups[type].length === 0) return;

    const groupDiv = document.createElement("div");
    groupDiv.className = "hand-group";

    const sortedCards = isRedHand
      ? [...groups[type]].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      : [...groups[type]].sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

    sortedCards.forEach((card, i) => {

      const img = document.createElement("img");
      img.src = card.front;
      img.className = "hand-card";

      if(card.id === selectedCardId){
        img.classList.add("selected-card");
      }

      img.style.marginLeft = i === 0 ? "0px" : "-25px";

      if(isRedHand){
        img.style.zIndex = sortedCards.length - i;
      } else {
        img.style.zIndex = i + 1;
      }

      img.addEventListener("touchend", function(e){

        const touch = e.changedTouches?.[0];
        if(!touch) return;

        e.preventDefault();
        e.stopPropagation();

        selectElement(img);

        selectedCard = card;
        selectedCardId = card.id;
        selectedFrom = "hand";

        highlightSlot(card.type);

        openRadial(touch.clientX, touch.clientY, [

          ...(card.type === "P" || card.type === "P_red"
            ? [
                {
                  label: "Jogar no 1º espaço",
                  action: ()=>{
                    const targetSlot = card.type === "P" ? "P1" : "P1_red";

                    socket.emit("playCardToSlot", {
                      cardId: card.id,
                      slot: targetSlot
                    });

                    selectedCardId = null;
                    clearSelection();
                  }
                },
                {
                  label: "Jogar no 2º espaço",
                  action: ()=>{
                    const targetSlot = card.type === "P" ? "P2" : "P2_red";

                    socket.emit("playCardToSlot", {
                      cardId: card.id,
                      slot: targetSlot
                    });

                    selectedCardId = null;
                    clearSelection();
                  }
                }
              ]
            : [
                {
                  label: "Jogar",
                  action: ()=>{

                    const player = playerRole === "blue" ? "blue" : "red";

                    if(!canPlayCardFromHand(player, card.type)){

                      const totalAMDG = (player === "blue" ? hand : hand_red).filter(c =>
                        c.type === "A" || c.type === "M" || c.type === "D" || c.type === "G" ||
                        c.type === "A_red" || c.type === "M_red" || c.type === "D_red" || c.type === "G_red"
                      ).length;

                      const faltam = Math.max(0, 13 - totalAMDG);

                      openInfoModal(
                        "Jogada bloqueada",
                        `Você ainda não pode jogar esta carta.\n\n` +
                        `Faltam ${faltam} carta(s) AMDG para completar 13 na mão,\n` +
                        `enquanto ainda houver cartas disponíveis em todos os decks AMDG.`
                      );

                      return;
                    }

                    socket.emit("playCardToSlot", {
                      cardId: card.id,
                      slot: card.type
                    });

                    selectedCardId = null;
                    clearSelection();
                  }
                }
              ]),

          {
            label: "Voltar ao deck",
            action: ()=>{
              socket.emit("returnCardToDeck", {
                cardId: card.id,
                deck: card.type
              });

              selectedCardId = null;
              clearSelection();
            }
          },
          {
            label: "Cancelar",
            action: ()=>{}
          }

        ]);

      }, { passive: false });

      groupDiv.appendChild(img);
    });

    targetDiv.appendChild(groupDiv);
  });
}

// Azul renderiza apenas azul
if(playerRole === "blue"){
  renderGroup(hand, handDiv);
}

// Vermelho renderiza apenas vermelho
if(playerRole === "red"){
  renderGroup(hand_red, handDivRed);
}

// Espectador não renderiza nenhuma mão

updateHandCounters();
updateFormationUI();
}

/* ===================== */
/* SLOT */

function renderSlot(type) {
document.querySelectorAll(`.fan-card[data-slot="${type}"]`)
  .forEach(c=>c.remove());

const pile = slotPiles[type];
const slotEl = document.querySelector(`.slot-pile[data-slot="${type}"]`);

if(pile.length===0){
slotEl.style.backgroundImage = "none";
removeSlotTopCard(slotEl);
return;
}

slotEl.style.backgroundImage = "none";

const topCard = ensureSlotTopCard(slotEl);
const lastCard = pile[pile.length - 1];

topCard.src = lastCard.front;
topCard.style.transform =
`translate(-50%, -50%)${getCardVisualRotation(lastCard)}`;

document.querySelectorAll(".slot-pile")
.forEach(el => el.classList.remove("last-card"));

if(type === lastPlayedSlot){
slotEl.classList.add("last-card");
}

return;
}


function isRedOwnedCard(card){
return !!card?.type && card.type.endsWith("_red");
}

function getCardVisualRotation(card){
return isRedOwnedCard(card) ? " rotate(180deg)" : "";
}

function ensureSlotTopCard(slotEl){
let img = slotEl.querySelector(".slot-top-card");

if(!img){
  img = document.createElement("img");
  img.className = "slot-top-card";
  img.draggable = false;
  img.style.pointerEvents = "none";
  slotEl.appendChild(img);
}

return img;
}

function removeSlotTopCard(slotEl){
slotEl.querySelector(".slot-top-card")?.remove();
}

function openSlotView(type){

if(!canOpenSlotPile(type)) return;

const overlay = document.createElement("div");
overlay.className = "slot-overlay";

const container = document.createElement("div");
container.className = "slot-container";

slotPiles[type].forEach((card, i)=>{

  const img = document.createElement("img");
  img.src = card.front;
  img.className = "slot-big-card";
  img.style.transform = isRedOwnedCard(card) ? "rotate(180deg)" : "none";

  if(card.id === selectedCardId){
    img.classList.add("selected-card");
  }

  img.onclick = (e)=>{

    e.stopPropagation();

    const isRedSlot = type.includes("_red");
    const isSharedSlot =
      type === "P1" || type === "P2" ||
      type === "P1_red" || type === "P2_red";

    if(!isSharedSlot){
      if(playerRole === "blue" && isRedSlot) return;
      if(playerRole === "red" && !isRedSlot) return;
    }

    document.querySelectorAll(".selected-card")
      .forEach(el => el.classList.remove("selected-card"));

    img.classList.add("selected-card");

    selectedCard = card;
    selectedCardId = card.id;
    selectedFrom = "slot-view";
    selectedSlot = type;
    selectedIndex = i;

    openRadial(e.clientX, e.clientY, [
      {
        label: "Voltar para a mão",
        action: ()=>{

          socket.emit("returnCardToHand", {
            cardId: card.id,
            slot: type,
            index: i
          });

          if(playerRole === "blue"){
            hand.push(card);
          }else{
            hand_red.push(card);
          }

          const idx = slotPiles[type].findIndex(c => c.id === card.id);
          if(idx !== -1){
            slotPiles[type].splice(idx, 1);
          }

          renderHand();
          renderSlot(type);

          overlay.remove();
        }
      },
      {
        label: "Cancelar",
        action: ()=>{}
      }
    ]);
  };

  container.appendChild(img);
});

const back = document.createElement("button");
back.innerText = "Voltar";
back.onclick = ()=> overlay.remove();

overlay.appendChild(container);
overlay.appendChild(back);

document.body.appendChild(overlay);
}

document.querySelectorAll(".slot-pile").forEach(slot=>{

slot.addEventListener("touchend", (e)=>{
  const touch = e.changedTouches?.[0];
  if(!touch) return;

  e.preventDefault();
  e.stopPropagation();

  document.querySelectorAll(".selected-card")
    .forEach(el => el.classList.remove("selected-card"));

  slot.classList.add("selected-card");

  const type = slot.dataset.slot;

  if(!canOpenSlotPile(type)){
    clearHighlight();
    clearSelection();
    return;
  }

  highlightSlot(type);

  openRadial(touch.clientX, touch.clientY, [
    {
      label: "Abrir",
      action: ()=>{
        openSlotView(type);
      }
    },
    {
      label: "Cancelar",
      action: ()=>{}
    }
  ]);

}, { passive:false });

});

/* ===================== */
/* DECK DRAG */

let twistDeckTapTimer = null;

document.querySelectorAll(".deck-wrapper").forEach(wrapper=>{

wrapper.addEventListener("touchend", function(e){

  const touch = e.changedTouches?.[0];
  if(!touch) return;

  e.preventDefault();
  e.stopPropagation();

  const deck = wrapper.querySelector("[data-deck]");
  if(!deck) return;

  const deckType = deck.dataset.deck;

  if(playerRole === "spectator") return;

  if(playerRole === "blue" && deckType.endsWith("_red")) return;

  if(playerRole === "red"){
    if(
      deckType === "A" ||
      deckType === "M" ||
      deckType === "D" ||
      deckType === "G" ||
      deckType === "P"
    ) return;
  }

  selectElement(wrapper);

  openRadial(touch.clientX, touch.clientY, [
    {
      label: "Comprar",
      action: ()=>{

        if(deckType === "T"){
          socket.emit("drawTwist");
          return;
        }

        const player = playerRole === "blue" ? "blue" : "red";

        if(!canDrawFromDeck(player, deckType)){

          const baseType = getBaseType(deckType);
          const f = getFormationByPlayer(player);
          const currentCount = countTypeInHand(player, deckType);
          const needsRefill = mustRefillHand(player);

          if(needsRefill && f && currentCount >= f[baseType]){
            openInfoModal(
              "Limite atingido",
              `Você não pode comprar mais cartas do tipo ${baseType}.\n\n` +
              `Sua formação permite até ${f[baseType]} carta(s) desse tipo na mão.`
            );
            return;
          }

          if(!needsRefill){
            openInfoModal(
              "Compra bloqueada",
              "Você não pode comprar mais cartas AMDG agora.\n\n" +
              "Seu limite atual já foi atingido ou algum bloqueio de mão está ativo."
            );
            return;
          }

          openInfoModal(
            "Compra bloqueada",
            "Essa compra não é permitida neste momento."
          );
          return;
        }

        socket.emit("drawCard", deckType);
      }
    },
    {
      label: "Embaralhar",
      action: ()=>{
        socket.emit("shuffleDeck", deckType);
      }
    },
    {
      label: "Cancelar",
      action: ()=>{}
    }
  ]);

}, { passive:false });

});

/* ===================== */
/* DROP */


function getTargetDeck(x, y){
const elementBelow = document.elementFromPoint(x, y);
if(!elementBelow) return null;
return elementBelow.closest("[data-deck]");
}




function getCorrectPoint(clientX, clientY){

const rect = board.getBoundingClientRect();

const scaleX = board.offsetWidth  / rect.width;
const scaleY = board.offsetHeight / rect.height;

let x = (clientX - rect.left) * scaleX;
let y = (clientY - rect.top)  * scaleY;

if(playerRole === "red"){
  x = board.offsetWidth  - x;
  y = board.offsetHeight - y;
}

return { x, y };
}

function findClosestDraggablePiece(clientX, clientY, maxDistance = 26){

const rectBoard = board.getBoundingClientRect();
let best = null;
let bestDist = Infinity;

document.querySelectorAll(".piece").forEach(piece=>{

  const isRedPiece = piece.classList.contains("red");
  const isBall = piece.classList.contains("ball");

  if(playerRole === "spectator") return;
  if(playerRole === "blue" && isRedPiece) return;
  if(playerRole === "red" && !isRedPiece && !isBall && !piece.classList.contains("twist-token")) return;
  if(piece.classList.contains("token27")) return;

  const r = piece.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.sqrt(dx*dx + dy*dy);

  if(dist < bestDist && dist <= maxDistance){
    best = piece;
    bestDist = dist;
  }
});

return best;
}

function checkDeckEnd(){
return false; // por enquanto nunca bloqueia
}


applyAnchors();
/* ===================== */
/* MOVER TOKENS LIVREMENTE */



function enablePieceDragging(){


board.addEventListener("touchstart", function(e){

const touch = e.touches[0];
const piece = e.target.closest(".piece") || findClosestDraggablePiece(touch.clientX, touch.clientY, 28);

if(!piece) return;

const isRedPiece = piece.classList.contains("red");
const isBall = piece.classList.contains("ball");

if(playerRole === "spectator") return;
if(playerRole === "blue" && isRedPiece) return;
if(playerRole === "red" && !isRedPiece && !isBall && !piece.classList.contains("twist-token")) return;
if(piece.classList.contains("token27")) return;

e.preventDefault();

isPanning = false;
pinchStartDist = null;

activePiece = piece;
activePiece.dataset.touching = "true";
activePiece.style.zIndex = 999999;
activePiece.style.pointerEvents = "auto";

}, { passive:false });

board.addEventListener("touchmove", function(e){

if(!activePiece || activePiece.dataset.touching !== "true") return;

e.preventDefault();

const touch = e.touches[0];
const p = getCorrectPoint(touch.clientX, touch.clientY);

const anchor = document.getElementById(activePiece.dataset.anchor);
if(anchor){
  moveQueue.push({
    anchor: activePiece.dataset.anchor,
    x: p.x,
    y: p.y
  });
}

if(!moveScheduled){
  moveScheduled = true;
  requestAnimationFrame(processMoveQueue);
}

}, { passive:false });

board.addEventListener("touchend", function(){

if(!activePiece) return;

activePiece.dataset.touching = "false";

const anchor = document.getElementById(activePiece.dataset.anchor);
if(anchor){
  socket.emit("moveToken", {
    anchor: activePiece.dataset.anchor,
    x: parseFloat(anchor.style.left),
    y: parseFloat(anchor.style.top)
  });
}
setTimeout(updateExpulsionTokenScale, 50);

activePiece = null;
isPanning = false;
pinchStartDist = null;

});
}


const SUB_BACK = "https://i.imgur.com/d6JyQJQ.png";

document.querySelectorAll(".piece.token27").forEach(piece => {

  const isRed = piece.classList.contains("red");

  // controla quem pode virar
  if(playerRole === "blue" && isRed) return;
  if(playerRole === "red" && !isRed) return;
  if(playerRole === "spectator") return;

  piece.dataset.front = piece.src;
  piece.dataset.back  = SUB_BACK;
  piece.dataset.faceUp = "true";

piece.dataset.lastTap = "0";

piece.addEventListener("touchstart", function(e){

  const now = Date.now();
  const lastTap = parseInt(this.dataset.lastTap || "0");

  if(now - lastTap < 450){

    e.preventDefault();
    e.stopPropagation();

    activePiece = null;
    this.dataset.touching = "false";

    const faceUp = this.dataset.faceUp === "true";
    const newState = !faceUp;

    this.dataset.faceUp = newState ? "true" : "false";
    this.src = newState ? this.dataset.front : this.dataset.back;

    socket.emit("flipSubToken", {
      anchor: this.dataset.anchor,
      faceUp: newState
    });

    this.dataset.lastTap = "0";
    return;
  }

  this.dataset.lastTap = String(now);

}, { passive:false });

});


/* ===================== */
/* PILHA ÚNICA DE 20 TOKENS TWIST */

function spawnTwistStack(){

  

  const baseX = 110;  // posição real do Twist
  const baseY = 210;

  for(let i = 1; i <= 20; i++){

    const anchor = document.createElement("div");
    anchor.className = "anchor";
    anchor.id = "twist_" + i;

    // micro offset pra parecer pilha
    anchor.style.left = baseX + "px";
    anchor.style.top  = baseY + "px";

    board.appendChild(anchor);

    const token = document.createElement("img");
    token.className = "piece token14 twist-token";
    token.src = "https://i.imgur.com/AQJilFs.png";

    token.dataset.anchor = anchor.id;

    token.style.zIndex = 6000 + i;

    board.appendChild(token);
  }

  applyAnchors();
}

/* ✅ CRIA A PILHA ASSIM QUE O JOGO CARREGA */
spawnTwistStack();


// salvar posição inicial dos anchors
document.querySelectorAll(".anchor").forEach(anchor=>{
anchor.dataset.initialLeft = anchor.style.left;
anchor.dataset.initialTop  = anchor.style.top;
});

enablePieceDragging();


renderHand();

updateFormationUI();
updateHandCounters();
bindFormationTouch();

/* ✅ marca decks vazios logo no início */
// updateEmptyDeckVisuals();
const TWIST_BACK = "https://i.imgur.com/D40CPCK.png";

function spawnTwistCard(card){

if(document.querySelector(`[data-id="${card.id}"]`)){
  return;
}

const img = document.createElement("img");
img.src = card.front;
img.className = "twist-card";

img.style.width = "74px";
img.style.height = "103px";

img.dataset.id = card.id;
img.dataset.front = card.front;
img.dataset.rotation = card.rotation || 0;

img.style.left = card.x + "px";
img.style.top  = card.y + "px";

img.style.transform =
  `translate(-50%, -50%) rotate(${card.rotation || 0}deg)`;

let dragging = false;
let startX = 0;
let startY = 0;

let holdTimer = null;
let lastTap = 0;

/* TOUCH START */

img.addEventListener("touchstart",(e)=>{

const touch = e.touches[0];

startX = touch.clientX;
startY = touch.clientY;

dragging = false;

document.querySelectorAll(".twist-selected")
  .forEach(el => el.classList.remove("twist-selected"));

img.classList.add("twist-selected");
highlightTwistDeck();

const now = Date.now();

if(now - lastTap < 250){

  clearTimeout(holdTimer);

  socket.emit("rotateTwist",{ id: card.id });

  lastTap = 0;
  return;
}

lastTap = now;

holdTimer = setTimeout(()=>{

  if(dragging) return;

  const overlay = document.getElementById("twistZoomOverlay");
  const zoomImg = document.getElementById("twistZoomImg");

  zoomImg.src = img.dataset.front;
  overlay.style.display = "flex";

},1000);

},{passive:false});

/* DRAG */

img.addEventListener("touchmove",(e)=>{

const touch = e.touches[0];

const dx = Math.abs(touch.clientX - startX);
const dy = Math.abs(touch.clientY - startY);

if(dx > 8 || dy > 8){
  dragging = true;
  clearTimeout(holdTimer);
}

if(!dragging) return;

const p = getCorrectPoint(touch.clientX, touch.clientY);

img.style.left = p.x + "px";
img.style.top  = p.y + "px";

},{passive:false});

/* TOUCH END */

img.addEventListener("touchend",(e)=>{

clearTimeout(holdTimer);

const touch = e.changedTouches[0];

img.style.pointerEvents = "none";

const elementBelow = document.elementFromPoint(
  touch.clientX,
  touch.clientY
);

img.style.pointerEvents = "auto";

let deck = elementBelow?.closest("[data-deck]");

if(!deck){
  const wrapper = elementBelow?.closest(".deck-wrapper");
  deck = wrapper?.querySelector("[data-deck]");
}

if(deck && deck.dataset.deck === "T"){

  socket.emit("returnTwistToDeck",{
    id: card.id
  });

  document.querySelectorAll(".twist-selected")
    .forEach(el => el.classList.remove("twist-selected"));

  clearHighlight();
  return;
}

if(dragging){

  socket.emit("moveTwist", {
    id: card.id,
    x: parseFloat(img.style.left),
    y: parseFloat(img.style.top)
  });

}

document.querySelectorAll(".twist-selected")
.forEach(el => el.classList.remove("twist-selected"));

clearHighlight();

});

img.addEventListener("dblclick", ()=>{
  socket.emit("rotateTwist",{ id: card.id });
});



board.appendChild(img);
}

// ✅ clicar fora fecha o zoom
document.getElementById("twistZoomOverlay")
  .addEventListener("click", (e)=>{

    // só fecha se clicar fora da carta
    if(e.target.id === "twistZoomOverlay"){
      e.target.style.display = "none";
    }

});


/* ===================== */
/* MODAL SYSTEM */

let modalAction = null;

function openModal(type){

  const overlay = document.getElementById("modalOverlay");
  overlay.style.display = "flex";

  const title = document.getElementById("modalTitle");
  const text  = document.getElementById("modalText");
  const confirmBtn = document.getElementById("confirmBtn");

  modalAction = type;

  if(type === "tempo"){
    title.innerText = "Iniciar o 2º Tempo";
    text.innerText =
      "Ao concordar, o segundo tempo será iniciado.\n\n" +
      "As cartas que estão nas mãos dos jogadores permanecerão nas mãos.\n\n" +
      "Somente as cartas jogadas nos slots voltarão para seus respectivos decks, " +
      "e esses decks serão embaralhados.\n\n" +
      "As demais peças permanecerão no tabuleiro.";

    confirmBtn.innerText = "Concordo";
    confirmBtn.onclick = startSecondHalf;
  }

  if(type === "restart"){
    title.innerText = "Reiniciar Partida";
    text.innerText =
      "Ao concordar, TODO o jogo será reiniciado.\n\n" +
      "Cartas, peças e estado da partida voltarão ao início.";

    confirmBtn.innerText = "Concordo";
    confirmBtn.onclick = restartGame;
  }

  if(type === "manual"){
    title.innerText = "Manual de Regras";
    text.innerText =
      "Deseja acessar o Manual Oficial de Regras agora?";

    confirmBtn.innerText = "Acessar";
    confirmBtn.onclick = ()=>{
      window.open(
        "https://drive.google.com/file/d/1mlVRX4wJhj4qFmxtdtW6gic0qF9cJM76/view?usp=drive_link",
        "_blank"
      );
      closeModal();
      };
    }
  if(type === "reload"){
    title.innerText = "Reiniciar Partida";

    text.innerText =
      "Você tem certeza que quer reiniciar a partida?";

    confirmBtn.innerText = "Reiniciar";

    confirmBtn.onclick = ()=>{
      location.reload();
    };
  }
  if(type === "guia"){

    title.innerText = "Guia de Referências";
    text.innerText =
      "Deseja acessar o Guia de Referências agora?";

    confirmBtn.innerText = "Acessar";
    confirmBtn.onclick = ()=>{
      window.open(
        "https://drive.google.com/file/d/1bcFdeEIp6DjZu_ztWnP94dcC3QS7t9w-/view?usp=drive_link",
        "_blank"
      );
      closeModal();
    };
  }

  if(type === "discord"){

    title.innerText = "Comunidade no Discord";

    text.innerText =
      "Deseja acessar o Discord oficial do jogo agora?";

    confirmBtn.innerText = "Acessar";

    confirmBtn.onclick = ()=>{
      window.open(
        "https://discord.gg/xGV2ku9f",
        "_blank"
      );
      closeModal();
    };
  }
}
function openInfoModal(titleText, bodyText){

const overlay = document.getElementById("modalOverlay");
const title = document.getElementById("modalTitle");
const text = document.getElementById("modalText");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelReload");

if(!overlay || !title || !text || !confirmBtn) return;

title.innerText = titleText;
text.innerText = bodyText;

overlay.style.display = "flex";

confirmBtn.innerText = "OK";
confirmBtn.style.display = "";
confirmBtn.onclick = closeModal;

if(cancelBtn){
  cancelBtn.style.display = "none";
}
}

function closeModal(){

const overlay = document.getElementById("modalOverlay");
const cancelBtn = document.getElementById("cancelReload");
const confirmBtn = document.getElementById("confirmBtn");

if(overlay){
  overlay.style.display = "none";
}

if(cancelBtn){
  cancelBtn.style.display = "";
}

if(confirmBtn){
  confirmBtn.style.display = "";
}
}
/* ===================== */
/* 2º TEMPO RESET (SÓ CARTAS) */

function startSecondHalf(){

socket.emit("startSecondHalf");

closeModal();
}

/* ===================== */
/* RESTART TOTAL */

function restartGame(){
  socket.emit("restartMatch");
  closeModal();
}




  /* ===================== */
/* CARTAS FIXAS COM ZOOM */

document.querySelectorAll(".fixed-board-card").forEach(card=>{

let holdTimer = null;
let startX = 0;
let startY = 0;

card.addEventListener("touchstart", (e)=>{
  const touch = e.touches?.[0];
  if(!touch) return;

  startX = touch.clientX;
  startY = touch.clientY;

  holdTimer = setTimeout(()=>{

    const overlay = document.getElementById("twistZoomOverlay");
    const zoomImg = document.getElementById("twistZoomImg");
    if(!overlay || !zoomImg) return;

    zoomImg.src = card.src;
    overlay.style.display = "flex";

  }, 1000); // 👈 1 segundo igual twist

}, { passive:true });

card.addEventListener("touchmove", (e)=>{
  const touch = e.touches?.[0];
  if(!touch || !holdTimer) return;

  const dx = Math.abs(touch.clientX - startX);
  const dy = Math.abs(touch.clientY - startY);

  if(dx > 8 || dy > 8){
    clearTimeout(holdTimer);
    holdTimer = null;
  }
}, { passive:true });

card.addEventListener("touchend", ()=>{
  if(holdTimer){
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});

card.addEventListener("touchcancel", ()=>{
  if(holdTimer){
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});

});
// ===============================
// ✅ CONFIRMAR RELOAD AO APERTAR F5

window.addEventListener("keydown", function(e){

// F5
  if(e.key === "F5"){
    e.preventDefault();
    openModal("reload");
  }

  // Ctrl+R (Windows/Linux) ou Cmd+R (Mac)
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r"){
    e.preventDefault();
    openModal("reload");
  }

});
let matchStarted = true;



// ===============================
// 🔥 IDENTIDADE DO JOGADOR





function updateEmptyDeckVisuals(){
document.querySelectorAll("[data-deck]").forEach(deckEl => {
  const type = deckEl.dataset.deck;

  if(!decks[type] || decks[type].length === 0){
    deckEl.closest(".deck-wrapper").classList.add("deck-empty");
  } else {
    deckEl.closest(".deck-wrapper").classList.remove("deck-empty");
  }
});
}
document.querySelectorAll("#topbar button").forEach(btn=>{
btn.addEventListener("click", ()=>{
  playSFX(SOUNDS.whistle);
});
});

socket.on("yourHand", (serverHand) => {

playSFX(SOUNDS.draw);

console.log("Recebi mão do servidor:", serverHand);

if (playerRole === "blue") {
  hand = serverHand;
}

if (playerRole === "red") {
  hand_red = serverHand;
}

renderHand();
updateHandCounters();
updateFormationUI();
});

socket.on("updateBoardSlots", (data)=>{

if(data.lastSlot){
  playSFX(SOUNDS.drop);
}

if(data.slots){
  slotPiles = data.slots;
  lastPlayedSlot = data.lastSlot;
}else{
  slotPiles = data;
}

Object.keys(slotPiles).forEach(type=>{
  renderSlot(type);
});

lastServerSlots = JSON.parse(JSON.stringify(slotPiles));

document.querySelectorAll(".slot-pile")
  .forEach(el=>el.classList.remove("last-card"));

if(lastPlayedSlot){
  const slotEl = document.querySelector(`.slot-pile[data-slot="${lastPlayedSlot}"]`);
  if(slotEl){
    slotEl.classList.add("last-card");
  }
}
});

socket.on("deckShuffled", (type)=>{
playSFX(SOUNDS.shuffle);

const wrapper = document.querySelector(`[data-deck="${type}"], [data-deck="${type}_red"]`);
if(wrapper){
  wrapper.classList.add("shuffling");
  setTimeout(()=>wrapper.classList.remove("shuffling"), 300);
}
});

socket.on("twistRemoved", (id)=>{
const el = document.querySelector(`[data-id="${id}"]`);
if(el) el.remove();
});

function setSecondHalfButtonLocked(isLocked){
  const btn = document.getElementById("secondHalfBtn");
  if(!btn) return;

  btn.disabled = isLocked;
  btn.style.opacity = isLocked ? "0.45" : "1";
  btn.style.cursor = isLocked ? "not-allowed" : "pointer";
  btn.innerText = isLocked ? "2º tempo iniciado" : "Iniciar 2º tempo";
}

function saveInitialAnchorPositionsOnce(){
  document.querySelectorAll(".anchor").forEach(anchor=>{
    if(!anchor.dataset.initialLeft){
      anchor.dataset.initialLeft = anchor.style.left;
      anchor.dataset.initialTop  = anchor.style.top;
    }
  });
}

function applySecondHalfLayout(){
  saveInitialAnchorPositionsOnce();

  firstHalfEnded = true;

  const tempo = document.getElementById("tempoStatus");
  if(tempo) tempo.innerText = "2º Tempo";

  const bg = document.getElementById("boardBg");
  if(bg) bg.src = "https://i.imgur.com/auIBYLo.png";

  Object.keys(slotPositionsSecondHalf).forEach(slotId => {
  const pos = slotPositionsSecondHalf[slotId];

  let left = parseFloat(pos.left);
  let top  = parseFloat(pos.top);

  // ajuste apenas no mobile, apenas no 2º tempo, apenas slots vermelhos
  if(playerRole === "red" && slotId.includes("_red")){
    left += 36;
    top  += 52;
  }

  const finalLeft = left + "px";
  const finalTop  = top + "px";

  const anchor = document.getElementById(slotId);
  if(anchor){
    anchor.style.left = finalLeft;
    anchor.style.top  = finalTop;
  }

  const pile =
    document.querySelector(`.slot-pile[data-anchor="${slotId}"]`) ||
    document.querySelector(`.slot-pile[data-slot="${slotId}"]`);

  if(pile){
    pile.style.left = finalLeft;
    pile.style.top  = finalTop;
  }
});

  setSecondHalfButtonLocked(true);

  if(typeof positionDecks === "function"){
    positionDecks();
  }

  if(typeof updateEmptyDeckVisuals === "function"){
    updateEmptyDeckVisuals();
  }
}

function applyFirstHalfLayout(){
  saveInitialAnchorPositionsOnce();

  firstHalfEnded = false;

  const tempo = document.getElementById("tempoStatus");
  if(tempo) tempo.innerText = "1º Tempo";

  const bg = document.getElementById("boardBg");
  if(bg) bg.src = "https://i.imgur.com/GUyhwlh.png";

  document.querySelectorAll(".anchor").forEach(anchor=>{
    if(anchor.dataset.initialLeft){
      anchor.style.left = anchor.dataset.initialLeft;
      anchor.style.top  = anchor.dataset.initialTop;
    }
  });

  positionSlots();
  setSecondHalfButtonLocked(false);

  if(typeof positionDecks === "function"){
    positionDecks();
  }

  if(typeof updateEmptyDeckVisuals === "function"){
    updateEmptyDeckVisuals();
  }
}

socket.on("secondHalfStarted", () => {
  applySecondHalfLayout();
});

socket.on("syncSecondHalf", ({ isSecondHalf }) => {
  if(isSecondHalf){
    applySecondHalfLayout();
  }else{
    applyFirstHalfLayout();
  }
});




socket.on("spawnTwist", (card)=>{

playSFX(SOUNDS.throw);
spawnTwistCard(card);
});

socket.on("twistDrawn", (card)=>{

playSFX(SOUNDS.draw);

// evita duplicação
const exists = document.querySelector(`[data-id="${card.id}"]`);
if(exists) return;

spawnTwistCard(card);

});

socket.on("tokenMoved", (data)=>{

const anchor = document.getElementById(data.anchor);
if(!anchor) return;

const pos = clampTokenPosition(
  parseFloat(data.x),
  parseFloat(data.y)
);

anchor.style.left = pos.x + "px";
anchor.style.top  = pos.y + "px";

applyAnchors();

const piece = document.querySelector(`[data-anchor="${data.anchor}"]`);
if(!piece) return;

if(piece.classList.contains("ball")){
  playSFX(SOUNDS.kick);
} else {
  playSFX(SOUNDS.drag);
}

});

socket.on("goalScored", ({ team })=>{
playGoalEffect();
});

socket.on("roomError", (msg)=>{
showJoinMessage(msg);
setTimeout(()=>{
  window.location.href = "/";
},3000);
});

socket.on("subTokenFlipped", ({anchor, faceUp})=>{

  const piece = document.querySelector(`[data-anchor="${anchor}"]`);
  if(!piece) return;

  // garante front/back
  if(!piece.dataset.front){
    piece.dataset.front = piece.src;
  }

  if(!piece.dataset.back){
    piece.dataset.back = "https://i.imgur.com/d6JyQJQ.png";
  }

  // troca estado
  piece.dataset.faceUp = faceUp ? "true" : "false";
  piece.src = faceUp ? piece.dataset.front : piece.dataset.back;

  // 🔥 efeito + som
  showSubEffect();

});

socket.on("syncSubTokens", (tokens)=>{

Object.keys(tokens).forEach(anchor=>{

  const piece = document.querySelector(`[data-anchor="${anchor}"]`);
  if(!piece) return;

  // garante dataset
  piece.dataset.front = piece.dataset.front || piece.src;
  piece.dataset.back  = "https://i.imgur.com/d6JyQJQ.png";

  if(tokens[anchor]){
    piece.src = piece.dataset.front;
    piece.dataset.faceUp = "true";
  } else {
    piece.src = piece.dataset.back;
    piece.dataset.faceUp = "false";
  }

});

});

socket.on("twistReturned", ({ front }) => {

updateEmptyDeckVisuals();

});

socket.on("twistMoved", (card)=>{

const el = document.querySelector(`[data-id="${card.id}"]`);
if(!el) return;

el.style.left = card.x + "px";
el.style.top  = card.y + "px";
});

socket.on("twistRotated", (card)=>{

playSFX(SOUNDS.draw);

const el = document.querySelector(`[data-id="${card.id}"]`);
if(!el) return;

el.style.transform =
  `translate(-50%, -50%) rotate(${card.rotation}deg)`;
});
socket.on("syncTwists", (twists)=>{

// remove todas twists atuais da tela
document.querySelectorAll(".twist-card")
  .forEach(el => el.remove());

// renderiza estado real do servidor
twists.forEach(t=>{
  spawnTwistCard(t);
});
});
socket.on("playerJoinedMessage", ({name, role})=>{

let texto = "";

if(role === "blue"){
  texto = `🔵 ${name} entrou no Time Azul`;
}

if(role === "red"){
  texto = `🔴 ${name} entrou no Time Vermelho`;
}

if(role === "spectator"){
  texto = `👁 ${name} entrou como Espectador`;
}

showJoinMessage(texto);
});


socket.on("syncDeckSizes", (serverDecks)=>{

  decks = serverDecks;

  updateEmptyDeckVisuals();
  updateDeckCounters();

});

document.getElementById("cancelReload")
  .addEventListener("click", closeModal);

  function updateDeckCounters(){

document.querySelectorAll("[data-deckcount]").forEach(el=>{

  const type = el.dataset.deckcount;

  if(!decks[type]){
    el.innerText = "0";
    return;
  }

  el.innerText = decks[type].length;

});

}

function openZoom(src){

const overlay = document.getElementById("twistZoomOverlay");
const zoomImg = document.getElementById("twistZoomImg");

zoomImg.src = src;
overlay.style.display = "flex";

}

function closeZoom(){
document.getElementById("twistZoomOverlay").style.display = "none";
}

function showJoinMessage(text){

const box = document.getElementById("joinMessage");

box.innerText = text;
box.style.display = "block";

playSFX(SOUNDS.whistle);

setTimeout(()=>{
  box.style.display = "none";
},3000);
}

document.getElementById("contactBtn")
.addEventListener("click", ()=>{

  const overlay = document.getElementById("modalOverlay");
  const title   = document.getElementById("modalTitle");
  const text    = document.getElementById("modalText");
  const confirmBtn = document.getElementById("confirmBtn");

  overlay.style.display = "flex";

  title.innerText = "Contato";
  text.innerHTML =
    "Entre em contato conosco e envie seus elogios,<br>" +
    "dúvidas e/ou sugestões para o email:<br><br>" +
    "<strong>varzea.online@outlook.com</strong>";

  confirmBtn.innerText = "OK";
  confirmBtn.onclick = closeModal;

});

socket.on("matchRestarted", ()=>{

hand = [];
hand_red = [];

slotPiles = {
  A:[],M:[],D:[],G:[],
  A_red:[],M_red:[],D_red:[],G_red:[],
  P1:[],P2:[],P1_red:[],P2_red:[]
};

renderHand();

Object.keys(slotPiles).forEach(type=>{
  renderSlot(type);
});

// 🧹 remover cartas twist
document.querySelectorAll(".twist-card")
  .forEach(el => el.remove());

// 🔄 resetar tokens
document.querySelectorAll(".anchor").forEach(anchor=>{
  if(anchor.dataset.initialLeft){
    anchor.style.left = anchor.dataset.initialLeft;
    anchor.style.top  = anchor.dataset.initialTop;
  }
});

applyAnchors();

// 🎥 resetar câmera
pinchZoom = 1;
panX = 0;
panY = 0;
updateBoardTransform();

applyFirstHalfLayout();

});

socket.on("secondHalfStarted", () => {
applySecondHalfLayout();
});

socket.on("syncSecondHalf", ({ isSecondHalf }) => {
if(isSecondHalf){
  applySecondHalfLayout();
}
});

socket.on("syncExpulsions", (data) => {
expulsions = data;

updateFormationUI?.();
updateHandCounters?.();
});

const fullscreenBtn = document.getElementById("fullscreenBtn");

if (fullscreenBtn) {

fullscreenBtn.addEventListener("click", ()=>{

  if (!document.fullscreenElement) {

    document.documentElement.requestFullscreen().catch(err=>{
      console.log("Erro fullscreen:", err);
    });

  } else {

    document.exitFullscreen();

  }

});

}
document.addEventListener("contextmenu", e => {
e.preventDefault();
});

const rotateOverlay = document.getElementById("rotateOverlay");
const rotateFullscreenBtn = document.getElementById("rotateFullscreenBtn");

function checkOrientation(){

if(window.innerHeight > window.innerWidth){
  rotateOverlay.style.display = "flex";
}else{
  rotateOverlay.style.display = "none";
}

}

// dispara imediatamente
checkOrientation();

// escuta mudanças
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

// botão fullscreen
rotateFullscreenBtn.addEventListener("click", ()=>{
if(!document.fullscreenElement){
  document.documentElement.requestFullscreen().catch(()=>{});
}
});

document.getElementById("cancelReload")
?.addEventListener("click", closeModal);

window.addEventListener("load", () => {

document.getElementById("restartBtnMobile")
  ?.addEventListener("click", () => openModal("restart"));

bindFormationTouch();
updateFormationUI();
updateHandCounters();

});

function copyRoomCode(){

if(!roomCode) return;

navigator.clipboard.writeText(roomCode).then(()=>{

  showJoinMessage("📋 Código da sala copiado!");

}).catch(()=>{

  showJoinMessage("❌ Não foi possível copiar.");

});

}

document.getElementById("manualBtn")
?.addEventListener("click", ()=>{
  openModal("manual");
});

document.getElementById("guiaBtn")
?.addEventListener("click", ()=>{
  openModal("guia");
});

document.getElementById("tempoBtn")
?.addEventListener("click", ()=>{
  openModal("tempo");
});

function clearSelections(){

selectedCard = null;
selectedSlotCard = null;
selectedFrom = null;
selectedIndex = null;
selectedSlot = null;
selectedCardId = null;

document.querySelectorAll(".selected-card")
  .forEach(el => el.classList.remove("selected-card"));

clearHighlight();
}

function canOpenSlotPile(type){
if(playerRole === "spectator") return false;

const isRedSlot = type.includes("_red");

if(playerRole === "blue"){
  return !isRedSlot;
}

if(playerRole === "red"){
  return isRedSlot;
}

return false;
}

const constHelpImages = [
"https://i.imgur.com/bZw9ABv.jpg",
"https://i.imgur.com/JWx1xGy.jpg",
"https://i.imgur.com/kwxxQWo.jpg",
"https://i.imgur.com/1TyLqAW.jpg",
"https://i.imgur.com/9QPNDGp.jpg",
"https://i.imgur.com/lete13d.jpg",
"https://i.imgur.com/EsXZjW7.jpg",
"https://i.imgur.com/BUytZWp.jpg",
"https://i.imgur.com/GNowzvh.jpg",
"https://i.imgur.com/ogJzC3c.jpg",
"https://i.imgur.com/Hwx2B3m.jpg",
"https://i.imgur.com/SSsUxnB.jpg"
];

let helpStep = 0;

const helpBtn = document.getElementById("helpBtn");
const helpOverlay = document.getElementById("helpOverlay");
const helpImage = document.getElementById("helpImage");
const helpNext = document.getElementById("helpNext");
const helpPrev = document.getElementById("helpPrev");
const helpClose = document.getElementById("helpClose");
const helpCounter = document.getElementById("helpCounter");

function updateHelpImage(){
if(!helpImage) return;

helpImage.src = constHelpImages[helpStep];

if(helpCounter){
  helpCounter.innerText = `${helpStep + 1} / ${constHelpImages.length}`;
}

if(helpPrev){
  helpPrev.style.opacity = helpStep === 0 ? "0.45" : "1";
}

if(helpNext){
  helpNext.style.opacity = helpStep === constHelpImages.length - 1 ? "0.45" : "1";
}
}

function openHelp(){
helpStep = 0;
helpOverlay.style.display = "flex";
updateHelpImage();
}

function closeHelpCarousel(){
helpOverlay.style.display = "none";
}

function nextHelpImage(){
if(helpStep < constHelpImages.length - 1){
  helpStep++;
  updateHelpImage();
}
}

function prevHelpImage(){
if(helpStep > 0){
  helpStep--;
  updateHelpImage();
}
}

if(helpBtn){
helpBtn.onclick = openHelp;
}

if(helpNext){
helpNext.onclick = nextHelpImage;
}

if(helpPrev){
helpPrev.onclick = prevHelpImage;
}

if(helpClose){
helpClose.onclick = closeHelpCarousel;
}

if(helpOverlay){
helpOverlay.addEventListener("click", (e)=>{
  if(
    e.target === helpOverlay ||
    e.target.classList.contains("help-backdrop")
  ){
    closeHelpCarousel();
  }
});
}

function clampTokenPosition(x, y){

const MIN_X = 0;
const MAX_X = 1152;

const MIN_Y = 49;
const MAX_Y = 580;

return {
  x: Math.max(MIN_X, Math.min(MAX_X, x)),
  y: Math.max(MIN_Y, Math.min(MAX_Y, y))
};
}

function closeHelp(){

document.getElementById("helpOverlay").style.display = "none";

document.querySelectorAll(".help-highlight")
.forEach(el=>el.classList.remove("help-highlight"));



}

document.getElementById("helpClose").onclick = closeHelp;

document.getElementById("helpPrev").onclick = ()=>{

helpStep--;

if(helpStep < 0){
helpStep = 0;
}

showHelpStep();

};

document.getElementById("discordBtn")
?.addEventListener("click", ()=>{
  openModal("discord");
});

function addLogEntry(text, color){

const list = document.getElementById("actionLogList");
if(!list) return;

const entry = document.createElement("div");
entry.className = "action-log-entry";
entry.innerText = text || "";

if(color === "blue"){
  entry.style.borderLeftColor = "#2aa8ff";
}else if(color === "red"){
  entry.style.borderLeftColor = "#ff4d4d";
}else{
  entry.style.borderLeftColor = "#777";
}

list.prepend(entry);
}

document.getElementById("actionLogToggle")
?.addEventListener("click", ()=>{
  document.getElementById("actionLogPanel")
    ?.classList.toggle("closed");
});

document.getElementById("actionLogClose")
?.addEventListener("click", ()=>{
  document.getElementById("actionLogPanel")
    ?.classList.add("closed");
});

window.addEventListener("resize", ()=>{
if(!formationEditMode) return;
positionFormationActions(getCurrentFormationTableId());
});


function updateExpulsionTokenScale(){

  const tokens = document.querySelectorAll(`
    .cardred,
    .piece[data-anchor^="red"][data-anchor$="a"],
    .piece[data-anchor^="red"][data-anchor$="v"]
  `);

  const slots = document.querySelectorAll(".slot-pile");

  tokens.forEach(token => {

    const tRect = token.getBoundingClientRect();
    let overSlot = false;

    slots.forEach(slot => {
      const sRect = slot.getBoundingClientRect();

      const intersect =
        !(tRect.right < sRect.left ||
          tRect.left > sRect.right ||
          tRect.bottom < sRect.top ||
          tRect.top > sRect.bottom);

      if(intersect){
        overSlot = true;
      }
    });

    const scale = overSlot ? 1.7 : 1;

    if(token.classList.contains("red")){
      token.style.transform = `translate(-50%, -50%) rotate(180deg) scale(${scale})`;
    }else{
      token.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

  });
}