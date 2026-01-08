// Live counter
(() => {
  const dateEl = document.querySelector(".forum_date");

  if (!dateEl) return;

  const startTime = dateEl.dataset.startTime;
  const status = dateEl.dataset.status;

  if (!status || status !== "Upcoming" || !startTime) return;

  const remaining = timeRemaining(startTime.trim());

  if (!remaining) return;

  const remainingEl = `<p class="forum_live is-relative">Live in ${remaining}</p>`;

  const liveWrapEl = document.querySelector(".forum_live-wrap");

  liveWrapEl.insertAdjacentHTML("afterbegin", remainingEl);
})();

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
