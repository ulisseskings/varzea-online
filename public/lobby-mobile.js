const deviceMode = sessionStorage.getItem("deviceMode");

if(!deviceMode){
  window.location.href = "/device.html";
}

let bgMusic = document.getElementById("bgMusic");
let musicEnabled = localStorage.getItem("musicEnabled") !== "false";
let currentVolume = parseFloat(localStorage.getItem("musicVolume")) || 0.2;

bgMusic.volume = currentVolume;

if(musicEnabled){
  document.addEventListener("click", ()=>{
    bgMusic.play().catch(()=>{});
  }, {once:true});
}

document.getElementById("musicToggleLobby")
  .addEventListener("click", ()=>{

    musicEnabled = !musicEnabled;

    localStorage.setItem("musicEnabled", musicEnabled);

    if(musicEnabled){
      bgMusic.play();
      document.getElementById("musicToggleLobby").innerText="🎵 ON";
    }else{
      bgMusic.pause();
      document.getElementById("musicToggleLobby").innerText="🎵 OFF";
    }

});

document.getElementById("volumeSliderLobby")
  .addEventListener("input", (e)=>{
    currentVolume = parseFloat(e.target.value);
    bgMusic.volume = currentVolume;
    localStorage.setItem("musicVolume", currentVolume);
});


const socket = io({
  transports: ["websocket"],
  upgrade: false
});

// 🔥 LISTENERS GLOBAIS

socket.on("roomCreated",(roomCode)=>{
  const name = document.getElementById("nickname").value;
  const role = document.getElementById("role").value;

  localStorage.setItem("playerName",name);
  localStorage.setItem("playerRole",role);

  const mode = localStorage.getItem("deviceMode") || "desktop";

  if(mode === "mobile"){
    window.location.href = `/index-mobile.html?room=${roomCode}`;
  }else{
    window.location.href = `/index.html?room=${roomCode}`;
  }

});

socket.on("roomJoined",(roomCode)=>{
  const name = document.getElementById("nickname").value;
  const role = document.getElementById("role").value;

  localStorage.setItem("playerName", name);
  localStorage.setItem("playerRole", role);

  const mode = localStorage.getItem("deviceMode") || "desktop";

  if(mode === "mobile"){
    window.location.href = `/index-mobile.html?room=${roomCode}`;
  }else{
    window.location.href = `/index.html?room=${roomCode}`;
  }

});

socket.on("roomError",(msg)=>{
  alert(msg);
});

/* ============================= */
/*   IMAGENS ANIMADAS           */
/* ============================= */

const leftImages=[
  "https://i.imgur.com/uuEvIlD.png",
  "https://i.imgur.com/rVXSF0A.png",
  "https://i.imgur.com/8tdCynv.png",
  "https://i.imgur.com/jJ84rBZ.png",
  "https://i.imgur.com/dPxFK64.png"
];

const rightImages=[
  "https://i.imgur.com/Hmbou7i.png",
  "https://i.imgur.com/ntYDKd7.png",
  "https://i.imgur.com/SYlGinK.png",
  "https://i.imgur.com/Gnbzgmi.png",
  "https://i.imgur.com/lWXt4b8.png"
];

let leftIndex=0;
let rightIndex=0;
let showLeft=true;

const leftImg=document.getElementById("leftImg");
const rightImg=document.getElementById("rightImg");

function swapCharacter(){

  if(showLeft){
    rightImg.style.opacity=0;
    leftImg.src=leftImages[leftIndex];
    leftImg.style.opacity=1;
    leftIndex=(leftIndex+1)%leftImages.length;
  }else{
    leftImg.style.opacity=0;
    rightImg.src=rightImages[rightIndex];
    rightImg.style.opacity=1;
    rightIndex=(rightIndex+1)%rightImages.length;
  }

  showLeft=!showLeft;
}

window.onload=()=>{
  leftImg.style.opacity=1;
  rightImg.style.opacity=0;
  swapCharacter();
  setInterval(swapCharacter,3000);
};

const bannerImages = [
  "https://i.imgur.com/JelZIZD.png",
  "https://i.imgur.com/rjnW253.png",
  "https://i.imgur.com/cLGNSVy.png",
  "https://i.imgur.com/E5KSaDt.png"
];

let bannerIndex = 0;
const banner = document.getElementById("lobbyBanner");
const bannerImg = document.getElementById("bannerImg");

// 🔁 troca imagem a cada 1 segundo
setInterval(()=>{
  bannerIndex = (bannerIndex + 1) % bannerImages.length;
  bannerImg.src = bannerImages[bannerIndex];
},200);

// 🎲 movimento aleatório suave dentro de 15px
function randomFloat(){
  return (Math.random() * 30 - 15).toFixed(2);
}

setInterval(()=>{
  const x = randomFloat();
  const y = randomFloat();

  banner.style.transform =
    `translate(-50%, 0) translate(${x}px, ${y}px)`;

},2000);

function openModal(type){

  const overlay = document.getElementById("modalOverlay");
  const title   = document.getElementById("modalTitle");
  const text    = document.getElementById("modalText");
  const confirmBtn = document.getElementById("confirmBtn");

  overlay.style.display = "flex";

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
}

function closeModal(){
  document.getElementById("modalOverlay").style.display = "none";
}

document.getElementById("manualLobbyBtn")
  .addEventListener("click", ()=>{
    openModal("manual");
});

document.getElementById("contactBtn")
  .addEventListener("click", ()=>{
    document.getElementById("contactModal").style.display = "flex";
});

function closeContactModal(){
  document.getElementById("contactModal").style.display = "none";
}

function createRoom(){

  const name = document.getElementById("nickname").value.trim();
  const role = document.getElementById("role").value;

  if(!name){
    alert("Digite um nickname.");
    return;
  }

  socket.emit("createRoom", {
    name,
    role
  });

}

function joinRoom(){

  const name = document.getElementById("nickname").value.trim();
  const role = document.getElementById("role").value;
  const roomCode = document.getElementById("roomCode").value.trim().toUpperCase();

  if(!name){
    alert("Digite um nickname.");
    return;
  }

  if(!roomCode){
    alert("Digite o código da sala.");
    return;
  }

  socket.emit("joinRoom", {
    name,
    role,
    roomCode
  });

}
const fullscreenLobbyBtn = document.getElementById("fullscreenLobbyBtn");

if(fullscreenLobbyBtn){

  fullscreenLobbyBtn.addEventListener("click", ()=>{

    if(!document.fullscreenElement){

      document.documentElement.requestFullscreen().catch(err=>{
        console.log("Erro fullscreen:", err);
      });

    }else{

      document.exitFullscreen();

    }

  });

}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("createRoomBtn")
    ?.addEventListener("click", createRoom);

  document.getElementById("joinRoomBtn")
    ?.addEventListener("click", joinRoom);

});
