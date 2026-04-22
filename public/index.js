const deviceMode = localStorage.getItem("deviceMode");

if (!deviceMode) {
  window.location.href = "/device.html";
}

let bgMusic;
let musicEnabled = true;
let sfxEnabled = true;   // 🔥 ADICIONE ISSO
let currentVolume = 0.2;
let masterVolume = 0.2;
let manualZoom = 1;
let lastPlayedCardId = null;
let lastPlayedSlot = null;
let lastPlayedCardEl = null;
let lastServerSlots = null;
let draggingTwist = null;
let selectedCard = null;
let selectedFrom = null; // "hand" ou "fan"
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

let lastMouse = { x:0, y:0 };

document.addEventListener("mousemove", (e)=>{
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;

  if(tooltipEl?.classList.contains("show")){
    moveTooltip(e.clientX, e.clientY);
  }
});

const TOOLTIP_DELAY = 1500;
const TOOLTIP_OFFSET_Y = 30;

let tooltipTimer = null;
let tooltipCurrentTarget = null;
let tooltipCurrentText = "";

const tooltipEl = document.getElementById("gameTooltip");

function moveTooltip(x, y){
  if(!tooltipEl) return;

  let left = x;
  let top = y - TOOLTIP_OFFSET_Y;

  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";

  // ajusta depois de medir
  const rect = tooltipEl.getBoundingClientRect();

  if(rect.left < 6){
    left = rect.width / 2 + 6;
  }

  if(rect.right > window.innerWidth - 6){
    left = window.innerWidth - (rect.width / 2) - 6;
  }

  if(rect.top < 6){
    top = y + 22;
    tooltipEl.style.top = top + "px";
  }

  tooltipEl.style.left = left + "px";
}

function bindTooltip(selector, getText){
  document.addEventListener("mouseover", (e)=>{
    const el = e.target.closest(selector);
    if(!el) return;

    const text = typeof getText === "function" ? getText(el) : getText;
    if(!text) return;

    scheduleTooltip(el, text, e);
  });

  document.addEventListener("mouseout", (e)=>{
    const el = e.target.closest(selector);
    if(!el) return;

    const related = e.relatedTarget;
    if(related && el.contains(related)) return;

    clearTooltipTimer();
    hideTooltip();
  });

  document.addEventListener("mousedown", (e)=>{
    const el = e.target.closest(selector);
    if(!el) return;

    clearTooltipTimer();
    hideTooltip();
  });

  document.addEventListener("click", (e)=>{
    const el = e.target.closest(selector);
    if(!el) return;

    clearTooltipTimer();
    hideTooltip();
  });
}

function showTooltip(text, x = lastMouse.x, y = lastMouse.y){
  if(!tooltipEl || !text) return;

  tooltipEl.textContent = text;
  tooltipEl.classList.add("show");

  moveTooltip(x, y);
}

function hideTooltip(){
  if(!tooltipEl) return;

  tooltipEl.classList.remove("show");
  tooltipEl.textContent = "";
  tooltipCurrentText = "";
  tooltipCurrentTarget = null;
}

