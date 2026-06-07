document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("open-install-modal");
  const closeBtn = document.getElementById("close-modal");
  const modal = document.getElementById("install-modal");

  if (openBtn && closeBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
});
