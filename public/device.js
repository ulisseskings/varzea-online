document.addEventListener("DOMContentLoaded", () => {

  const desktopBtn = document.getElementById("desktopBtn");
  const mobileBtn = document.getElementById("mobileBtn");

  if (desktopBtn) {
    desktopBtn.addEventListener("click", () => {
      localStorage.setItem("deviceMode", "desktop");
      window.location.href = "/lobby.html";
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      localStorage.setItem("deviceMode", "mobile");
      window.location.href = "/lobby-mobile.html";
    });
  }

});