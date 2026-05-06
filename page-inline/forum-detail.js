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
