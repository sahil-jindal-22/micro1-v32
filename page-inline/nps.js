window.addEventListener("DOMContentLoaded", initCount);

const wrapper = document.querySelector("#nps-wrap");

async function initCount() {
  const countEl = wrapper.querySelector("#nps-review");
  const npsEl = wrapper.querySelector("#nps-count");

  if (!wrapper) return;

  wrapper.style.opacity = 0;

  const { nps, count } = await getNPS();
  wrapper.style.transition = "all 0.3s";

  wrapper.style.opacity = 1;

  let counterNPS = new CountUp(npsEl, nps - 0.05, nps, 2, 1);
  let counterCount = new CountUp(countEl, count - 25, count, 0, 1);

  ScrollTrigger.create({
    trigger: wrapper,
    start: "top bottom",
    end: "bottom top",
    onEnter: () => {
      counterNPS?.start();
      counterCount?.start();
    },
  });
}

async function getNPS() {
  const isStaging = window.location.href.includes("webflow");

  const url = isStaging
    ? "https://dev-api.micro1.ai/api/v1/general/get-evals"
    : "https://prod-api.micro1.ai/api/v1/general/get-evals";
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();

    const score = result.data[0];

    const count = Number(score.feedback_count);
    const nps = Number(score.average_feedback).toFixed(2);

    return { count, nps };
  } catch (error) {
    console.error(error.message);
    document.querySelector(".exp_review")?.remove();
    wrapper.style.transition = "all 0.3s";
    wrapper.style.opacity = 1;
  }
}
