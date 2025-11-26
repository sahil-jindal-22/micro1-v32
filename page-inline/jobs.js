const state = {
  jobs: { result: [], count: 0 },
  keyword: "",
  filters: { type: "", location: "" },
  pagination: { page: 1, limit: 18, loading: false },
  els: {
    wrapper: document.querySelector(".jobs_list"),
    formSearch: document.querySelector(".jobs_form_form"),
    inputSearch: document.querySelector(".jobs_form_search"),
    btnSearchSubmit: document.querySelector(".jobs_form_btn"),
    btnOpenFilter: document.querySelector(".jobs_form_filter"),
    btnFormSubmit: document.querySelector("input[type='submit']"),
    formFilters: document.querySelector(".jobs_popup_form"),
    btnFiltersApply: document.querySelectorAll(".jobs_form_cta button")[1],
    btnFiltersDiscard: document.querySelectorAll(".jobs_form_cta button")[0],
  },
};

async function initApp() {
  updateJobs(true);
  initSearch();
  initFilters();
  initPopover();
}

initApp();

async function updateJobs(checkParams = false) {
  // Remove existing sentinel
  const existingSentinel = document.querySelector(".scroll-sentinel");
  if (existingSentinel) existingSentinel.remove();

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

  renderJobs();

  setupInfiniteScroll();
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

function renderMoreLoader() {
  // Remove existing loader if any
  const existingLoader = document.querySelector(".jobs_loader-wrap");
  if (existingLoader) existingLoader.remove();

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

  state.els.wrapper.insertAdjacentHTML("beforeend", loaderEl);
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
        filters: {
          engagement_type: state.filters.type?.toLowerCase(),
          location: state.filters.location?.toLowerCase(),
        },
      }),
    }
  );

  const data = await response.json();
  state.jobs.count = data.total;

  // Ensure we only take the limit number of items
  const newJobs = data.data.slice(0, state.pagination.limit);

  // For initial load, replace the results
  if (state.pagination.page === 1) {
    state.jobs.result = newJobs;
  } else {
    // For infinite scroll, append the new results
    state.jobs.result = [...state.jobs.result, ...newJobs];
  }

  console.log("Jobs loaded:", state.jobs.result.length);
}

function renderJobs() {
  state.els.wrapper.innerHTML = "";

  if (state.jobs.count === 0) {
    renderNoResults();
    return;
  }

  renderJobsHeader();
  renderJobsList();
}

function renderJobsHeader() {
  const hasFilters =
    state.keyword || state.filters.location || state.filters.type;
  const clearFiltersButton = hasFilters
    ? "<span class='jobs_result-clear'>Clear filters</span>"
    : "";

  state.els.wrapper.insertAdjacentHTML(
    "afterbegin",
    `<p class="jobs_result-info">${state.jobs.count} jobs found ${clearFiltersButton}</p>`
  );

  listenerClearFilters();
}

function renderJobsList() {
  state.jobs.result.forEach((job) => {
    state.els.wrapper.insertAdjacentHTML("beforeend", createJobEl(job));
  });
}

function renderLoadMoreSentinel() {
  // Remove existing sentinel
  const existingSentinel = document.querySelector(".scroll-sentinel");
  if (existingSentinel) existingSentinel.remove();

  // Add new sentinel if more jobs exist
  if (state.jobs.result.length < state.jobs.count) {
    state.els.wrapper.insertAdjacentHTML(
      "afterend",
      '<div class="scroll-sentinel"></div>'
    );

    const newSentinel = document.querySelector(".scroll-sentinel");
    if (newSentinel && state.observer) {
      state.observer.observe(newSentinel);
    }
  }
}

function setupInfiniteScroll() {
  if (state.observer) {
    state.observer.disconnect();
  }

  state.observer = createIntersectionObserver();
  renderLoadMoreSentinel();
}

function createIntersectionObserver() {
  return new IntersectionObserver(
    async (entries) => {
      const sentinel = entries[0];
      if (sentinel.isIntersecting && !state.pagination.loading) {
        state.observer.unobserve(sentinel.target);
        console.log("visible");
        await loadMoreJobs();
      }
    },
    { rootMargin: "100px" }
  );
}

