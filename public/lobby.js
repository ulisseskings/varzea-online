document.addEventListener("DOMContentLoaded", () => {

  const socket = io();

  /* =========================
     ELEMENTOS
  ========================= */

  const bgMusic = document.getElementById("bgMusic");
  const musicToggle = document.getElementById("musicToggleLobby");
  const volumeSlider = document.getElementById("volumeSliderLobby");

  const leftImg = document.getElementById("leftImg");
  const rightImg = document.getElementById("rightImg");

  const banner = document.getElementById("lobbyBanner");
  const bannerImg = document.getElementById("bannerImg");

  /* =========================
     MÚSICA
  ========================= */

  let musicEnabled = localStorage.getItem("musicEnabled") !== "false";
  let currentVolume = parseFloat(localStorage.getItem("musicVolume")) || 0.2;

  if(bgMusic){
    bgMusic.volume = currentVolume;

    document.addEventListener("click", ()=>{
      if(musicEnabled){
        bgMusic.play().catch(()=>{});
      }
    }, {once:true});
  }

  if(musicToggle && bgMusic){
    musicToggle.addEventListener("click", ()=>{
      musicEnabled = !musicEnabled;
      localStorage.setItem("musicEnabled", musicEnabled);

      if(musicEnabled){
        bgMusic.play();
        musicToggle.innerText="🎵 ON";
      }else{
        bgMusic.pause();
        musicToggle.innerText="🎵 OFF";
      }
    });
  }

  if(volumeSlider && bgMusic){
    volumeSlider.addEventListener("input", (e)=>{
      currentVolume = parseFloat(e.target.value);
      bgMusic.volume = currentVolume;
      localStorage.setItem("musicVolume", currentVolume);
    });
  }

  /* =========================
     ANIMAÇÃO LATERAIS
  ========================= */

  if(leftImg && rightImg){

    const leftImages=[ ... ]; // mantenha seu array
    const rightImages=[ ... ];

    let leftIndex=0;
    let rightIndex=0;
    let showLeft=true;

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

    leftImg.style.opacity=1;
    rightImg.style.opacity=0;
    setInterval(swapCharacter,3000);
  }

  /* =========================
     BANNER
  ========================= */

  if(banner && bannerImg){

    const bannerImages=[ ... ]; // seu array

    let bannerIndex=0;

    setInterval(()=>{
      bannerIndex=(bannerIndex+1)%bannerImages.length;
      bannerImg.src=bannerImages[bannerIndex];
    },200);

    function randomFloat(){
      return (Math.random()*30-15).toFixed(2);
    }

    setInterval(()=>{
      const x=randomFloat();
      const y=randomFloat();
      banner.style.transform=
        `translate(-50%,0) translate(${x}px,${y}px)`;
    },2000);
  }

  /* =========================
     BOTÕES
  ========================= */

  document.getElementById("createRoomBtn")
    ?.addEventListener("click", createRoom);

  document.getElementById("joinRoomBtn")
    ?.addEventListener("click", joinRoom);

  function createRoom(){
    const name = document.getElementById("nickname").value.trim();
    const role = document.getElementById("role").value;

    if(!name){
      alert("Digite um nickname.");
      return;
    }

    socket.emit("createRoom",{name,role});
  }

  function joinRoom(){
    const name = document.getElementById("nickname").value.trim();
    const role = document.getElementById("role").value;
    const roomCode =
      document.getElementById("roomCode").value.trim().toUpperCase();

    if(!name || !roomCode){
      alert("Preencha os campos.");
      return;
    }

    socket.emit("joinRoom",{name,role,roomCode});
  }

  /* =========================
     SOCKET
  ========================= */

  socket.on("roomCreated",(roomCode)=>{
    window.location.href=`/index.html?room=${roomCode}`;
  });

  socket.on("roomJoined",(roomCode)=>{
    window.location.href=`/index.html?room=${roomCode}`;
  });

  socket.on("roomError",(msg)=>{
    alert(msg);
  });

});