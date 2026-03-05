(() => {
  const itemWrapEls = Array.from(document.querySelectorAll(".forum_item-wrap"));
  const emptyState = document.querySelector("#forum-no-events");
  const stateBtns = Array.from(document.querySelectorAll("[data-state-btn]"));
  const catInput = document.querySelector("#Select");

  // Move speakers
  itemWrapEls.forEach((item) => {
    const speakerEl = item.querySelector(".foum_speak");
    const imgWrapEl = item.querySelector(".forum_img-wrap");

    if (!speakerEl || !imgWrapEl) return;

    speakerEl.classList.remove("hide");

    imgWrapEl.appendChild(speakerEl);
  });

  // state filter
  stateBtns.forEach((el) => {
    el.addEventListener("click", () => {
      const state = el.dataset.stateBtn;

      itemWrapEls.forEach((el) => {
        el.classList.remove("hide-state");
      });

      stateBtns.forEach((el) => el.classList.remove("is-selected"));

      el.classList.add("is-selected");

      if (state === "All") {
        window.requestAnimationFrame(() => {
          checkEmpty();
        });
        return;
      }

      itemWrapEls
        .filter((el) => el.dataset.state !== state)
        .forEach((el) => el.classList.add("hide-state"));

      window.requestAnimationFrame(() => {
        checkEmpty();
      });
    });
  });

  // category filter
  catInput.addEventListener("change", () => {
    const category = catInput.value;

    itemWrapEls.forEach((el) => {
      el.classList.remove("hide-cat");
    });

    if (category === "All categories") {
      window.requestAnimationFrame(() => {
        checkEmpty();
      });
      return;
    }

    itemWrapEls
      .filter((el) => el.dataset.categoryItem !== category)
      .forEach((el) => el.classList.add("hide-cat"));

    window.requestAnimationFrame(() => {
      checkEmpty();
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

  function checkEmpty() {
    const currentEls = itemWrapEls.filter(
      (el) =>
        !el.classList.contains("hide-state") &&
        !el.classList.contains("hide-cat"),
    );

    if (currentEls.length === 0) {
      emptyState.classList.remove("hide");
    } else {
      emptyState.classList.add("hide");
    }
  }
})();
