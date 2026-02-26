document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     VERIFICA DEVICE
  ================================ */

  const deviceMode = sessionStorage.getItem("deviceMode");
  if (!deviceMode) {
    window.location.href = "/device.html";
    return;
  }

  /* ===============================
     SOCKET
  ================================ */

  const socket = io({
    transports: ["websocket"],
    upgrade: false
  });

  /* ===============================
     ELEMENTOS
  ================================ */

  const nicknameInput = document.getElementById("nickname");
  const roleSelect = document.getElementById("role");
  const roomCodeInput = document.getElementById("roomCode");

  const createBtn = document.getElementById("createRoomBtn");
  const joinBtn = document.getElementById("joinRoomBtn");

  const musicToggle = document.getElementById("musicToggleLobby");
  const volumeSlider = document.getElementById("volumeSliderLobby");
  const bgMusic = document.getElementById("bgMusic");

  const leftImg = document.getElementById("leftImg");
  const rightImg = document.getElementById("rightImg");
  const banner = document.getElementById("lobbyBanner");
  const bannerImg = document.getElementById("bannerImg");

  const manualBtn = document.getElementById("manualLobbyBtn");
  const contactBtn = document.getElementById("contactBtn");
  const fullscreenBtn = document.getElementById("fullscreenLobbyBtn");

  const manualModal = document.getElementById("manualModal");
  const manualConfirmBtn = document.getElementById("manualConfirmBtn");
  const manualCancelBtn = document.getElementById("manualCancelBtn");

  const contactModal = document.getElementById("contactModal");
  const closeContactBtn = document.getElementById("closeContactBtn");

  /* ===============================
     MÚSICA
  ================================ */

  let musicEnabled = localStorage.getItem("musicEnabled") !== "false";
  let currentVolume = parseFloat(localStorage.getItem("musicVolume")) || 0.2;

  if (bgMusic) {
    bgMusic.volume = currentVolume;

    if (musicEnabled) {
      document.addEventListener("click", () => {
        bgMusic.play().catch(() => {});
      }, { once: true });
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", () => {
      musicEnabled = !musicEnabled;
      localStorage.setItem("musicEnabled", musicEnabled);

      if (!bgMusic) return;

      if (musicEnabled) {
        bgMusic.play();
        musicToggle.innerText = "🎵 ON";
      } else {
        bgMusic.pause();
        musicToggle.innerText = "🎵 OFF";
      }
    });
  }

  if (volumeSlider && bgMusic) {
    volumeSlider.addEventListener("input", (e) => {
      currentVolume = parseFloat(e.target.value);
      bgMusic.volume = currentVolume;
      localStorage.setItem("musicVolume", currentVolume);
    });
  }

  /* ===============================
     IMAGENS LATERAIS
  ================================ */

  if (leftImg && rightImg) {

    const leftImages = [
      "https://i.imgur.com/uuEvIlD.png",
      "https://i.imgur.com/rVXSF0A.png",
      "https://i.imgur.com/8tdCynv.png",
      "https://i.imgur.com/jJ84rBZ.png",
      "https://i.imgur.com/dPxFK64.png"
    ];

    const rightImages = [
      "https://i.imgur.com/Hmbou7i.png",
      "https://i.imgur.com/ntYDKd7.png",
      "https://i.imgur.com/SYlGinK.png",
      "https://i.imgur.com/Gnbzgmi.png",
      "https://i.imgur.com/lWXt4b8.png"
    ];

    let leftIndex = 0;
    let rightIndex = 0;
    let showLeft = true;

    function swapCharacter() {
      if (showLeft) {
        rightImg.style.opacity = 0;
        leftImg.src = leftImages[leftIndex];
        leftImg.style.opacity = 1;
        leftIndex = (leftIndex + 1) % leftImages.length;
      } else {
        leftImg.style.opacity = 0;
        rightImg.src = rightImages[rightIndex];
        rightImg.style.opacity = 1;
        rightIndex = (rightIndex + 1) % rightImages.length;
      }
      showLeft = !showLeft;
    }

    leftImg.style.opacity = 1;
    rightImg.style.opacity = 0;
    setInterval(swapCharacter, 3000);
  }

  /* ===============================
     BANNER
  ================================ */

  if (banner && bannerImg) {

    const bannerImages = [
      "https://i.imgur.com/JelZIZD.png",
      "https://i.imgur.com/rjnW253.png",
      "https://i.imgur.com/cLGNSVy.png",
      "https://i.imgur.com/E5KSaDt.png"
    ];

    let bannerIndex = 0;

    setInterval(() => {
      bannerIndex = (bannerIndex + 1) % bannerImages.length;
      bannerImg.src = bannerImages[bannerIndex];
    }, 2000);

    function randomFloat() {
      return (Math.random() * 30 - 15).toFixed(2);
    }

    setInterval(() => {
      banner.style.transform =
        `translate(-50%, 0) translate(${randomFloat()}px, ${randomFloat()}px)`;
    }, 2000);
  }

  /* ===============================
     MODAL MANUAL
  ================================ */

  if (manualBtn && manualModal) {
    manualBtn.addEventListener("click", () => {
      manualModal.style.display = "flex";
    });
  }

  if (manualCancelBtn && manualModal) {
    manualCancelBtn.addEventListener("click", () => {
      manualModal.style.display = "none";
    });
  }

  if (manualConfirmBtn && manualModal) {
    manualConfirmBtn.addEventListener("click", () => {
      window.open(
        "https://drive.google.com/file/d/1mlVRX4wJhj4qFmxtdtW6gic0qF9cJM76/view?usp=drive_link",
        "_blank"
      );
      manualModal.style.display = "none";
    });
  }

  /* ===============================
     MODAL CONTATO
  ================================ */

  if (contactBtn && contactModal) {
    contactBtn.addEventListener("click", () => {
      contactModal.style.display = "flex";
    });
  }

  if (closeContactBtn && contactModal) {
    closeContactBtn.addEventListener("click", () => {
      contactModal.style.display = "none";
    });
  }

  /* ===============================
     FULLSCREEN
  ================================ */

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    });
  }

  /* ===============================
     CRIAR SALA
  ================================ */

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      const name = nicknameInput.value.trim();
      const role = roleSelect.value;

      if (!name) {
        alert("Digite um nickname.");
        return;
      }

      socket.emit("createRoom", { name, role });
    });
  }

  /* ===============================
     ENTRAR SALA
  ================================ */

  if (joinBtn) {
    joinBtn.addEventListener("click", () => {
      const name = nicknameInput.value.trim();
      const role = roleSelect.value;
      const roomCode = roomCodeInput.value.trim().toUpperCase();

      if (!name || !roomCode) {
        alert("Preencha todos os campos.");
        return;
      }

      socket.emit("joinRoom", { name, role, roomCode });
    });
  }

  /* ===============================
     SOCKET EVENTS
  ================================ */

  socket.on("roomCreated", (roomCode) => {
    localStorage.setItem("playerName", nicknameInput.value);
    localStorage.setItem("playerRole", roleSelect.value);

    window.location.href =
      deviceMode === "mobile"
        ? `/index-mobile.html?room=${roomCode}`
        : `/index.html?room=${roomCode}`;
  });

  socket.on("roomJoined", (roomCode) => {
    localStorage.setItem("playerName", nicknameInput.value);
    localStorage.setItem("playerRole", roleSelect.value);

    window.location.href =
      deviceMode === "mobile"
        ? `/index-mobile.html?room=${roomCode}`
        : `/index.html?room=${roomCode}`;
  });

  socket.on("roomError", (msg) => {
    alert(msg);
  });

});