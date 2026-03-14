if(sessionStorage.getItem("deviceMode") !== "mobile"){
  window.location.href = "/lobby.html";
}

let bgMusic;
let musicEnabled = true;
let sfxEnabled = true;   // 🔥 ADICIONE ISSO
let currentVolume = 0.2;
let selectedSlotCard = null;

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

  const sound = new Audio(src);
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

    sessionStorage.setItem("musicEnabled", musicEnabled);

    if(musicEnabled){
      bgMusic.play();
      document.getElementById("musicToggle").innerText = "🎵 ON";
    } else {
      bgMusic.pause();
      document.getElementById("musicToggle").innerText = "🎵 OFF";
    }

});

document.getElementById("sfxToggle")
?.addEventListener("click", ()=>{

  sfxEnabled = !sfxEnabled;

  sessionStorage.setItem("sfxEnabled", sfxEnabled);

  document.getElementById("sfxToggle").innerText =
    sfxEnabled ? "🔊 ON" : "🔇 OFF";

});


const socket = io({
  transports: ["websocket"],
  upgrade: false
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

      el.style.left = tokens[anchor].x + "px";
      el.style.top  = tokens[anchor].y + "px";

    });

    applyAnchors();

  }, 50);

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

    anchor.style.left = move.x + "px";
    anchor.style.top  = move.y + "px";

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
  });
}

