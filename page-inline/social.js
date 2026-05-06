(() => {
  (() => {
    const forumItems = Array.from(
      document.querySelectorAll(".c_item.is-forum .forum_item-wrap"),
    );

    const socialItem = Array.from(
      document.querySelectorAll(".c_item.is-social .forum_item-wrap"),
    );

    forumItems.slice(4).forEach((el) => el.remove());

    socialItem.slice(4).forEach((el) => el.remove());

    document.querySelectorAll(".forum_list")?.forEach((list) => {
      if (!list.isConnected) return;
      if (!list.childElementCount && list.parentElement) {
        list.parentElement.remove();
      }
    });
  })();

  const itemWrapEls = Array.from(document.querySelectorAll(".forum_item-wrap"));

  // Move speakers
  itemWrapEls.forEach((item) => {
    const speakerEl = item.querySelector(".foum_speak");
    const imgWrapEl = item.querySelector(".forum_img-wrap");

    if (!speakerEl || !imgWrapEl) return;

    speakerEl.classList.remove("hide");

    imgWrapEl.appendChild(speakerEl);
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
})();