async function loadMoreJobs() {
  if (state.jobs.result.length >= state.jobs.count) return;

  state.pagination.loading = true;
  renderMoreLoader();

  // Load new jobs
  state.pagination.page += 1;
  await fetchJobs();

  // Remove loader
  const loader = document.querySelector(".jobs_loader-wrap");
  if (loader) loader.remove();

  // Render only new jobs
  const startIndex = (state.pagination.page - 1) * state.pagination.limit;
  const newJobs = state.jobs.result.slice(startIndex);
  newJobs.forEach((job) => {
    state.els.wrapper.insertAdjacentHTML("beforeend", createJobEl(job));
  });

  state.pagination.loading = false;
  renderLoadMoreSentinel();
}

function renderNoResults() {
  state.els.wrapper.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="jobs_result-0-wrap">
      <div class="jobs_result-0-img"></div>
      <p>
        No jobs match your search. Try adjusting the filters or
        <span class="job_result-0-clear">Clear filters</span>.
      </p>
    </div>
  `
  );

  listenerClearFilters();
}

function createJobEl(job) {
  const tag = job.job_tags?.[0];

  const date = job.date_posted
    ? new Date(job.date_posted).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  let skills = job.skills || [];
  const skillsCount = skills.length;

  if (skillsCount > 6) {
    skills = skills.slice(0, 6);
  }

  const defaultLogo =
    "https://cdn.prod.website-files.com/68b095121300aebde21ab3f4/68d1b0bfb4d9544f62f81232_micro1%20icon%20(1).webp";
  const micro1Logo =
    "https://cdn.prod.website-files.com/68b095121300aebde21ab3f4/68d1b0c145c1e24606f22f37_micro1%20icon.webp";

  let logo = job.company_logo;

  if (logo) {
    if (logo.includes("micro1-single-logo.png")) logo = micro1Logo;
    if (logo.includes("default-company-icon.png")) logo = defaultLogo;
  } else {
    logo = defaultLogo;
  }

  const location = job.location_type
    ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1)
    : "Remote";

  return `<a href="${
    job.apply_url ? job.apply_url : ""
  }" class="jobs_item w-inline-block"
    ><div class="jobs_top-wrap">
      <div class="jobs_logo-wrap">
        <img
          src="${logo}"
          loading="lazy"
          alt=""
          class="jobs_logo"
        />

        <div class="jobs_info-wrap">
          <div class="jobs_date">${date}</div>
          ${tag ? jobTag(tag) : ""}
        </div>
      </div>
      <div>
        <h2 class="jobs_name">${job.job_name ? job.job_name : ""}</h2>
        <div class="jobs_company">${
          job.company_name ? job.company_name : ""
        }</div>
      </div>
      <div class="jobs_info">
        <div class="jobs_info-cap">
          <div class="jobs_loc-icon"></div>
          <div>${location}</div>
        </div>
        ${
          job.engagement_type
            ? `<div class="jobs_info-cap">
          <div class="jobs_type-icon"></div>
          <div>${
            job.engagement_type.charAt(0).toUpperCase() +
            job.engagement_type.slice(1)
          }</div>
        </div>`
            : ""
        }
        ${
          tag
            ? salary(tag, job.ideal_hourly_rate, job.ideal_yearly_compensation)
            : ""
        }
      </div>
      <div class="jobs_skills">
        <div>Required skills</div>
       
        <div class="jobs_skills-list">
           ${skills.reduce(
             (acc, curr) =>
               acc + `<div class="jobs_skill-cap"><div>${curr}</div></div>`,
             ""
           )}
           ${
             skillsCount > 6
               ? `<div class="jobs_skill-cap"><div>${
                   skillsCount - 6
                 }+ more</div></div>`
               : ``
           }
        </div>
      </div>
    </div>
    <div class="jobs_cta"><div>Apply</div></div></a
  >

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
  let salary;

  if (tag === "Extended team") {
    if (!hourly) return;
    salary = `${hourly?.["min"]}-${hourly?.["max"]}/hour pay`;

    return `
    <div class="jobs_info-salary">
      <div class="jobs_info-cap">
        <div class="jobs_salary-icon"></div>
        <div>${salary}</div>
      </div>
    </div>
    `;
  }

  if (tag === "Core team") {
    if (!comp) return;

    const minFormatted = formatCompensation(comp?.["min"]);
    const maxFormatted = formatCompensation(comp?.["max"]);
    salary = `${minFormatted}-${maxFormatted}/year compensation`;

    return `<div class="jobs_info-salary">
        <div dataset-popover="wrapper" class="jobs_info-cap">
          <div class="jobs_salary-icon"></div>
          <div>${salary}</div>
          <div dataset-popover="target" class="jobs_salary-trigger"></div>
          <div dataset-popover="item" class="popover_item is-salary">
            <div>
              Total compensation includes base salary, bonuses, and benefits.
            </div>
          </div>
        </div>
      </div>`;
  }
}

