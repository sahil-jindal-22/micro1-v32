const state = {
  jobs: { result: [], count: 0 },
  pagination: {
    page: 1,
    limit: window.innerWidth < 991 ? 3 : 6,
    loading: false,
  },
  els: {
    wrapper: document.querySelector(".jobs_min-list"),
    section: document.querySelector(".s_j_jobs"),
  },
};

window.addEventListener("load", initJobs);

async function initJobs() {
  await fetchJobs();

  renderJobs();

  initPopover();
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
      }),
    }
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

  const date = job.date_posted
    ? new Date(job.date_posted).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  let skills = job.skills || [];
  const skillsCount = skills.length;

  if (skillsCount > 5) {
    skills = skills.slice(0, 5);
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
  }" target="_blank" class="jobs_item w-inline-block"
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
          (job.ideal_hourly_rate || job.ideal_yearly_compensation) && tag
            ? salary(tag, job.ideal_hourly_rate, job.ideal_yearly_compensation)
            : ""
        }
      </div>
      <div class="jobs_skills">
      ${skills.length ? "<div>Required skills</div>" : ""}
       
        <div class="jobs_skills-list">
           ${skills.reduce(
             (acc, curr) =>
               acc + `<div class="jobs_skill-cap"><div>${curr}</div></div>`,
             ""
           )}
           ${
             skillsCount > 5
               ? `<div class="jobs_skill-cap"><div>${
                   skillsCount - 5
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
  if (!tag) return;

  if (tag === "Core team") {
    if (!comp) return;

    const minFormatted = formatCompensation(comp?.["min"]);
    const maxFormatted = formatCompensation(comp?.["max"]);
    const salary = `${minFormatted}-${maxFormatted}/year compensation`;

    return `<div class="jobs_info-salary">
        <div dataset-popover="wrapper" class="jobs_info-cap">
          <div class="jobs_salary-icon"></div>
          <div>${salary}</div>
          <div dataset-popover="target" class="jobs_salary-trigger"></div>
          <div dataset-popover="item" class="popover_item is-salary">
            <div>
              Total compensation includes base salary, equity, bonuses, and benefits.
            </div>
          </div>
        </div>
      </div>`;
  }

  // for non-core jobs
  if (tag === "Extended team" && hourly) {
    const salary = `${hourly?.["min"]}-${hourly?.["max"]}/hour pay`;

    return `
      <div class="jobs_info-salary">
        <div class="jobs_info-cap">
          <div class="jobs_salary-icon"></div>
          <div>${salary}</div>
        </div>
      </div>
      `;
  }

  return;
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
  const jobList = state.els.wrapper;

  console.log(jobList);

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
        console.log(e.target, target);

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
