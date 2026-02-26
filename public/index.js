const deviceMode = sessionStorage.getItem("deviceMode");

if (!deviceMode) {
  window.location.href = "/device.html";
}

let bgMusic;
let musicEnabled = true;
let sfxEnabled = true;   // 🔥 ADICIONE ISSO
let currentVolume = 0.2;

// 🔥 carregar preferências salvas
window.addEventListener("DOMContentLoaded", () => {

  bgMusic = document.getElementById("bgMusic");
  // recuperar estado salvo
  const savedMusic = localStorage.getItem("musicEnabled");
  const savedVolume = localStorage.getItem("musicVolume");

  const savedSfx = localStorage.getItem("sfxEnabled");
if(savedSfx !== null){
  sfxEnabled = savedSfx === "true";
}

  if(savedMusic !== null){
    musicEnabled = savedMusic === "true";
  }

  if(savedVolume !== null){
    currentVolume = parseFloat(savedVolume);
  }

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
  sound.volume = 0.5;
  sound.play();
}
  const SOUNDS = {
  drag: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/dragtoken_th8vbx.mp3",
  draw: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/drawcard_ui0b56.mp3",
  shuffle: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868297/shufflecard_k795un.mp3",
  throw: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868298/throwingcard_uf8his.mp3",
  kick: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771880976/kickball_ebq3wi.mp3",
  whistle: "https://res.cloudinary.com/dzjwlafsx/video/upload/v1771868298/whistle_zwznax.mp3"
};

document.getElementById("musicToggle")
  ?.addEventListener("click", ()=>{

    musicEnabled = !musicEnabled;

    localStorage.setItem("musicEnabled", musicEnabled);

    if(musicEnabled){
      bgMusic.play();
      document.getElementById("musicToggle").innerText = "🎵 ON";
    } else {
      bgMusic.pause();
      document.getElementById("musicToggle").innerText = "🎵 OFF";
    }

});



const socket = io({
  transports: ["websocket"],
  upgrade: false
});

// =============================
// 🔊 SISTEMA DE ÁUDIO LOCAL
// =============================

const volumeSlider = document.getElementById("volumeSlider");

volumeSlider.addEventListener("input", () => {
  bgMusic.volume = volumeSlider.value;
});



// BOTÃO EFEITOS
document.getElementById("sfxToggle")
  .addEventListener("click", ()=>{

    sfxEnabled = !sfxEnabled;

    localStorage.setItem("sfxEnabled", sfxEnabled);

    document.getElementById("sfxToggle").innerText =
      sfxEnabled ? "🔊 ON" : "🔇 OFF";
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

  el.innerText = list.join(", ");
});

let decks = {}; // cliente não controla decks, apenas evita erro

const board = document.getElementById("board");

function scaleBoard(){

  const baseWidth  = 1152;
  const baseHeight = 658;

  const screenWidth  = window.innerWidth;
  const screenHeight = window.innerHeight - 60;

  const scaleX = screenWidth  / baseWidth;
  const scaleY = screenHeight / baseHeight;

  const scale = Math.max(scaleX, scaleY); 
  // 👆 era Math.min, isso deixava pequeno

  if (playerRole === "red") {
    board.style.transform =
      `translateX(-50%) rotate(180deg) scale(${scale})`;
  } else {
    board.style.transform =
      `translateX(-50%) scale(${scale})`;
  }

}

window.addEventListener("resize", scaleBoard);
window.addEventListener("load", scaleBoard);

const playerRole = localStorage.getItem("playerRole");
const playerName = localStorage.getItem("playerName");

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("room");

if(!roomCode){
  console.log("Sem código de sala.");
  return;
}

if(!playerName || !playerRole){
  console.log("Dados não encontrados no localStorage.");
  alert("Sessão expirada. Volte ao lobby.");
  window.location.href = "/";
  return;
}

// 🚀 ENTRA NA SALA
socket.emit("reconnectRoom", {
  name: playerName,
  role: playerRole,
  roomCode: roomCode
});



// 4️⃣ Mostra código
  document.getElementById("roomCodeBox").innerText = "Sala: " + roomCode;


if(roomCode)

    if(playerRole === "spectator"){

      let markVisible = false;

      board.addEventListener("click", (e)=>{

        const rect = board.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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

if (playerRole === "blue") {
  document.getElementById("hand_red").style.display = "none";
}

if (playerRole === "red") {
  document.getElementById("hand").style.display = "none";
}

if (playerRole === "spectator") {
  document.getElementById("hand").style.display = "none";
  document.getElementById("hand_red").style.display = "none";
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

  clearHighlight();

  /* ===================== */
  /* SLOT PILHA */

  document.querySelector(`.slot-pile[data-slot="${type}"]`)
    ?.classList.add("highlight");

  /* ===================== */
  /* PENALTIS */

  if(type==="P"){
    ["P1","P2"].forEach(p=>{
      document.querySelector(`.slot-pile[data-slot="${p}"]`)
        ?.classList.add("highlight");
    });
  }

  if(type==="P_red"){
    ["P1_red","P2_red"].forEach(p=>{
      document.querySelector(`.slot-pile[data-slot="${p}"]`)
        ?.classList.add("highlight");
    });
  }

  /* ===================== */
  /* DECK CORRESPONDENTE */

  document.querySelector(`[data-deck="${type}"]`)
    ?.closest(".deck-wrapper")
    ?.classList.add("highlight-zone");

  /* ===================== */
  /* ÁREA DA MÃO (DEVOLVER) */

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

  // Azul
  const blue = countTypes(hand);

  const totalBlue =
    blue.A + blue.M + blue.D + blue.G;

  document.getElementById("counter_blue").innerHTML =
    `A:${blue.A} M:${blue.M} D:${blue.D} G:${blue.G}<br>`+
    `Total: ${totalBlue}`;

  // Vermelho
  const red = countTypes(hand_red);

  const totalRed =
    red.A_red + red.M_red + red.D_red + red.G_red;

  document.getElementById("counter_red").innerHTML =
    `A:${red.A_red} M:${red.M_red} D:${red.D_red} G:${red.G_red}<br>`+
    `Total: ${totalRed}`;
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

      groups[type].forEach(card=>{

        const img = document.createElement("img");
        img.src = card.front;
        img.className="hand-card";

        // 🔥 desktop continua usando drag
        img.draggable = true;

        // 🔥 bloqueia drag nativo do navegador
        img.addEventListener("dragstart", (e)=>{
          e.stopPropagation();
        });

        img.addEventListener("dragstart",(e)=>{
          e.dataTransfer.setData("fromHand", JSON.stringify(card));
          highlightSlot(card.type);

          // 🔥 Ativa zona correta da mão
          if(card.type.includes("_red")){
            document.getElementById("hand_red").classList.add("active-zone");
          } else {
            document.getElementById("hand").classList.add("active-zone");
          }
        });

        img.addEventListener("dragend",()=>{
          clearHighlight();

          // 🔥 Remove fundo das duas mãos
          document.getElementById("hand").classList.remove("active-zone");
          document.getElementById("hand_red").classList.remove("active-zone");
        });

          if(isRedHand){
          img.style.zIndex = groups[type].length - groups[type].indexOf(card);
        } else {
          img.style.zIndex = groups[type].indexOf(card);
        }

        groupDiv.appendChild(img);
      });

      targetDiv.appendChild(groupDiv);
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
}



  
/* ===================== */
/* SLOT */

function renderSlot(type) {
  document.querySelectorAll(`.fan-card[data-slot="${type}"]`)
    .forEach(c=>c.remove());

  const pile = slotPiles[type];
  const slotEl = document.querySelector(`.slot-pile[data-slot="${type}"]`);

  if(pile.length===0){
    slotEl.style.backgroundImage="none";
    return;
  }

  if(!slotFanOpen[type]) {
    slotEl.style.backgroundImage = `url(${pile[pile.length-1].front})`;
    return;
  }

  slotEl.style.backgroundImage="none";

  pile.forEach((card,i)=>{
    const fan=document.createElement("img");
    fan.src=card.front;
    fan.className="fan-card";
    fan.dataset.slot=type;

    fan.style.left = slotEl.style.left;
    fan.style.top  = slotEl.style.top;
    fan.style.transform =
      `translate(-50%,-50%) rotate(${i*12-20}deg) translateY(-40px)`;

    fan.draggable=true;

    fan.addEventListener("dragstart",(e)=>{
      e.dataTransfer.setData("fromSlot", JSON.stringify({type,index:i}));
      highlightSlot(type);
    });

    fan.addEventListener("dragend",()=>{
      clearHighlight();
    });
    if(playerRole === "red" && !type.includes("_red")){
  fan.style.transform += " rotate(180deg)";
}

    if(playerRole === "blue" && type.includes("_red")){
      fan.style.transform += " rotate(180deg)";
    }

    board.appendChild(fan);
  });
}

/* DUPLO CLIQUE */
document.querySelectorAll(".slot-pile").forEach(slot=>{
  slot.addEventListener("dblclick",()=>{
    const type = slot.dataset.slot;
    slotFanOpen[type] = !slotFanOpen[type];
    renderSlot(type);
  });
});

/* ===================== */
/* DECK DRAG */

document.querySelectorAll("[data-deck]").forEach(deck=>{
  deck.addEventListener("dragstart",(e)=>{
    e.dataTransfer.setData("deckType", deck.dataset.deck);
    highlightSlot(deck.dataset.deck);
  });

  deck.addEventListener("dragend",()=>{
    clearHighlight();
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

  let x = (clientX - rect.left) * (board.offsetWidth  / rect.width);
  let y = (clientY - rect.top)  * (board.offsetHeight / rect.height);

  if(playerRole === "red"){
    x = board.offsetWidth  - x;
    y = board.offsetHeight - y;
  }

  return {
    x: rect.left + x,
    y: rect.top  + y
  };
}


board.addEventListener("dragover", e => e.preventDefault());

board.addEventListener("drop",(e)=>{
  e.preventDefault();

  const rect = board.getBoundingClientRect();
  const corrected = getCorrectPoint(e.clientX, e.clientY);

  /* ===================== */
  /* 1. MOVER TOKENS */

  const moveAnchor = e.dataTransfer.getData("movePiece");

  if(moveAnchor){

    const anchor = document.getElementById(moveAnchor);

    let x = corrected.x - rect.left;
    let y = corrected.y - rect.top;


    // limites tabuleiro
    x = Math.max(-400, Math.min(board.clientWidth + 400, x));
    y = Math.max(-400, Math.min(board.clientHeight + 400, y));


    anchor.style.left = `${x}px`;
    anchor.style.top  = `${y}px`;

    applyAnchors();

    // 🔥 ENVIA PARA SERVIDOR
    socket.emit("moveToken", {
      anchor: moveAnchor,
      x: x,
      y: y
    });

    return;
  }
  const moveTwistId = e.dataTransfer.getData("moveTwist");

  if(moveTwistId){

    const rect = board.getBoundingClientRect();

    const x = corrected.x - rect.left;
    const y = corrected.y - rect.top;

    socket.emit("moveTwist", {
      id: moveTwistId,
      x,
      y
    });

    return;
  }

  /* ===================== */
  /* 2. MOVER CARTAS TWIST LIVRES */

  const moveFree = e.dataTransfer.getData("moveFreeCard");

  if(moveFree && draggedFreeCard){

    let x = corrected.x - rect.left;
    let y = corrected.y - rect.top;

    x = Math.max(0, Math.min(board.clientWidth, x));
    y = Math.max(80, Math.min(board.clientHeight - 80, y));

    draggedFreeCard.style.left = `${x}px`;
    draggedFreeCard.style.top  = `${y}px`;

    draggedFreeCard = null;
    return;
  }

/* ===================== */
/* DEVOLVER TWIST NO DECK */

if(draggedFreeCard){

  const targetDeck = getTargetDeck(e.clientX, e.clientY);

  if(targetDeck && targetDeck.dataset.deck === "T"){

    socket.emit("returnTwistToDeck", {
      id: draggedFreeCard.dataset.id
    });

    draggedFreeCard.remove();
    draggedFreeCard = null;

    return;
  }

}

  /* ===================== */
  /* 4. COMPRAR DO DECK */

  const deckType = e.dataTransfer.getData("deckType");

  if(deckType){
    console.log("Tentando comprar:", deckType);

    // 🔥 Define qual mão vai receber
    const targetHand = deckType.includes("_red") ? hand_red : hand;

  // 🚫 REGRA: limite de 13 apenas para cartas AMDG
  function countAMDG(handArr){
    return handArr.filter(c =>
      c.type === "A" || c.type === "M" || c.type === "D" || c.type === "G" ||
      c.type === "A_red" || c.type === "M_red" || c.type === "D_red" || c.type === "G_red"
    ).length;
  }

  if(countAMDG(targetHand) >= 13){

    // só bloqueia se a carta comprada também for AMDG
    if(["A","M","D","G","A_red","M_red","D_red","G_red"].includes(deckType)){
      alert("Você já possui 13 cartas na mão!");
      return;
    }

  }

    if(deckType === "T"){
    socket.emit("drawTwist");
  } else {
    socket.emit("drawCard", deckType);
  }

  }

  /* ===================== */
  /* 5. SOLTAR CARTA DA MÃO */

  const fromHand = e.dataTransfer.getData("fromHand");

  if(fromHand){

  const card = JSON.parse(fromHand);

  const p = getCorrectPoint(corrected.x, corrected.y);
  const targetDeck = getTargetDeck(p.x, p.y);

  if(targetDeck && targetDeck.dataset.deck === card.type){

    if(card.type.includes("_red")){
      hand_red = hand_red.filter(c => c.id !== card.id);
    } else {
      hand = hand.filter(c => c.id !== card.id);
    }

    socket.emit("returnCardToDeck", {
      cardId: card.id,
      deck: card.type
    });

    renderHand();
    return;
  }

    // soltou em slot
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const targetSlot = elementBelow.closest(".slot-pile");

  if(targetSlot){

  // 🚫 Só bloqueia se a carta for AMDG
  const isAMDG =
    ["A","M","D","G","A_red","M_red","D_red","G_red"].includes(card.type);

  if(isAMDG && !firstHalfEnded &&
    mustRefillHand(card.type.includes("_red") ? "red" : "blue")){
    alert("Reponha sua mão até que fique 13 cartas para jogar em campo.");
    return;
  }

  const slotType = targetSlot.dataset.slot;

  /* ========================= */
  /* ✅ PENALTI: regra especial */

  if(card.type === "P"){
    if(slotType !== "P1" && slotType !== "P2") return;
  }

  if(card.type === "P_red"){
    if(slotType !== "P1_red" && slotType !== "P2_red") return;
  }

/* ========================= */
/* ✅ CARTAS NORMAIS (AMDG) */

  const isNormal =
    ["A","M","D","G","A_red","M_red","D_red","G_red"].includes(card.type);

  if(isNormal){

    // não deixa cruzar lados
    if(card.type.includes("_red") && !slotType.includes("_red")) return;
    if(!card.type.includes("_red") && slotType.includes("_red")) return;

    // exige slot exato
    if(card.type !== slotType) return;
  }


      if(card.type.includes("_red")){
        hand_red = hand_red.filter(c => c.id !== card.id);
      } else {
        hand = hand.filter(c => c.id !== card.id);
      }

      socket.emit("playCardToSlot", {
        cardId: card.id,
        slot: slotType
      });

      renderHand();
      renderSlot(slotType);
      return;
    }
  }

 /* ===================== */
/* 6. SOLTAR CARTA DO SLOT */

  const fromSlot = e.dataTransfer.getData("fromSlot");

  if(fromSlot){

  const data = JSON.parse(fromSlot);
  const card = slotPiles[data.type].splice(data.index,1)[0];

  const p = getCorrectPoint(corrected.x, corrected.y);
  const targetDeck = getTargetDeck(p.x, p.y);

  // devolveu no deck correto
  if(targetDeck && targetDeck.dataset.deck === card.type){
        socket.emit("returnSlotCardToDeck", {
      card: card,
      fromSlot: data.type
    });
    renderSlot(data.type);
    return;
  }

  const elementBelow = document.elementFromPoint(corrected.x, corrected.y);
  const targetSlot = elementBelow?.closest(".slot-pile");

  if(targetSlot){

    const slotType = targetSlot.dataset.slot;

    if(card.type==="P" && !(slotType==="P1" || slotType==="P2")) return;
    if(card.type==="P_red" && !(slotType==="P1_red" || slotType==="P2_red")) return;

    if(card.type!=="P" && card.type!=="P_red"){
      if(card.type !== slotType) return;
    }

    if(card.type.includes("_red") && !slotType.includes("_red")) return;
    if(!card.type.includes("_red") && slotType.includes("_red")) return;

    slotPiles[slotType].push(card);

    renderSlot(slotType);
    renderSlot(data.type);
    return;
  }

  // fora → volta pra mão
  if(card.type.includes("_red")){
    hand_red.push(card);
  } else {
    hand.push(card);
  }

  renderHand();
  renderSlot(data.type);
  return;
}
    // ⚠️ Checa fim do tempo
    if(!firstHalfEnded && checkDeckEnd()) return;
});

function checkDeckEnd(){
  return false; // por enquanto nunca bloqueia
}
/* ===================== */
/* DROP GLOBAL (fora do tabuleiro) */

document.addEventListener("drop", (e) => {

  const corrected = getCorrectPoint(e.clientX, e.clientY);

  const moveAnchor = e.dataTransfer.getData("movePiece");
  if(!moveAnchor) return;

  const anchor = document.getElementById(moveAnchor);
  if(!anchor) return;

  // posição na janela
  let x = corrected.x;
  let y = corrected.y;

  // limites da janela inteira
  x = Math.max(0, Math.min(window.innerWidth, x));
  y = Math.max(0, Math.min(window.innerHeight, y));

  // converte para posição relativa ao board
  const rect = board.getBoundingClientRect();

  anchor.style.left = `${x - rect.left}px`;
  anchor.style.top  = `${y - rect.top}px`;

  applyAnchors();
  });

/* ===================== */
/* APPLY ANCHORS (VOLTOU!) */

  function applyAnchors() {
    document.querySelectorAll("[data-anchor]").forEach(el=>{
      const anchor=document.getElementById(el.dataset.anchor);
      if(anchor){
        el.style.left=anchor.style.left;
        el.style.top=anchor.style.top;
      }
    });
  }

  applyAnchors();
  /* ===================== */
  /* MOVER TOKENS LIVREMENTE */

document.querySelectorAll(".piece").forEach(piece => {

  const isRedPiece = piece.classList.contains("red");
  const isBall = piece.classList.contains("ball");

  // espectador não pode mover peças
  if(playerRole === "spectator"){
    piece.draggable = false;
    return;
  }

  if(playerRole === "blue" && isRedPiece) return;
  if(playerRole === "red" && !isRedPiece && !isBall) return;

  if(piece.classList.contains("token27")){
    piece.draggable = false;
    return;
  }

  piece.addEventListener("dragstart", (e)=>{
    e.dataTransfer.setData("movePiece", piece.dataset.anchor);
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
    if(anchor){
      anchor.style.left = x + "px";
      anchor.style.top  = y + "px";
      applyAnchors();
    }

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

      token.style.zIndex = 6000 + i;

      token.addEventListener("dragstart", (e)=>{
        e.dataTransfer.setData("movePiece", anchor.id);
      });

      board.appendChild(token);
    }

    applyAnchors();
  }

  /* ✅ CRIA A PILHA ASSIM QUE O JOGO CARREGA */
  spawnTwistStack();


  renderHand();

  /* ✅ marca decks vazios logo no início */
  // updateEmptyDeckVisuals();
  const TWIST_BACK = "https://i.imgur.com/D40CPCK.png";

function spawnTwistCard(card){

  if(document.querySelector(`[data-id="${card.id}"]`)){
  return;
  }

  const img = document.createElement("img");

  img.src = card.front;
  img.className = "piece twist-card";

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

  /* ===================== */
  /* DRAG */
  img.addEventListener("dragstart",(e)=>{
    e.dataTransfer.setData("moveTwist", card.id);
  });

  /* ===================== */
  /* 1 CLIQUE = GIRAR */
  img.addEventListener("click",(e)=>{

    // evita conflito com dblclick
    if(e.detail === 1){
      setTimeout(()=>{
        if(e.detail === 1){
          socket.emit("rotateTwist", { id: card.id });
        }
      }, 200);
    }

  });

  /* ===================== */
  /* 2 CLIQUES = ZOOM */
  img.addEventListener("dblclick", ()=>{

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

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
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




// 👁 Espectador vê a mesa toda, mas nenhuma mão
if (playerRole === "spectator") {
  document.getElementById("hand").style.display = "none";
  document.getElementById("hand_red").style.display = "none";
}

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
});
socket.on("updateBoardSlots", (serverSlots)=>{
  playSFX(SOUNDS.throw);
  slotPiles = serverSlots;

  Object.keys(slotPiles).forEach(type=>{
    renderSlot(type);
  });
});
socket.on("deckShuffled", (type)=>{

  playSFX(SOUNDS.shuffle);
  

   const wrapper = document.querySelector(`[data-deck="${type}"]`)?.closest(".deck-wrapper");
if(wrapper){
  wrapper.classList.add("shuffling");
  setTimeout(()=>wrapper.classList.remove("shuffling"),300);
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

  applyAnchors();

  const piece = document.querySelector(`[data-anchor="${data.anchor}"]`);
  if(!piece) return;

  if(piece.classList.contains("ball")){
    playSFX(SOUNDS.kick);   // ⚽ som da bola
  } else {
    playSFX(SOUNDS.drag);   // outros tokens
  }

});

socket.on("roomError", (msg)=>{
  showJoinMessage(msg);
  setTimeout(()=>{
    window.location.href = "/";
  },3000);
});

socket.on("subTokenFlipped", ({anchor, faceUp})=>{

  playSFX(SOUNDS.drag);

  const piece = document.querySelector(`[data-anchor="${anchor}"]`);
  if(!piece) return;

  piece.dataset.faceUp = faceUp ? "true" : "false";
  piece.src = faceUp ? piece.dataset.front : piece.dataset.back;

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

  document.getElementById("tempoStatus").innerText = "1º Tempo";
  document.getElementById("boardBg").src =
    "https://i.imgur.com/GUyhwlh.png";

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


document.addEventListener("DOMContentLoaded", () => {

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