function jobTag(tag) {
  const config = {
    "Core team": {
      className: "is-core",
      text: "This opening is for the micro1 core team as a full time employee",
    },
    "Extended team": {
      className: "is-extended",
      text: "As a contractor working with the micro1 core team closely",
    },
  };
  let html;

  html = `<div dataset-popover="wrapper" class="jobs_tag_wrap">
    <div dataset-popover="target" class="jobs_tag ${config[tag]?.className}">
      ${tag}
    </div>
    <div dataset-popover="item" class="popover_item">
      ${config[tag]?.text}
    </div>
  </div>`;

  return html;
}

function initPopover() {
  const jobList = document.querySelector(".jobs_list");

  const isMobile = window.matchMedia("(max-width: 991px)").matches;

  if (isMobile) {
    jobList.addEventListener("click", (e) => {
      const target = e.target.closest("[dataset-popover='target']");
      if (target) {
        e.preventDefault();
        const wrapper = target.closest("[dataset-popover='wrapper']");

        wrapper?.classList.toggle("show-popover");
      }
    });

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[dataset-popover='target']");
      if (!target) {
        const opens = document.querySelectorAll(".show-popover");
        opens.forEach((el) => el.classList.remove("show-popover"));
      }
    });
  } else {
    jobList.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[dataset-popover='target']");
      if (target) {
        const wrapper = target.closest("[dataset-popover='wrapper']");
        wrapper?.classList.add("show-popover");
      }
    });
    jobList.addEventListener("mouseout", (e) => {
      const target = e.target.closest("[dataset-popover='target']");
      if (target) {
        const wrapper = target.closest("[dataset-popover='wrapper']");
        wrapper?.classList.remove("show-popover");
      }
    });
  }
}

function initSearch() {
  state.els.formSearch.addEventListener("submit", (e) => {
    e.preventDefault();
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

function clearSearch() {
  state.els.inputSearch.value = "";

  state.keyword = "";
}

function initFilters() {
  state.els.btnOpenFilter.addEventListener("click", (e) => {
    e.preventDefault();
  });

  state.els.formFilters.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  state.els.btnFiltersApply.addEventListener("click", () => {
    state.filters.type = document.querySelector(
      'input[name="Engagement-type"]:checked'
    )?.value;
    state.filters.location = document.querySelector(
      'input[name="Location"]:checked'
    )?.value;

    updateJobs();
  });

  state.els.btnFiltersDiscard.addEventListener("click", () => {
    clearFilters();
    updateJobs();
  });
}

function clearFilters() {
  const allRadio = document.querySelectorAll(".jobs_form_radio");

  allRadio.forEach((radioEl) => {
    radioEl.querySelector("input").checked = false;
    radioEl
      .querySelector(".w-form-formradioinput")
      .classList.remove("w--redirected-checked");
  });

  state.filters.type = "";
  state.filters.location = "";
}

function listenerClearFilters() {
  const resetFiltersEls = document.querySelectorAll(
    ".jobs_result-clear, .job_result-0-clear"
  );

  resetFiltersEls.forEach((el) =>
    el.addEventListener("click", () => {
      clearSearch();
      clearFilters();
      updateJobs();
    })
  );
}
