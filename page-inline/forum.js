(() => {
  const itemWrapEls = Array.from(document.querySelectorAll(".forum_item-wrap"));

  // Move speakers
  itemWrapEls.forEach((item) => {
    const speakerEl = item.querySelector(".foum_speak");
    const imgWrapEl = item.querySelector(".forum_img-wrap");

    if (!speakerEl || !imgWrapEl) return;

    speakerEl.classList.remove("hide");

    imgWrapEl.appendChild(speakerEl);
  });

  // category filter
  const catBtnEls = Array.from(
    document.querySelectorAll("[data-category-btn]")
  );

  catBtnEls.forEach((el) => {
    el.addEventListener("click", () => {
      const category = el.dataset.categoryBtn;

      itemWrapEls.forEach((el) => {
        el.classList.remove("hide");
      });

      catBtnEls.forEach((el) => el.classList.remove("is-selected"));

      el.classList.add("is-selected");

      if (category === "All") return;

      itemWrapEls
        .filter((el) => el.dataset.categoryItem !== category)
        .forEach((el) => el.classList.add("hide"));
    });
  });

  // Live counter
  itemWrapEls.forEach((item) => {
    const dateEl = item.querySelector(".forum_c-date-wrap");

    if (!dateEl) return;

    const startTime = dateEl.dataset.startTime;
    const status = dateEl.dataset.status;

    if (!status || status !== "Upcoming" || !startTime) return;

    const remaining = timeRemaining(startTime.trim());

    if (!remaining) return;

    const remainingEl = `<p class="forum_live">Live in ${remaining}</p>`;

    const imgWrapEl = item.querySelector(".forum_img-wrap");

    imgWrapEl?.insertAdjacentHTML("beforeend", remainingEl);
  });

  function timeRemaining(timeString) {
    const targetDateUtc = new Date(timeString).getTime();

    const nowUtc = new Date().getTime();

    const diffMs = targetDateUtc - nowUtc;

    if (diffMs <= 0) {
      return null;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } else {
      return `${diffMinutes} min${diffMinutes !== 1 ? "s" : ""}`;
    }
  }
})();