function positionSlots(){

  document.querySelectorAll(".slot-pile").forEach(slot=>{

    const anchorId = slot.dataset.anchor;
    const anchor = document.getElementById(anchorId);

    if(!anchor) return;

    slot.style.left = anchor.style.left;
    slot.style.top  = anchor.style.top;

    slot.style.transform = "translate(-50%, -50%)";

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

  // 🔥 se tocou em algo interativo, NÃO faz pan
  if(clickable) return;

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

},{passive:false});


board.addEventListener("touchmove", (e)=>{

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

},{passive:false});


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

let selectedCard = null;
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


function highlightTwistDeck(){

  clearHighlight();

  document.querySelector('[data-deck="T"]')
    ?.closest(".deck-wrapper")
    ?.classList.add("highlight-zone");

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

socket.on("handCounts", (counts)=>{

  console.log("HAND COUNTS RECEBIDO:", counts);

  const blue = counts.blue;
  const red = counts.red;

  const totalBlue = blue.A + blue.M + blue.D + blue.G;
  const totalRed  = red.A_red + red.M_red + red.D_red + red.G_red;

  const blueCounter = document.getElementById("counter_blue");
  const redCounter  = document.getElementById("counter_red");

  if(blueCounter){
    blueCounter.innerHTML =
    `<span style="font-size:16px;font-weight:bold">
    A:${blue.A} M:${blue.M} D:${blue.D} G:${blue.G}
    </span><br>
    <span style="font-size:16px">
    Total: ${totalBlue}/13
    </span>`;
  }

  if(redCounter){
    redCounter.innerHTML =
    `<span style="font-size:16px;font-weight:bold">
    A:${red.A_red} M:${red.M_red} D:${red.D_red} G:${red.G_red}
    </span><br>
    <span style="font-size:16px">
    Total: ${totalRed}/13
    </span>`;
  }

});

function renderHand() {

    const handDiv = handInnerBlue;
    const handDivRed = handInnerRed;
  
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


      const groupDiv = document.createElement("div");
      groupDiv.className="hand-group";

      const sortedCards = isRedHand
        ? [...groups[type]].sort((a,b)=>b.value-a.value) // vermelho decrescente
        : [...groups[type]].sort((a,b)=>a.value-b.value); // azul crescente

      sortedCards.forEach((card,i)=>{

        const img = document.createElement("img");
        img.src = card.front;
        img.className="hand-card";

        // ⭐ leque visível
        img.style.marginLeft = i === 0 ? "0px" : "-25px";

        // ⭐ ordem visual correta
        if(isRedHand){
          img.style.zIndex = sortedCards.length - i; // invertido
        }else{
          img.style.zIndex = i + 1;
        }

        let touchCard = null;

img.addEventListener("touchstart", function(e){

  e.preventDefault();

  selectedCard = card;

  touchCard = true;

  highlightSlot(card.type);

  document.querySelectorAll(".hand-card")
    .forEach(c => c.classList.remove("selected-card"));

  this.classList.add("selected-card");

});

        












        img.addEventListener("touchend", function(e){

          this.style.transition = "0.15s ease";
          this.style.transform = "scale(1.05)";
          setTimeout(()=>{
            this.style.transition = "";
            this.style.transform = "";
          },150);

          if(!touchCard) return;

          const touch = e.changedTouches[0];
          this.style.pointerEvents = "none";

          const elementBelow = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          );

          this.style.pointerEvents = "auto";

          const slot = elementBelow?.closest(".slot-pile");

          const deck = getTargetDeck(
            touch.clientX,
            touch.clientY
          );

          // 🔁 devolver ao deck
          if(deck && deck.dataset.deck === card.type){

            // devolver para mão
          const handZone = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          )?.closest("#hand, #hand_red");

          if(handZone){

            socket.emit("returnCardToHand", {
              cardId: card.id
            });

          }else if(deck && deck.dataset.deck === card.type){

            socket.emit("returnCardToDeck", {
              cardId: card.id,
              deck: card.type
            });

          }

          }

          if(slot){

            const player = playerRole === "blue" ? "blue" : "red";

            const currentHand = player === "blue" ? hand : hand_red;

            const totalAMDG = currentHand.filter(c =>
              c.type === "A" || c.type === "M" || c.type === "D" || c.type === "G" ||
              c.type === "A_red" || c.type === "M_red" || c.type === "D_red" || c.type === "G_red"
            ).length;

            // ⭐ cartas de pênalti podem sempre ser jogadas
            if(card.type !== "P" && card.type !== "P_red"){

              if(totalAMDG < 13 && mustRefillHand(player)){
                showJoinMessage("⚠️ Complete 13 cartas antes de jogar.");
                renderHand();
                return;
              }

            }

            socket.emit("playCardToSlot", {
              cardId: card.id,
              slot: slot.dataset.slot
            });

          }

          clearHighlight();

          this.style.position = "";
          this.style.left = "";
          this.style.top = "";
          this.style.zIndex = "";
          this.style.opacity = "";
          touchCard = null;

        }, { passive:false });
        

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
    const fan = document.createElement("img");

fan.src = card.front;
fan.className = "fan-card";
fan.dataset.slot = type;
fan.dataset.cardId = card.id;

fan.addEventListener("touchstart", function(e){

  e.preventDefault();

  if(selectedSlotCard === card.id){

    socket.emit("returnCardFromSlot", {
      cardId: card.id,
      slot: type
    });

    selectedSlotCard = null;

    document.querySelectorAll(".fan-card")
      .forEach(c => c.classList.remove("selected-card"));

    return;
  }

  selectedSlotCard = card.id;

  highlightSlot(card.type);

  document.querySelectorAll(".fan-card")
    .forEach(c => c.classList.remove("selected-card"));

  this.classList.add("selected-card");

}, { passive:false });


    fan.className="fan-card";
    fan.dataset.slot=type;

    fan.style.left = slotEl.style.left;
    fan.style.top  = slotEl.style.top;
    fan.style.transform =
      `translate(-50%,-50%) rotate(${i*12-20}deg) translateY(-40px)`;

    if(playerRole === "red" && !type.includes("_red")){
  fan.style.transform += " rotate(180deg)";
}

    if(playerRole === "blue" && type.includes("_red")){
      fan.style.transform += " rotate(180deg)";
    }

    const firstPiece = board.querySelector(".piece");

    if(firstPiece){
      board.insertBefore(fan, firstPiece);
    }else{
      board.appendChild(fan);
    }
  });
}

/* DUPLO CLIQUE */
document.querySelectorAll(".slot-pile").forEach(slot=>{
  let tapTimer = null;

slot.addEventListener("touchstart",(e)=>{
  e.preventDefault();

  if(tapTimer){
    clearTimeout(tapTimer);
    tapTimer = null;

    const type = slot.dataset.slot;
    slotFanOpen[type] = !slotFanOpen[type];
    renderSlot(type);

  } else {
    tapTimer = setTimeout(()=>{
      tapTimer = null;
    },250);
  }

},{ passive:false });
});

/* ===================== */
/* DECK DRAG */

