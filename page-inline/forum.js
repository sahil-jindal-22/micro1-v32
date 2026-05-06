(() => {
  const forum_list = document.querySelectorAll(".forum_list");

  forum_list[1].querySelectorAll(".forum_item-wrap").forEach((el) => {
    forum_list[0].appendChild(el);
  });

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

    const msMin = 1000 * 60;
    const msHour = msMin * 60;
    const msDay = msHour * 24;

    const days = Math.floor(diffMs / msDay);
    const remAfterDays = diffMs % msDay;
    const hrs = Math.floor(remAfterDays / msHour);

    if (diffMs < 48 * msHour) {
      const parts = [];
      if (days > 0) {
        parts.push(`${days} day${days !== 1 ? "s" : ""}`);
      }
      if (hrs > 0) {
        parts.push(`${hrs} hr${hrs !== 1 ? "s" : ""}`);
      }
      if (parts.length > 0) {
        return parts.join(" ");
      }
      const mins = Math.floor(diffMs / msMin);
      return `${mins} min${mins !== 1 ? "s" : ""}`;
    }

    return `${days} day${days !== 1 ? "s" : ""}`;
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
