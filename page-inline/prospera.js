(function () {
  const links = document.querySelectorAll(".b_c_link");
  const activeLabel = document.querySelector(".b_c_active");
  const images = document.querySelectorAll(".tab-img-wrap");
  const list = document.querySelector(".b_c_list");
  const toggle = document.querySelector(".b_c_toggle");
  const dropdown = document.querySelector(".b_c_dropdown");
  if (!list || !toggle || !dropdown || !activeLabel) return;

  function openList() {
    list.classList.remove("hide");
  }

  function closeList() {
    list.classList.add("hide");
  }

  function isOpen() {
    return !list.classList.contains("hide");
  }

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen()) closeList();
    else openList();
  });

  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) closeList();
  });

  links.forEach((link, index) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Update selected text
      activeLabel.textContent = link.textContent.trim();

      // Optional tab image sync
      images.forEach((img, i) => {
        img.classList.toggle("hide", i !== index);
      });

      // Close list after selection
      closeList();
    });
  });
})();