function clearTooltipTimer(){
  if(tooltipTimer){
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
}

function scheduleTooltip(target, text, event){
  clearTooltipTimer();
  hideTooltip();

  tooltipCurrentTarget = target;
  tooltipCurrentText = text;

  const startX = event.clientX;
  const startY = event.clientY;

  tooltipTimer = setTimeout(()=>{
    if(tooltipCurrentTarget !== target) return;
    showTooltip(text, startX, startY);
  }, TOOLTIP_DELAY);
}

let lastPlayedColor = null;


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

const socket = io(window.location.origin, {
	transports: ["polling", "websocket"],
	reconnection: true,
	reconnectionAttempts: Infinity,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	timeout: 20000
});

// =============================
// 🔊 SISTEMA DE ÁUDIO LOCAL
// =============================

window.addEventListener("DOMContentLoaded", () => {

  bgMusic = document.getElementById("bgMusic");

  const volumeSlider = document.getElementById("volumeSlider");

  if(volumeSlider){
    volumeSlider.addEventListener("input", () => {
      currentVolume = parseFloat(volumeSlider.value);
      masterVolume = currentVolume;

      bgMusic.volume = currentVolume;
      sessionStorage.setItem("musicVolume", currentVolume);
    });
  }

  // BOTÃO EFEITOS
  document.getElementById("sfxToggle")
    ?.addEventListener("click", ()=>{

      sfxEnabled = !sfxEnabled;

      sessionStorage.setItem("sfxEnabled", sfxEnabled);

      document.getElementById("sfxToggle").innerText =
        sfxEnabled ? "🔊 ON" : "🔇 OFF";
  });
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

  const slider = document.getElementById("volumeSlider");
  if(slider){
    slider.value = currentVolume;
  }
  const shuffleButtons = document.querySelectorAll(".shuffle-btn");

  shuffleButtons.forEach(button => {

    button.addEventListener("click", (event) => {

      event.stopPropagation();
      event.preventDefault();

      const deck = button.dataset.deck;

      if (deck) {
        socket.emit("shuffleDeck", deck);
      }

    });

  });
});





// 🔥 LISTENERS DEVEM VIR ANTES DO joinRoom

socket.on("syncPlayers", (players)=>{
  if(!players) return;

  document.getElementById("playerBlueName").innerText =
    players.blue || "...";

  document.getElementById("playerRedName").innerText =
    players.red || "...";
});

socket.on("syncSpectators", (list)=>{
  const el = document.getElementById("spectatorList");

  if(!list || list.length === 0){
    el.innerText = "Nenhum";
    return;
  }

   el.innerHTML = list
    .map(name => `<span style="color:yellow">${name}</span>`)
    .join(", ");
});

let decks = {}; // cliente não controla decks, apenas evita erro

const board = document.getElementById("board");

const playerRole = sessionStorage.getItem("playerRole");
  if(playerRole === "red"){
  document.body.classList.add("red-player");
}

function scaleBoard(){

  const baseWidth = 1152;
  const baseHeight = 658;

  const topbarHeight = document.getElementById("topbar")?.offsetHeight || 55;
  const handHeight = 90;
  const safeTop = 10;
  const safeBottom = 20;
  const safeSides = 20;

  const availableWidth = window.innerWidth - safeSides;
  const availableHeight =
    window.innerHeight - topbarHeight - handHeight - safeTop - safeBottom;

  const scaleX = availableWidth / baseWidth;
  const scaleY = availableHeight / baseHeight;

  const scale = Math.min(scaleX, scaleY) * manualZoom;

  if(playerRole === "red"){
    board.style.transform =
      `translate(-50%, -50%) scale(${scale}) rotate(180deg)`;
  }else{
    board.style.transform =
      `translate(-50%, -50%) scale(${scale})`;
  }
}

function positionBoardDesktop(){
  const topbarHeight = document.getElementById("topbar")?.offsetHeight || 55;
  const handHeight = 90;

  const usableTop = topbarHeight;
  const usableBottom = handHeight;
  const usableHeight = window.innerHeight - usableTop - usableBottom;

  const centerY = usableTop + (usableHeight / 2);

  board.style.left = "50%";
  board.style.top = centerY + "px";
}

board.addEventListener("wheel", (e)=>{

  e.preventDefault();

  if(e.deltaY < 0){
    manualZoom += 0.05;
  }else{
    manualZoom -= 0.05;
  }

  manualZoom = Math.max(0.6, Math.min(1.4, manualZoom));

  scaleBoard();

});

window.addEventListener("resize", ()=>{
  positionBoardDesktop();
  scaleBoard();
});

window.addEventListener("load", ()=>{
  positionBoardDesktop();
  scaleBoard();
});


const playerName = sessionStorage.getItem("playerName");

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("room");

if(!roomCode){
  console.log("Sem código de sala.");
}

if(!playerName || !playerRole){
  console.log("Dados não encontrados no sessionStorage.");
  alert("Sessão expirada. Volte ao lobby.");
  window.location.href = "/";
}

addLogEntry(`Você entrou como ${playerName} (${playerRole})`);

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
  document.getElementById("roomCodeBox").innerText = "Sala: " + roomCode;
  
  const roomBox = document.getElementById("roomCodeBox");

  roomBox.addEventListener("click", () => {

    navigator.clipboard.writeText(roomCode);

    roomBox.innerText = "Copiado!";

    setTimeout(()=>{
      roomBox.innerText = "Sala: " + roomCode;
    },1500);

  });

if(roomCode){

    if(playerRole === "spectator"){

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

if (playerRole === "blue") {
  const enemyHandInner = document.querySelector("#hand_red .hand-inner");
  if (enemyHandInner) enemyHandInner.style.display = "none";
}

if (playerRole === "red") {
  const enemyHandInner = document.querySelector("#hand .hand-inner");
  if (enemyHandInner) enemyHandInner.style.display = "none";
}

if (playerRole === "spectator") {
  const blueHandInner = document.querySelector("#hand .hand-inner");
  const redHandInner = document.querySelector("#hand_red .hand-inner");

  if (blueHandInner) blueHandInner.style.display = "none";
  if (redHandInner) redHandInner.style.display = "none";
}


console.log("Jogador entrou como:", playerRole);
/* ===================== */
/* DADOS */
let draggedFreeCard = null;

let hand = [];
let hand_red = [];

let serverHandCounts = {
  blue: null,
  red: null
};

/* ===================== */
/* EMBARALHAR TODOS OS DECKS NO INÍCIO */

function shuffleAllDecks(){
  Object.keys(decks).forEach(type=>{
  });

  console.log("✅ Todos os decks foram embaralhados!");
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

  if(base !== "P" && base !== "T" && current >= f[base]){
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
  document.querySelectorAll(".slot-pile")
    .forEach(s => s.classList.remove("highlight"));

  /* Remove deck highlight */
  document.querySelectorAll(".deck-wrapper")
    .forEach(d => d.classList.remove("highlight-zone"));

  /* Remove highlight das mãos */
  document.getElementById("hand")
    ?.classList.remove("highlight-zone");

  document.getElementById("hand_red")
    ?.classList.remove("highlight-zone");
}


/* ===================== */
/* CONTAGEM DE CARTAS */

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
      P_red: handArray.filter(c=>c.type==="P_red").length,
    };
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

  function formatAdj(value){
    if(value > 0) return `+${value}`;
    return `${value}`;
  }

  function renderBlueCounter(data){
    if(!data) return;

    const fBlue = formation.blue;
    const adjBlue = getFormationAdjustments(fBlue);

    const totalBlue = data.A + data.M + data.D + data.G;

    document.getElementById("counter_blue").innerHTML =
      `A:${data.A}/${fBlue.A} M:${data.M}/${fBlue.M} D:${data.D}/${fBlue.D} G:${data.G}/${fBlue.G}<br>` +
      `Total: ${totalBlue}/13<br>` +
      `A: ${formatAdj(adjBlue.A)}<br>` +
      `M: ${formatAdj(adjBlue.M)}<br>` +
      `D: ${formatAdj(adjBlue.D)}<br>` +
      `G: ${formatAdj(adjBlue.G)}`;
  }

  function renderRedCounter(data){
    if(!data) return;

    const fRed = formation.red;
    const adjRed = getFormationAdjustments(fRed);

    const totalRed = data.A_red + data.M_red + data.D_red + data.G_red;

    document.getElementById("counter_red").innerHTML =
      `A:${data.A_red}/${fRed.A} M:${data.M_red}/${fRed.M} D:${data.D_red}/${fRed.D} G:${data.G_red}/${fRed.G}<br>` +
      `Total: ${totalRed}/13<br>` +
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
/* ===================== */
/* BLOQUEIO DE JOGADA ATÉ TER 13 CARTAS */

function mustRefillHand(player){

  const currentHand = (player==="blue") ? hand : hand_red;

  const totalAMDG = currentHand.filter(c =>
    c.type === "A" || c.type === "M" || c.type === "D" || c.type === "G" ||
    c.type === "A_red" || c.type === "M_red" || c.type === "D_red" || c.type === "G_red"
  ).length;

  // 🔥 se qualquer deck AMDG estiver vazio, libera regra
  const amdgDecks = player === "blue"
    ? ["A","M","D","G"]
    : ["A_red","M_red","D_red","G_red"];

  const anyDeckEmpty = amdgDecks.some(type =>
    !decks[type] || decks[type].length === 0
  );

  if(anyDeckEmpty){
    return false; // 🔥 libera jogar
  }

  return totalAMDG < 13;
}


let firstHalfEnded = false;


function renderHand() {

  const handDiv = document.querySelector("#hand .hand-inner");
  const handDivRed = document.querySelector("#hand_red .hand-inner");
  
  // ✅ preserva contador e remove só as cartas/grupos
  handDiv.querySelectorAll(".hand-group").forEach(g => g.remove());
  handDivRed.querySelectorAll(".hand-group").forEach(g => g.remove());


  function renderGroup(handArray, targetDiv){

    const isRedHand = targetDiv.closest("#hand_red") !== null;

    const groups = {
      A:[],M:[],D:[],G:[],P:[],
      A_red:[],M_red:[],D_red:[],G_red:[],P_red:[]
    };

    handArray.forEach(card => {
      if(groups[card.type]) groups[card.type].push(card);
    });

    // Azul só mostra cartas azuis
      const order = isRedHand
      ? ["P_red", null,"G_red", "D_red","M_red","A_red", ]
        : ["A","M","D","G", null,"P"];




    order.forEach(type=>{

      if(type === null){
        const spacerGroup = document.createElement("div");
        spacerGroup.className = "hand-group spacer";
        targetDiv.appendChild(spacerGroup);
        return;
      }
      if(groups[type].length===0) return;


      if(isRedHand){
        groups[type].sort((a,b) => (b.value ?? 0) - (a.value ?? 0));
      }else{
        groups[type].sort((a,b) => (a.value ?? 0) - (b.value ?? 0));
      }

      const groupDiv = document.createElement("div");
      groupDiv.className="hand-group";

      groups[type].forEach((card,i)=>{

        const img = document.createElement("img");
        if(card.id === selectedCardId){
          img.classList.add("selected-card");
        }
        img.src = card.front;
        img.className="hand-card";
        img.dataset.cardType = card.type;

        if(isRedHand){
          img.style.zIndex = groups[type].length - i;
        }else{
          img.style.zIndex = i + 1;
        }

        img.addEventListener("click", (e)=>{

        e.stopPropagation();

        document.querySelectorAll(".selected-card")
          .forEach(c => c.classList.remove("selected-card"));

        selectedCard = card;
        selectedCardId = card.id;
        selectedFrom = "hand";

        img.classList.add("selected-card"); // 🔥 ADICIONE

        highlightSlot(card.type);

        openRadial(e.clientX, e.clientY, [

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

            if(mustRefillHand(playerRole)){
              alert("Você precisa ter 13 cartas na mão para jogar");
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
    label: "Voltar para o deck",
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
});

      groupDiv.appendChild(img);

      targetDiv.appendChild(groupDiv);
    });
    });
  }

    // Azul renderiza apenas azul
    if (playerRole === "blue") {
      renderGroup(hand, handDiv);
    }

    // Vermelho renderiza apenas vermelho
    if (playerRole === "red") {
      renderGroup(hand_red, handDivRed);
    }

    // Espectador não renderiza nenhuma mão


      // ✅ atualiza contador sempre
    updateHandCounters();
    updateFormationUI();
    }

function startFormationEdit(){

  formationEditMode = true;

  formationTemp = {
    ...formation[playerRole]
  };

  const actions = document.getElementById("formationActions");
  actions.style.display = "flex";

  if(playerRole === "blue"){
    actions.style.left = "490px";
    actions.style.top = "445px";
    actions.style.transform = "translate(-50%, -100%)";
  } else {
    actions.style.left = "670px";
    actions.style.top = "215px";
    actions.style.transform = "translate(-50%, 0) rotate(180deg)";
  }

  updateFormationUI();
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
    (playerRole === "blue" && formationEditMode)
      ? formationTemp
      : formation.blue;

  const redData =
    (playerRole === "red" && formationEditMode)
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

}

// =============================
// 🔥 CLICK NA TABELA (CÉLULAS)
// =============================

function bindFormationClicks(){

  document.addEventListener("click", (e)=>{

    const cell = e.target.closest(".formation-cell");
    if(!cell) return;

    const table = cell.closest("#formationTable, #formationTable_red");
    if(!table) return;

    if(playerRole === "blue" && table.id !== "formationTable") return;
    if(playerRole === "red" && table.id !== "formationTable_red") return;

    if(!formationEditMode) return;
    if(!formationTemp) return;

    e.stopPropagation();

    const type = cell.dataset.type;
    const value = parseInt(cell.dataset.value);

    if(!type || Number.isNaN(value)) return;

    formationTemp[type] = value;

    updateFormationUI();

  }, true);

}

function bindFormationTableClick(){

  document.addEventListener("click", (e)=>{

    const clickedBlue = e.target.closest("#formationTable");
    const clickedRed  = e.target.closest("#formationTable_red");

    if(!clickedBlue && !clickedRed) return;
    if(formationEditMode) return;

    if(clickedBlue && playerRole === "blue"){
      e.stopPropagation();

      openRadial(e.clientX, e.clientY, [
        {
          label:"Alterar formação",
          action: startFormationEdit
        }
      ]);
      return;
    }

    if(clickedRed && playerRole === "red"){
      e.stopPropagation();

      openRadial(e.clientX, e.clientY, [
        {
          label:"Alterar formação",
          action: startFormationEdit
        }
      ]);
      return;
    }

  }, true);

}

bindFormationTableClick();
bindFormationClicks();

/* ===================== */
/* SLOT */


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

function renderSlot(type) {
	document.querySelectorAll(`.fan-card[data-slot="${type}"]`)
		.forEach(c => c.remove());

	const pile = slotPiles[type];
	const slotEl = document.querySelector(`.slot-pile[data-slot="${type}"]`);
	if(!slotEl) return;

	if(pile.length === 0){
		slotEl.style.backgroundImage = "none";
		removeSlotTopCard(slotEl);
		return;
	}

	if(!slotFanOpen[type]){

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

	removeSlotTopCard(slotEl);
	slotEl.style.backgroundImage = "none";

	document.querySelectorAll(".last-card")
		.forEach(el => el.classList.remove("last-card"));

	pile.forEach((card, i)=>{
		const fan = document.createElement("img");

		if(card.id === selectedCardId){
			fan.classList.add("selected-card");
		}

		fan.src = card.front;
		fan.className = "fan-card";
		fan.dataset.slot = type;
		fan.dataset.cardId = card.id;

		if(type === lastPlayedSlot && i === pile.length - 1){
			fan.classList.add("last-card");
		}

		const rect = slotEl.getBoundingClientRect();
		const boardRect = board.getBoundingClientRect();

		fan.style.left = (rect.left - boardRect.left + rect.width / 2) + "px";
		fan.style.top  = (rect.top  - boardRect.top  + rect.height / 2) + "px";

		if(i === pile.length - 1){
			fan.style.transform = `translate(-50%,-50%)`;
		}else{
			fan.style.transform =
				`translate(-50%,-50%) rotate(${i * 12 - 20}deg) translateY(-40px)`;
		}

		fan.style.transform += getCardVisualRotation(card);

		fan.addEventListener("click", (e)=>{
			e.stopPropagation();

			const isRedSlot = type.includes("_red");
			const isSharedSlot =
				type === "P1" || type === "P2" ||
				type === "P1_red" || type === "P2_red";

			if(!isSharedSlot){
				if(playerRole === "blue" && isRedSlot) return;
				if(playerRole === "red" && !isRedSlot) return;
			}

			selectElement(fan);
			selectedCard = card;
			selectedCardId = card.id;
			selectedFrom = "fan";
			selectedSlot = type;
			selectedIndex = i;

			openRadial(e.clientX, e.clientY, [
				{
					label: "Voltar para a mão",
					action: ()=>{
						socket.emit("returnCardToHand", {
							cardId: card.id,
							slot: type,
							index: selectedIndex
						});

						if(playerRole === "blue"){
							hand.push(card);
						}else{
							hand_red.push(card);
						}

						const index = slotPiles[type].findIndex(c => c.id === card.id);
						if(index !== -1){
							slotPiles[type].splice(index, 1);
						}

						renderHand();
						renderSlot(type);
					}
				},
				{
					label: "Cancelar",
					action: ()=>{}
				}
			]);
		});

		board.appendChild(fan);
	});
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
					label:"Voltar para a mão",
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


let toggleLock = false;

document.querySelectorAll(".slot-pile").forEach(slot=>{

  slot.addEventListener("click", (e)=>{

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

openRadial(e.clientX, e.clientY, [
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

});

});



/* ===================== */
/* DECK DRAG */

document.querySelectorAll("[data-deck]").forEach(deck=>{


  deck.addEventListener("click", (e)=>{

  e.stopPropagation();

  document.querySelectorAll(".selected-card")
  .forEach(el => el.classList.remove("selected-card"));

  deck.classList.add("selected-card");

  const deckType = deck.dataset.deck;

  const isRedDeck = deckType.includes("_red");
  const isTwistDeck = deckType === "T";

  if(!isTwistDeck){
    if(playerRole === "blue" && isRedDeck) return;
    if(playerRole === "red" && !isRedDeck) return;
  }

  highlightSlot(deckType);

  openRadial(e.clientX, e.clientY, [

    {
      label: "Comprar",
      action: ()=>{

        const f = formation[playerRole];

        const counts = (playerRole === "blue")
          ? hand
          : hand_red;

        const type = deckType.replace("_red","");

        const current = counts.filter(c =>
          c.type === deckType
        ).length;

        if(type !== "P" && current >= f[type]){
          alert("Limite da formação atingido para " + type);
          return;
        }

        if(deckType === "T"){
          socket.emit("drawTwist");
          playSFX(SOUNDS.draw);
          return;
        }

        socket.emit("drawCard", deckType);
        playSFX(SOUNDS.draw);
      }
    }

  ]);
});
});

["hand","hand_red"].forEach(id=>{

  document.getElementById(id).addEventListener("click", ()=>{

    if(selectedFrom !== "fan") return;

    if(!slotPiles[selectedSlot] || !slotPiles[selectedSlot][selectedIndex]) return;

    const card = slotPiles[selectedSlot][selectedIndex];

    socket.emit("returnCardToHand", {
      cardId: card.id,
      slot: selectedSlot,
      index: selectedIndex
    });

    clearSelection();

  });

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

  const boardWidth  = 1152;
  const boardHeight = 658;

  const scaleX = rect.width  / boardWidth;
  const scaleY = rect.height / boardHeight;

  let x = (clientX - rect.left) / scaleX;
  let y = (clientY - rect.top)  / scaleY;

  // 🔥 corrigir rotação do tabuleiro vermelho
  if(playerRole === "red"){
    x = boardWidth  - x;
    y = boardHeight - y;
  }

  return { x, y };

}





/* ===================== */
/* APPLY ANCHORS (VOLTOU!) */

  function applyAnchors() {
    document.querySelectorAll("[data-anchor]").forEach(el=>{
      const anchor=document.getElementById(el.dataset.anchor);
      if(!el.dataset.moved){
        el.style.left = anchor.style.left;
        el.style.top  = anchor.style.top;
      }
    });
    document.querySelectorAll(".slot-pile").forEach(slot=>{
      const anchor = document.getElementById(slot.dataset.anchor);
      if(anchor){
        slot.style.left = anchor.style.left;
        slot.style.top  = anchor.style.top;
      }
    });
  }

  applyAnchors();

  let moved = false;
  /* ===================== */
  /* MOVER TOKENS LIVREMENTE */


document.querySelectorAll(".piece").forEach(piece => {

const isRedPiece = piece.classList.contains("red");
const isBall = piece.classList.contains("ball");
const isTwistToken = piece.classList.contains("twist-token");

// espectador não pode mover peças
if(playerRole === "spectator"){
  piece.draggable = false;
  return;
}

// componentes compartilhados
if(isBall || isTwistToken){
  piece.draggable = true;
} else {
  if(playerRole === "blue" && isRedPiece){
    piece.draggable = false;
    return;
  }

  if(playerRole === "red" && !isRedPiece){
    piece.draggable = false;
    return;
  }
}

piece.addEventListener("dragstart", (e)=>{

  if(!piece.dataset.anchor) return;

  piece.dataset.moved = "true"; // 🔥 ADICIONE AQUI

  e.dataTransfer.setData("text/plain", JSON.stringify({
    type: "token",
    anchor: piece.dataset.anchor
  }));
});
});

document.querySelectorAll(".piece").forEach(piece=>{

  piece.addEventListener("touchstart", function(e){

    const touch = e.touches[0];
    this.dataset.touching = "true";
    this.style.zIndex = 99999;

  });

  piece.addEventListener("touchmove", function(e){

  if(this.dataset.touching !== "true") return;

  const touch = e.touches[0];
  const rect = board.getBoundingClientRect();

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  const anchor = document.getElementById(this.dataset.anchor);
  if(!anchor) return;

  const pos = clampTokenPosition(
    parseFloat(x),
    parseFloat(y)
  );

  anchor.style.left = pos.x + "px";
  anchor.style.top  = pos.y + "px";

  });

  piece.addEventListener("touchend", function(){
    this.dataset.touching = "false";
  });

});

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

    piece.addEventListener("dblclick", function(e){

      e.preventDefault();

      const faceUp = this.dataset.faceUp === "true";
      const newState = !faceUp;

      this.dataset.faceUp = newState ? "true" : "false";
      this.src = newState ? this.dataset.front : this.dataset.back;

      socket.emit("flipSubToken", {
        anchor: this.dataset.anchor,
        faceUp: newState
      });

    });

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
      token.draggable = true;

      token.style.zIndex = 12000 + i;

      token.addEventListener("dragstart", (e)=>{
        e.dataTransfer.setData("text/plain", JSON.stringify({
          type: "token",
          anchor: anchor.id
        }));
      });

      board.appendChild(token);
    }

    applyAnchors();
  }

  /* ✅ CRIA A PILHA ASSIM QUE O JOGO CARREGA */
  spawnTwistStack();




  /* ✅ marca decks vazios logo no início */
  // updateEmptyDeckVisuals();
  const TWIST_BACK = "https://i.imgur.com/D40CPCK.png";

function spawnTwistCard(card){

  if(document.querySelector(`.twist-card[data-id="${card.id}"]`)){
    return;
  }

  const img = document.createElement("img");

  img.src = card.front;
  img.className = "twist-card";

  img.style.position = "absolute";
  img.style.zIndex = 9000;
  img.style.pointerEvents = "auto";
  img.style.width = "74px";
  img.style.height = "103px";

  img.dataset.id = card.id;
  img.dataset.front = card.front;
  img.dataset.rotation = card.rotation || 0;

  img.style.left = card.x + "px";
  img.style.top  = card.y + "px";
  img.style.transform =
    `translate(-50%, -50%) rotate(${card.rotation || 0}deg)`;

  img.draggable = true;

  img.addEventListener("dragstart", (e)=>{
    draggingTwist = card.id;
    moved = false;

    highlightSlot("T");

    lastDragTwistMouse.x = e.clientX || 0;
    lastDragTwistMouse.y = e.clientY || 0;

    e.dataTransfer.setData("text/plain", "twist");
    });

    img.addEventListener("drag", (e)=>{
      if(e.clientX === 0 && e.clientY === 0) return;

      lastDragTwistMouse.x = e.clientX;
      lastDragTwistMouse.y = e.clientY;
    });

  img.addEventListener("dragend", (e)=>{

  if(!draggingTwist) return;

  const endX = e.clientX || lastDragTwistMouse.x;
  const endY = e.clientY || lastDragTwistMouse.y;

  const corrected = getCorrectPoint(endX, endY);

  socket.emit("moveTwist", {
    id: draggingTwist,
    x: corrected.x,
    y: corrected.y
  });

  draggingTwist = null;
  clearHighlight();

  setTimeout(()=> moved = true, 50);
});

  img.addEventListener("click", (e)=>{
    e.stopPropagation();

    if(moved){
      moved = false;
      return;
    }

    document.querySelectorAll(".selected-card")
      .forEach(c => c.classList.remove("selected-card"));

    img.classList.add("selected-card");
    selectedCardId = card.id;

    openRadial(e.clientX, e.clientY, [
      {
        label: "Ativar carta",
        action: ()=>{
          console.log("Twist ativada:", card.id);
        }
      },
      {
        label: "Voltar para o deck",
        action: ()=>{
          socket.emit("returnTwistToDeck", {
            id: card.id
          });
        }
      },
      {
        label: "Cancelar",
        action: ()=>{}
      }
    ]);
  });

  img.addEventListener("dblclick", ()=>{
    socket.emit("rotateTwist", {
      id: card.id,
      double: true
    });
  });

  img.addEventListener("contextmenu", (e)=>{
    e.preventDefault();

    const overlay = document.getElementById("twistZoomOverlay");
    const zoomImg = document.getElementById("twistZoomImg");

    zoomImg.src = img.dataset.front;
    overlay.style.display = "flex";
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
        "Todas as cartas serão resetadas para seus respectivos decks, " +
        "e ambos os jogadores comprarão uma nova mão.\n\n" +
        "As demais peças permanecerão no tabuleiro.";

      confirmBtn.innerText = "Concordo";
      confirmBtn.onclick = startSecondHalf;
    }

    if(type === "restart"){
      title.innerText = "Reiniciar partida";
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
  function closeModal(){
    document.getElementById("modalOverlay").style.display = "none";
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
  /* BLOQUEAR NOVA ABA AO ARRASTAR PRA FORA */

 

  board.addEventListener("dragenter", (e)=>{
  e.preventDefault();
});
board.addEventListener("dragover", (e)=>{
  e.preventDefault();
});

document.addEventListener("dragover", (e)=>{
  e.preventDefault();
});

function clampTokenPosition(x, y){
  const minX = 0;
  const maxX = 1152;
  const minY = 0;
  const maxY = 570;

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  };
}

  document.addEventListener("drop", (e) => {

  e.preventDefault();

  let data = {};

  try{
    data = JSON.parse(e.dataTransfer.getData("text/plain"));
  }catch(e){
    return;
  }

  if(data.type !== "token") return;

  const corrected = getCorrectPoint(e.clientX, e.clientY);

  const pos = clampTokenPosition(
    parseFloat(corrected.x),
    parseFloat(corrected.y)
  );

  socket.emit("moveToken", {
    anchor: data.anchor,
    x: pos.x,
    y: pos.y
  });

});


   /* ===================== */
  /* CARTAS FIXAS COM ZOOM */

  document.querySelectorAll(".fixed-board-card").forEach(card=>{

    card.addEventListener("dblclick", ()=>{

        const overlay = document.getElementById("twistZoomOverlay");
        const zoomImg = document.getElementById("twistZoomImg");

        zoomImg.src = card.src;
        overlay.style.display = "flex";

    });

    card.addEventListener("contextmenu", (e)=>{
  e.preventDefault();

  const overlay = document.getElementById("twistZoomOverlay");
  const zoomImg = document.getElementById("twistZoomImg");

  zoomImg.src = card.src;
  overlay.style.display = "flex";
});

  });
  // ===============================
  // ✅ CONFIRMAR RELOAD AO APERTAR F5

  window.addEventListener("keydown", function(e){

  if(e.key === "F5"){
    e.preventDefault();
    openModal("reload");
  }

  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r"){
    e.preventDefault();
    openModal("reload");
  }

});

  
  window.addEventListener("beforeunload", function (e) {

  e.preventDefault();

  e.returnValue = "O refresh na página quebra o jogo. Tem certeza que quer fazer isso?";

  let matchStarted = true;
});

// ===============================
// 🔥 IDENTIDADE DO JOGADOR




// 👁 Espectador vê a mesa toda, mas nenhuma mão
if (playerRole === "spectator") {
  document.getElementById("hand").style.display = "none";
  document.getElementById("hand_red").style.display = "none";
}

function updateEmptyDeckVisuals(){
  document.querySelectorAll(".deck-slot[data-deck]").forEach(deckEl => {
    const type = deckEl.dataset.deck;

    const isEmpty =
      decks[type] === 0 ||
      !decks[type] ||
      decks[type].length === 0;

    const wrapper = deckEl.closest(".deck-wrapper");

    if(isEmpty){
      deckEl.classList.add("deck-empty");
      wrapper?.classList.add("deck-empty-wrapper");
    } else {
      deckEl.classList.remove("deck-empty");
      wrapper?.classList.remove("deck-empty-wrapper");
    }
  });
}

socket.on("yourHand", (serverHand) => {

  console.log("MÃO RECEBIDA", serverHand);

  playSFX(SOUNDS.draw);

  if (playerRole === "blue") {
    hand = serverHand;
  }

  if (playerRole === "red") {
    hand_red = serverHand;
  }

  renderHand();

});

socket.on("handCounts", (counts)=>{
  if(!counts) return;

  serverHandCounts = counts;
  updateHandCounters();
});

socket.on("syncFormation", (data)=>{
  if(!data) return;

  formation = data;

  updateFormationUI();
  updateHandCounters();
});

socket.on("updateBoardSlots", (data)=>{

  if(data.lastSlot){
    playSFX(SOUNDS.drop);
  }  

  if(data.slots){
    slotPiles = data.slots
    lastPlayedSlot = data.lastSlot
  }else{
    slotPiles = data
  }

  if(!lastServerSlots){
    Object.keys(slotPiles).forEach(type=>renderSlot(type));
  }else{
    Object.keys(slotPiles).forEach(type=>{
      renderSlot(type);
    });
  }

  lastServerSlots = JSON.parse(JSON.stringify(slotPiles));

  // 🔥 aplicar animação
  document.querySelectorAll(".slot-pile")
    .forEach(el=>el.classList.remove("last-card"))

  if(lastPlayedSlot){

    const slotEl =
      document.querySelector(`.slot-pile[data-slot="${lastPlayedSlot}"]`)

    if(slotEl){
      slotEl.classList.add("last-card")
    }

  }

})

socket.on("deckShuffled", (type)=>{

  playSFX(SOUNDS.shuffle);
  

   const wrapper = document.querySelector(`[data-deck="${type}"], [data-deck="${type}_red"]`)
if(wrapper){
  wrapper.classList.add("shuffling");
  setTimeout(()=>wrapper.classList.remove("shuffling"),300);
}
});

socket.on("subTokenFlipped", ({ anchor, faceUp }) => {
  const el = document.querySelector(`[data-anchor="${anchor}"]`);
  if(el){
    el.dataset.faceUp = faceUp ? "true" : "false";
  }

  if(typeof showSubEffect === "function"){
    showSubEffect();
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

  anchor.style.left = data.x + "px";
  anchor.style.top  = data.y + "px";

  const piece = document.querySelector(`[data-anchor="${data.anchor}"]`);
  if(!piece) return;

  piece.dataset.moved = "true";
  piece.style.left = data.x + "px";
  piece.style.top  = data.y + "px";

  if(piece.classList.contains("red") && !piece.classList.contains("ball")){
    piece.style.transform = "translate(-50%, -50%) rotate(180deg)";
  } else {
    piece.style.transform = "translate(-50%, -50%)";
  }

  if(piece.classList.contains("ball")){
    playSFX(SOUNDS.kick);
  } else {
    playSFX(SOUNDS.drag);
  }

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

  piece.dataset.faceUp = faceUp ? "true" : "false";
  piece.src = faceUp ? piece.dataset.front : piece.dataset.back;

  playSFX(SOUNDS.flip); // opcional, se existir
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

socket.on("twistRemoved", (id)=>{
  const el = document.querySelector(`[data-id="${id}"]`);
  if(el) el.remove();
});

socket.on("twistMoved", (card)=>{

  const el = document.querySelector(`[data-id="${card.id}"]`);
  if(!el) return;

  el.style.left = card.x + "px";
  el.style.top  = card.y + "px";

  el.style.transform =
    `translate(-50%, -50%) rotate(${card.rotation || 0}deg)`;

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


socket.on("secondHalfStarted", ()=>{

  firstHalfEnded = true;

  document.getElementById("tempoStatus").innerText = "2º Tempo";

  // 🏟️ trocar campo
  document.getElementById("boardBg").src =
  "https://i.imgur.com/auIBYLo.png";


  // 🔁 mover slots
  Object.keys(slotPositionsSecondHalf).forEach(slotId => {

    const anchor = document.getElementById(slotId);
    if(!anchor) return;

    anchor.style.left = slotPositionsSecondHalf[slotId].left;
    anchor.style.top  = slotPositionsSecondHalf[slotId].top;

    // 🔥 atualizar também slot-pile visual
    const pile = document.querySelector(`.slot-pile[data-anchor="${slotId}"]`);
    if(pile){
      pile.style.left = slotPositionsSecondHalf[slotId].left;
      pile.style.top  = slotPositionsSecondHalf[slotId].top;
    }

  });
    updateEmptyDeckVisuals();
});

  socket.on("syncDeckSizes", (serverDecks)=>{
  decks = serverDecks;
  updateEmptyDeckVisuals();
  updateDeckCounters();
  });

  document.getElementById("cancelReload")
    .addEventListener("click", closeModal);

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

  // Azul vai para cima
  slotA: {left: "743px", top: "320px"},
  slotM: {left: "586px", top: "320px"},
  slotD: {left: "424px", top: "320px"},
  slotG: {left: "265px", top: "320px"},

  // Vermelho vai para baixo
  slotA_red: {left: "344px", top: "235px"},
  slotM_red: {left: "502px", top: "235px"},
  slotD_red: {left: "663px", top: "235px"},
  slotG_red: {left: "823px", top: "235px"}
};

function addLogEntry(text, color = "white"){
  const list = document.getElementById("actionLogList");
  if(!list) return;

  const entry = document.createElement("div");
  entry.className = "action-log-entry";
  entry.innerText = text ?? "";

  if(color === "blue"){
    entry.style.color = "#4da6ff";
  } else if(color === "red"){
    entry.style.color = "#ff4d4d";
  } else {
    entry.style.color = "#ffffff";
  }

  list.prepend(entry);

  const maxEntries = 80;
  while(list.children.length > maxEntries){
    list.removeChild(list.lastChild);
  }
}

function openActionLog(){
  const panel = document.getElementById("actionLogPanel");
  if(panel){
    panel.classList.remove("closed");
  }
}

function closeActionLogPanel(){
  const panel = document.getElementById("actionLogPanel");
  if(panel){
    panel.classList.add("closed");
  }
}

document.getElementById("actionLogToggle")
  ?.addEventListener("click", () => {

    const panel = document.getElementById("actionLogPanel");
    if(!panel) return;

    if(panel.classList.contains("closed")){
      openActionLog();
    } else {
      closeActionLogPanel();
    }

  });

document.getElementById("actionLogClose")
  ?.addEventListener("click", closeActionLogPanel);

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

socket.on("actionLog", (data)=>{
  if(!data) return;

  if(typeof data === "string"){
    addLogEntry(data, "white");
    return;
  }

  addLogEntry(data.text ?? "", data.color ?? "white");
});



socket.on("goalScored", (data)=>{
  playGoalEffect();
});


socket.on("matchRestarted", ()=>{

  hand = [];
  hand_red = [];

  slotPiles = {
    A:[],M:[],D:[],G:[],
    A_red:[],M_red:[],D_red:[],G_red:[],
    P1:[],P2:[],P1_red:[],P2_red:[]
  };

  // limpa cartas twist
  document.querySelectorAll(".twist-card").forEach(el=>el.remove());

  // limpa marcas de espectador
  document.querySelectorAll(".spectator-cross").forEach(el=>el.remove());

  renderHand();

  Object.keys(slotPiles).forEach(type=>{
    renderSlot(type);
  });

  document.getElementById("tempoStatus").innerText = "1º Tempo";

  document.getElementById("boardBg").src =
    "https://i.imgur.com/GUyhwlh.png";

  // atualiza decks
  socket.emit("syncDeckSizes");

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

  // 🔥 só bloqueia fora das twist
  if(e.target.closest(".twist-card")) return;

  e.preventDefault();
});

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

let helpIndex = 0;

const helpBtn = document.getElementById("helpBtn");
const helpOverlay = document.getElementById("helpOverlay");
const helpImage = document.getElementById("helpImage");
const helpPrevBtn = document.getElementById("helpPrevBtn");
const helpNextBtn = document.getElementById("helpNextBtn");
const helpExitBtn = document.getElementById("helpExitBtn");
const helpCounter = document.getElementById("helpCounter");

function updateHelpImage(){
  if(!helpImage) return;

  helpImage.src = constHelpImages[helpIndex];

  if(helpCounter){
    helpCounter.innerText = `${helpIndex + 1} / ${constHelpImages.length}`;
  }

  if(helpPrevBtn){
    helpPrevBtn.style.opacity = helpIndex === 0 ? "0.45" : "1";
  }

  if(helpNextBtn){
    helpNextBtn.style.opacity = helpIndex === constHelpImages.length - 1 ? "0.45" : "1";
  }
}

function openHelp(){
  helpIndex = 0;
  helpOverlay.style.display = "flex";
  updateHelpImage();
}

function closeHelp(){
  helpOverlay.style.display = "none";
}

function nextHelpImage(){
  if(helpIndex < constHelpImages.length - 1){
    helpIndex++;
    updateHelpImage();
  }
}

function prevHelpImage(){
  if(helpIndex > 0){
    helpIndex--;
    updateHelpImage();
  }
}

if(helpBtn){
  helpBtn.onclick = openHelp;
}

if(helpNextBtn){
  helpNextBtn.onclick = nextHelpImage;
}

if(helpPrevBtn){
  helpPrevBtn.onclick = prevHelpImage;
}

if(helpExitBtn){
  helpExitBtn.onclick = closeHelp;
}

if(helpOverlay){
  helpOverlay.addEventListener("click", (e)=>{
    if(
      e.target === helpOverlay ||
      e.target.classList.contains("help-backdrop")
    ){
      closeHelp();
    }
  });
}

document.addEventListener("keydown", (e)=>{
  if(!helpOverlay || helpOverlay.style.display !== "flex") return;

  if(e.key === "Escape"){
    closeHelp();
  }

  if(e.key === "ArrowRight"){
    nextHelpImage();
  }

  if(e.key === "ArrowLeft"){
    prevHelpImage();
  }
});

function selectElement(el){
  
  // limpa tudo antes
  document.querySelectorAll(".selected-card, .selected-zone")
    .forEach(e => e.classList.remove("selected-card","selected-zone"));

  // aplica no novo
  el.classList.add("selected-card");

}

function clearSelection(){
  selectedCard = null;
  selectedFrom = null;
  selectedIndex = null;
  selectedSlot = null;
  selectedCardId = null;

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

// 🔥 limite direita
if(posX + menuWidth > window.innerWidth){
  posX = x - menuWidth - 10;
}

// 🔥 limite baixo
if(posY + menuHeight > window.innerHeight){
  posY = y - menuHeight - 10;
}

// 🔥 limite esquerda
if(posX < 0) posX = 10;

// 🔥 limite topo
if(posY < 0) posY = 10;

radialMenu.style.left = posX + "px";
radialMenu.style.top  = posY + "px";

  options.forEach((opt, i)=>{

  const btn = document.createElement("div");
  btn.className = "radial-btn";
  btn.innerText = opt.label;

  btn.style.transform = "translateY(10px)";
  btn.style.opacity = "0";

  setTimeout(()=>{
    btn.style.transform = "translateY(0)";
    btn.style.opacity = "1";
  },10);

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

function updateHelpButtons(){

  helpPrevBtn.style.display =
    helpIndex === 0 ? "none" : "inline-block";

  helpNextBtn.innerText =
    helpIndex === helpSteps.length - 1
      ? "Finalizar"
      : "Próximo ➡";

}


function updateDeckCounters(){

document.querySelectorAll(".deck-count").forEach(counter=>{

const deck = counter.dataset.count;

if(!decks[deck]){
counter.innerText = "0";
return;
}

counter.innerText = decks[deck].length;

  });
}

function checkZoom(){
  const zoom = window.devicePixelRatio;

  if(zoom !== 1){
    alert("⚠️ Use zoom 100% (Ctrl + 0) para melhor experiência.");
  }
}

window.addEventListener("load", checkZoom);


function checkOrientation(){

if(window.innerHeight > window.innerWidth){
document.getElementById("rotateOverlay").style.display = "flex";
}else{
document.getElementById("rotateOverlay").style.display = "none";
}

}

window.addEventListener("resize",checkOrientation);
window.addEventListener("load",checkOrientation);

document.getElementById("tempoBtn")
  ?.addEventListener("click", ()=>{
    openModal("tempo");
});

document.getElementById("restartBtn")
  ?.addEventListener("click", ()=>{
    openModal("restart");
});

document.getElementById("manualBtn")
  ?.addEventListener("click", ()=>{
    openModal("manual");
});

document.getElementById("guiaBtn")
  ?.addEventListener("click", ()=>{
    openModal("guia");
});

board.addEventListener("click", (e)=>{

  if(
    e.target.closest(".hand-card") ||
    e.target.closest(".slot-pile") ||
    e.target.closest(".deck-wrapper") ||
    e.target.closest(".piece") ||
    e.target.closest(".twist-card") ||
    e.target.closest(".fan-card") ||
    e.target.closest("#formationTable") ||
    e.target.closest("#formationTable_red") ||
    e.target.closest(".formation-cell") ||
    e.target.closest("#formationActions") ||
    e.target.closest(".radial-menu") ||
    e.target.closest(".radial-btn")
  ){
    return;
  }

  clearSelection();
  closeRadial();
  
  document.querySelectorAll(".selected-card")
    .forEach(el => el.classList.remove("selected-card"));
});

document.getElementById("discordBtn")
?.addEventListener("click", ()=>{
openModal("discord");
});

function openFormationModal(){

  const overlay = document.createElement("div");
  overlay.className = "slot-overlay";

  const box = document.createElement("div");
  box.style.background = "#222";
  box.style.padding = "20px";
  box.style.color = "#fff";

  const roles = ["A","M","D"];

  let temp = {...formation[playerRole]};

  roles.forEach(r=>{
    const input = document.createElement("input");
    input.type = "number";
    input.value = temp[r];
    input.min = 1;
    input.max = 5;

    input.oninput = ()=>{
      temp[r] = parseInt(input.value);
    };

    box.appendChild(document.createTextNode(r+": "));
    box.appendChild(input);
    box.appendChild(document.createElement("br"));
  });

  const confirm = document.createElement("button");
  confirm.innerText = "Confirmar";

    confirm.onclick = ()=>{

    const old = formation[playerRole];

    const diff =
      Math.abs(old.A - temp.A) +
      Math.abs(old.M - temp.M) +
      Math.abs(old.D - temp.D);

    const isFree =
      !formationLocked[playerRole] || !firstHalfEnded;

    if(isFree){
      formationLocked[playerRole] = true;
    }else{

      if(formationTokens[playerRole] < diff){
        alert("Você não tem fichas suficientes para mudar sua formação");
        return;
      }

      const confirmChange = confirm(
        `Você está alterando sua formação.\n\n`+
        `Foram alteradas ${diff} posições.\n`+
        `Isso custará ${diff} fichas.`
      );

      if(!confirmChange) return;

      formationTokens[playerRole] -= diff;
    }

    formation[playerRole] = {
      ...temp,
      G: 3
    };

    overlay.remove();
    updateHandCounters();
  };

  box.appendChild(confirm);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

document.getElementById("formationOk").onclick = ()=>{

  const total =
    formationTemp.A +
    formationTemp.M +
    formationTemp.D;

  if(total !== 10){
    alert("Sua formação precisa somar 10 cartas entre A, M e D");
    return;
  }

  const old = formation[playerRole];
  const temp = formationTemp;

  const diff =
    Math.abs(old.A - temp.A) +
    Math.abs(old.M - temp.M) +
    Math.abs(old.D - temp.D);

  const isFree =
    !formationLocked[playerRole] || !firstHalfEnded;

  if(!isFree){

    if(formationTokens[playerRole] < diff){
      alert("Você não tem fichas suficientes");
      return;
    }

    if(!confirm(`Alterar ${diff} posições?`)) return;

    formationTokens[playerRole] -= diff;
  }

  formation[playerRole] = {
    ...temp,
    G: 3
  };

  formationEditMode = false;
  formationTemp = null;

  document.getElementById("formationActions").style.display = "none";

  updateHandCounters();
  updateFormationUI();

  socket.emit("updateFormation", {
    formation: formation[playerRole]
  });

};

document.getElementById("formationCancel").onclick = ()=>{

  formationEditMode = false;
  formationTemp = null;

  document.getElementById("formationActions").style.display = "none";

  updateFormationUI();
};


function setupGameTooltips(){

  // =====================
  // CARTAS DA MÃO
  bindTooltip(".hand-card", (el)=>{
  const cardType = el.dataset.cardType;

  if(cardType === "P" || cardType === "P_red"){
    return "Clique para escolher em qual espaço de pênalti jogar ou devolver ao deck.";
  }

  return "Clique para jogar no slot correspondente ou devolver ao deck.";
});

  // =====================
  // SLOTS
  bindTooltip(".slot-pile", "Clique para abrir o slot e ver as cartas.");

  // =====================
  // CARTAS ABERTAS NO SLOT
  bindTooltip(".fan-card", "Clique para devolver a carta para a mão.");
  bindTooltip(".slot-big-card", "Clique para devolver a carta para a mão.");

  // =====================
  // DECKS
  bindTooltip(".deck-slot[data-deck]", (el)=>{
    const deckType = el.dataset.deck;

    if(deckType === "T"){
      return "Clique para comprar uma carta de twist. Use o botão amarelo para embaralhar.";
    }

    return "Clique para comprar uma carta deste deck. Use o botão amarelo para embaralhar.";
  });

  // =====================
  // BOTÃO DE EMBARALHAR
  bindTooltip(".shuffle-btn", "Clique para embaralhar este deck.");

  // =====================
  // PEÇAS / TOKENS
  bindTooltip(".piece", (el)=>{

    if(
      el.dataset.anchor === "tokengola" ||
      el.dataset.anchor === "tokengolv"
    ){
      return "Arraste o token até a posição desejada.";
    }

    if(
      el.dataset.anchor?.toLowerCase().includes("sub") ||
      el.classList.contains("sub-token")
    ){
      return "Dê um duplo clique para virar o token.";
    }

    if(el.classList.contains("ball")){
      return "Arraste a bola até a posição desejada.";
    }

    return "Arraste a peça até a posição desejada.";
  });

  // =====================
  // CARTAS DE TWIST NA MESA
  bindTooltip(".twist-card", "Arraste para mover, dê um duplo clique para girar e segure para ampliar.");

  // =====================
  // TABELAS DE FORMAÇÃO
  bindTooltip("#formationTable, #formationTable_red", "Clique para alterar a formação. Dê um duplo clique ao redor da tabela para vê-la ampliada.");

  // =====================
  // CÉLULAS DA FORMAÇÃO
  bindTooltip(".formation-cell", "Dê um duplo clique ao redor da tabela para vê-la ampliada.");

  // =====================
  // CONTROLES / UI
  bindTooltip("#roomCodeBox", "Clique para copiar o código da sala.");
  bindTooltip("#musicToggle", "Clique para ligar ou desligar a música.");
  bindTooltip("#sfxToggle", "Clique para ligar ou desligar os efeitos sonoros.");
  bindTooltip("#volumeSlider", "Arraste para ajustar o volume do jogo.");
  bindTooltip("#actionLogToggle", "Clique para abrir ou fechar o log de ações.");
  bindTooltip("#helpBtn", "Clique para abrir as imagens de ajuda.");
  bindTooltip("#helpPrevBtn", "Clique para ver a imagem anterior.");
  bindTooltip("#helpNextBtn", "Clique para ver a próxima imagem.");
  bindTooltip("#helpExitBtn", "Clique para fechar a ajuda.");
  bindTooltip("#discordBtn", "Clique para acessar o Discord oficial do jogo.");
}

setupGameTooltips();