let state = {
  jobs: { result: [], count: 0 },
  pagination: {
    page: 1,
    limit: 100,
    loading: false,
  },
  els: {
    wrapper: document.querySelector(".c_j_list"),
    section: document.querySelector(".s_c_j"),
  },
};

window.addEventListener("load", initJobs);

async function initJobs() {
  await fetchJobs();

  renderJobs();

  if (window.gsap !== undefined) ScrollTrigger.refresh();
}

async function fetchJobs() {
  const url = window.location.href;
  const baseURL = url.includes("webflow.io")
    ? "https://dev-api.micro1.ai/api/v1"
    : "https://prod-api.micro1.ai/api/v1";

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const response = await fetch(
    `${baseURL}/job/portal?page=${state.pagination.page}&limit=${state.pagination.limit}`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        action: "get_all_jobs",
        filters: { type: ["EXTENDED", "CORE_TEAM"] },
      }),
    },
  );

  const data = await response.json();
  state.jobs.count = data.total;

  // Ensure we only take the limit number of items
  const newJobs = data.data.slice(0, state.pagination.limit);

  // For initial load, replace the resul
  state.jobs.result = newJobs;

  console.log("Jobs loaded:", state.jobs.result.length);
}

function renderJobs() {
  state.els.wrapper.innerHTML = "";

  if (state.jobs.count === 0) {
    state.els.section.remove();
    return;
  }

  renderJobsList();
}

function renderJobsList() {
  state.jobs.result.forEach((job) => {
    state.els.wrapper.insertAdjacentHTML("beforeend", createJobEl(job));
  });
}

function createJobEl(job) {
  const tag = job.job_tags?.[0];

  return `
    <a href="${
      job.apply_url ? job.apply_url : ""
    }" target="_blank" class="c_j_item w-inline-block">
      <h1 class="c_j_name">${job.job_name ? job.job_name : ""}</h1>
      <p class="c_j_pay"> $${
        job.ideal_hourly_rate || job.ideal_yearly_compensation
          ? salary(tag, job.ideal_hourly_rate, job.ideal_yearly_compensation)
          : ""
      }</p>
    </a>
  `;
}

function formatCompensation(amount) {
  if (!amount || amount === 0) return "0";

  if (amount >= 1000000) {
    const millions = Math.floor((amount / 1000000) * 10) / 10;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }

  if (amount >= 1000) {
    const thousands = Math.floor((amount / 1000) * 10) / 10;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K`;
  }

  return amount.toString();
}

function salary(tag, hourly, comp) {
  if (tag === "Core team") {
    if (!comp) return;

    const minFormatted = formatCompensation(comp?.["min"]);
    const maxFormatted = formatCompensation(comp?.["max"]);
    const salary = `${minFormatted}-${maxFormatted}/year`;

    return salary;
  }

  // for non-core jobs
  if (hourly) {
    const salary = `${hourly?.["min"]}-${hourly?.["max"]}/hour`;

    return salary;
  }

  return;
}

function trackImgsLoadAll() {
  const wrappers = document.querySelectorAll("[data-track-img-load-all]");

  wrappers.forEach((el) => {
    const images = el.querySelectorAll("img");
    const count = images.length;
    let loadedCount = 0;

    images.forEach((img) => {
      const onLoad = () => {
        // img.classList.add("loaded");
        // img.parentElement.classList.add("loaded");
        loadedCount = loadedCount + 1;
        console.log(loadedCount);

        if (count === loadedCount)
          setTimeout(function () {
            el.classList.add("loaded");
          }, 300);
      };

      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener("load", onLoad);
      }
    });
  });
}

trackImgsLoadAll();
