document.addEventListener("DOMContentLoaded", () => {

  const desktopBtn = document.getElementById("desktopBtn");
  const mobileBtn = document.getElementById("mobileBtn");

  if (desktopBtn) {
    desktopBtn.addEventListener("click", () => {
      sessionStorage.setItem("deviceMode", "desktop");
      window.location.href = "lobby.html";
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      sessionStorage.setItem("deviceMode", "mobile");
      window.location.href = "lobby-mobile.html";
    });
  }

});