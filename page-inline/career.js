let state = {
  jobs: { result: [], count: 0 },
  keyword: "",
  pagination: {
    page: 1,
    limit: 100,
    loading: false,
  },
  els: {
    wrapper: document.querySelector(".c_j_list"),
    section: document.querySelector(".s_c_j"),
    formSearch: document.querySelector(".jobs_form_c"),
    inputSearch: document.querySelector(".jobs_form_search_c"),
    btnSearchSubmit: document.querySelector(".jobs_form_btn_c"),
  },
  trackingString: "",
};

window.addEventListener("load", function () {
  updateJobs(true);
  initSearch();
});

async function updateJobs(checkParams = false) {
  // reset job
  state.pagination.page = 1;
  state.jobs.result = [];

  renderLoader();

  if (checkParams) {
    const params = new URLSearchParams(document.location.search);
    const search = params.get("search");

    if (search) {
      state.els.inputSearch.value = search;
      state.keyword = search;
    }
  }

  await fetchJobs();

  if (!state.trackingString) setUTM();

  renderJobs();

  if (window.gsap !== undefined) ScrollTrigger.refresh();
}

function renderLoader() {
  state.els.wrapper.innerHTML = "";

  const loaderEl = `
    <div class="jobs_loader-wrap">
      <div class="css-loader animate-loader">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  `;

  state.els.wrapper.insertAdjacentHTML("afterbegin", loaderEl);
}

async function fetchJobs() {
  const url = window.location.href;
  const baseURL = url.includes("webflow.io")
    ? "https://dev-api.micro1.ai/api/v1"
    : "https://prod-api.micro1.ai/api/v1";

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const response = await fetch(
    `${baseURL}/job/portal?page=${state.pagination.page}&limit=${state.pagination.limit}&keyword=${state.keyword}`,
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
    renderNoResults();
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

  const link = job.apply_url ? formatLink(job.apply_url) : "";

  return `
    <a href="${link}" target="_blank" class="c_j_item w-inline-block">
      <h1 class="c_j_name">${job.job_name ? job.job_name : ""}</h1>
      <p class="c_j_pay"> $${
        job.ideal_hourly_rate || job.ideal_yearly_compensation
          ? salary(tag, job.ideal_hourly_rate, job.ideal_yearly_compensation)
          : ""
      }</p>
    </a>
  `;
}

function renderNoResults() {
  state.els.wrapper.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="jobs_result-0-wrap">
      <div class="jobs_result-0-img"></div>
      <p>
        No jobs match your search. <span class="job_result-0-clear">Clear search</span>.
      </p>
    </div>
  `,
  );

  listenerClearFilters();
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

function initSearch() {
  state.els.formSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(123);
  });

  state.els.inputSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (state.els.inputSearch.value === "" && state.keyword === "") {
        return;
      }

      state.keyword = state.els.inputSearch.value;

      updateJobs();
    }
  });

  state.els.btnSearchSubmit.addEventListener("click", (e) => {
    e.preventDefault();

    if (state.els.inputSearch.value === "" && state.keyword === "") {
      return;
    }

    state.keyword = state.els.inputSearch.value;

    updateJobs();
  });
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

function clearSearch() {
  state.els.inputSearch.value = "";

  state.keyword = "";
}

function listenerClearFilters() {
  const resetFiltersEls = document.querySelectorAll(
    ".jobs_result-clear, .job_result-0-clear",
  );

  resetFiltersEls.forEach((el) =>
    el.addEventListener("click", () => {
      clearSearch();
      updateJobs();
    }),
  );
}

trackImgsLoadAll();

function setUTM() {
  const { cusRef, portalParams } = customTrackData;
  let finalString = portalParams;

  if (!finalString.includes("utm_source") && cusRef) {
    if (cusRef.includes("google")) cusRef = "google";

    finalString = finalString + `&utm_source=${cusRef}`;
  }

  state.trackingString = finalString;
}

function formatLink(href, queryString = state.trackingString) {
  if (!href) return "";
  const base = href.split("?")[0];
  return queryString ? `${base}?${queryString}` : base;
}