document.querySelectorAll(".deck-wrapper").forEach(wrapper=>{

  wrapper.addEventListener("touchstart", function(e){

    e.preventDefault();

    const deck = wrapper.querySelector("[data-deck]");
    if(!deck) return;

    const deckType = deck.dataset.deck;

    if(deckType === "T"){

      let tapTimer = wrapper.dataset.tapTimer;

      if(tapTimer){
        clearTimeout(tapTimer);

        wrapper.dataset.tapTimer = "";

        socket.emit("shuffleDeck","T");

        return;
      }

      wrapper.dataset.tapTimer = setTimeout(()=>{
        wrapper.dataset.tapTimer = "";
        socket.emit("drawTwist");
      },250);

      return;
    }

    // 👁 espectador não pode comprar
    if(playerRole === "spectator") return;

    // 🔵 jogador azul só pode usar decks azuis
    // 🔵 jogador azul
    if(playerRole === "blue"){
      if(deckType.endsWith("_red")) return;
    }

    // 🔴 jogador vermelho
    if(playerRole === "red"){
      if(
        deckType === "A" ||
        deckType === "M" ||
        deckType === "D" ||
        deckType === "G" ||
        deckType === "P"
      ) return;
}

    const player = playerRole === "blue" ? "blue" : "red";

    // ⭐ cartas de pênalti podem sempre ser compradas
    if(deckType !== "P" && deckType !== "P_red"){

      if(!mustRefillHand(player)){
        return;
      }

    }

    socket.emit("drawCard", deckType);

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



function checkDeckEnd(){
  return false; // por enquanto nunca bloqueia
}


  applyAnchors();
  /* ===================== */
  /* MOVER TOKENS LIVREMENTE */

function enablePieceDragging(){

document.querySelectorAll(".piece").forEach(piece => {

  const isRedPiece = piece.classList.contains("red");
  const isBall = piece.classList.contains("ball");

  if(playerRole === "spectator") return;
  if(playerRole === "blue" && isRedPiece) return;
  if(playerRole === "red" && !isRedPiece && !isBall && !piece.classList.contains("twist-token")) return;
  if(piece.classList.contains("token27")) return;

  piece.dataset.touching = "false";

  piece.addEventListener("touchstart", function(e){
    e.preventDefault();
    this.dataset.touching = "true";
  }, { passive:false });

  piece.addEventListener("touchmove", function(e){

    if(this.dataset.touching !== "true") return;

    const touch = e.touches[0];

    const p = getCorrectPoint(touch.clientX, touch.clientY);

    const x = p.x;
    const y = p.y;

    const anchor = document.getElementById(this.dataset.anchor);
    if(anchor){

      moveQueue.push({
        anchor: this.dataset.anchor,
        x,
        y
      });

    }

    if(!moveScheduled){

      moveScheduled = true;

      requestAnimationFrame(processMoveQueue);

    }

  }, { passive:false });

  piece.addEventListener("touchend", function(){

    this.dataset.touching = "false";

    const anchor = document.getElementById(this.dataset.anchor);
    if(!anchor) return;

    socket.emit("moveToken", {
      anchor: this.dataset.anchor,
      x: parseFloat(anchor.style.left),
      y: parseFloat(anchor.style.top)
    });

  });

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

  img.classList.add("selected-card");
  highlightTwistDeck();

  const now = Date.now();

  /* DUPLO TOQUE → GIRAR */

  if(now - lastTap < 250){

    clearTimeout(holdTimer);

    socket.emit("rotateTwist",{ id: card.id });

    lastTap = 0;
    return;

  }

  lastTap = now;

  /* SEGURAR → ZOOM */

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

    img.remove();
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
  selectedSlotCard = null;
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

  anchor.style.left = parseFloat(data.x) + "px";
  anchor.style.top  = parseFloat(data.y) + "px";

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

  // 🔥 limpa mãos locais (cartas voltam pro deck no servidor)
  hand = [];
  hand_red = [];

renderHand();

  tempoStatusEl.innerText = "2º Tempo";

  // 🏟️ trocar campo
  document.getElementById("boardBg").src =
  "https://i.imgur.com/auIBYLo.png";


  // 🔁 mover slots
  Object.keys(slotPositionsSecondHalf).forEach(slotId => {

    const anchor = document.getElementById("slot" + slotId);
    if(!anchor) return;

    anchor.style.left = slotPositionsSecondHalf[slotId].left;
    anchor.style.top  = slotPositionsSecondHalf[slotId].top;

    // 🔥 atualizar também slot-pile visual
    const pile = document.querySelector(`.slot-pile[data-slot="${slotId}"]`);
    if(pile){
      pile.style.left = slotPositionsSecondHalf[slotId].left;
      pile.style.top  = slotPositionsSecondHalf[slotId].top;
    }

  });

  
    updateEmptyDeckVisuals();

    shuffleAllDecks();
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

window.addEventListener("load", () => {

  document.getElementById("restartBtnMobile")
    ?.addEventListener("click", () => openModal("restart"));

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

  document.querySelectorAll(".selected-card")
    .forEach(el => el.classList.remove("selected-card"));

  clearHighlight();

}
let helpStep = 0;

const steps=[

{
title:"Bem-vindo ao Várzea Online",
text:"Este guia rápido mostra como jogar e usar os controles na tela.\n\nToque em Próximo para continuar.",
highlight:null
},

{
title:"Objetivo do jogo",
text:"Vença disputas de cartas para avançar no campo e marcar gols.\n\nA bola se move conforme o resultado das disputas.",
highlight:".ball"
},

{
title:"Posições do time",
text:"Cada carta representa uma posição:\n\nA = Atacante\nM = Meio-campo\nD = Defesa\nG = Goleiro\n\nCada posição disputa apenas contra a mesma posição do adversário.",
highlight:".fixed-board-card"
},

{
title:"Decks de compra",
text:"Toque em um deck para comprar uma carta.\n\nVocê deve manter 13 cartas na mão antes de jogar no campo.",
highlight:'[data-deck="A"], [data-deck="M"], [data-deck="D"], [data-deck="G"]'
},

{
title:"Sua mão de cartas",
text:"As cartas compradas aparecem aqui.\n\nToque em uma carta para selecioná-la.",
highlight:"#hand"
},

{
title:"Jogando cartas",
text:"Depois de selecionar uma carta, arraste ela até a posição correspondente no campo.",
highlight:".slot-pile"
},

{
title:"Disputa de cartas",
text:"Cada carta possui valor de 1 a 11.\n\nA carta de maior valor vence a disputa.",
highlight:".fan-card"
},

{
title:"Movimento da bola",
text:"Quando você vence uma disputa, a bola avança no campo em direção ao gol adversário.",
highlight:".ball"
},

{
title:"Movendo peças",
text:"Segure uma peça do campo e arraste para mover.\n\nIsso inclui jogadores e a bola.",
highlight:".piece"
},

{
title:"Tokens de substituição",
text:"Tokens de substituição viram com um toque simples.\n\nUse isso para indicar substituições.",
highlight:".token27"
},

{
title:"Pilhas de cartas",
text:"Toque duas vezes em uma pilha para ver todas as cartas jogadas naquela posição.",
highlight:".slot-pile"
},

{
title:"Retirar carta da pilha",
text:"Depois de abrir a pilha, arraste uma carta para devolver à mão ou ao deck.",
highlight:".fan-card"
},

{
title:"Cartas Twist",
text:"Cartas Twist criam eventos especiais na partida.",
highlight:'[data-deck="T"]'
},

{
title:"Zoom das Twist",
text:"Segure a carta Twist para ampliar e ver melhor.",
highlight:".twist-card"
},

{
title:"Girar Twist",
text:"Toque duas vezes na carta Twist para girar.",
highlight:".twist-card"
},

{
title:"Fim do primeiro tempo",
text:"Quando um jogador não puder mais jogar cartas de uma posição, o primeiro tempo termina.\n\nToque no botão para iniciar o 2º tempo.",
highlight:"#tempoBtn"
},

{
title:"Dica de estratégia",
text:"Controlar o meio-campo ajuda a dominar a posse da bola.\n\nDefesa protege seu gol e ataque pressiona o adversário.",
highlight:".slot-pile"
},

{
title:"Fim do tutorial",
text:"Você pode abrir este guia novamente pelo botão ?.\n\nPara aprender todas as regras consulte o Manual de Regras.",
highlight:null
}

];



function showHelpStep(){

document.querySelectorAll(".help-highlight")
.forEach(el=>el.classList.remove("help-highlight"));

const step=steps[helpStep];

document.getElementById("helpTitle").innerText=step.title;
document.getElementById("helpText").innerText=step.text;

if(step.highlight){

document.querySelectorAll(step.highlight)
.forEach(el=>el.classList.add("help-highlight"));

}

}

document.getElementById("helpBtn").onclick = ()=>{

helpStep = 0;

document.getElementById("helpOverlay").style.display="flex";

showHelpStep();

};

document.getElementById("helpNext").onclick = ()=>{

helpStep++;

if(helpStep >= steps.length){

closeHelp();

return;

}

showHelpStep();

};

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