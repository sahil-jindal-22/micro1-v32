if (window.innerWidth > 991) {
  const titles = [...document.querySelectorAll(".g_hd_text-item")];
  const images = [...document.querySelectorAll(".g_hd_image")];

  titles[0]?.classList.add("is-selected");
  images[0]?.classList.add("is-visible");

  titles.forEach((title, i) => {
    title.addEventListener("mouseenter", () => {
      titles.forEach((title) => title.classList.remove("is-selected"));

      title.classList.add("is-selected");

      images.forEach((img) => img.classList.remove("is-visible"));

      images[i]?.classList.add("is-visible");
    });
  });
}
