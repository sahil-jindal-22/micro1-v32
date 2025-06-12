function roundCurrency(value) {
  if (value >= 1e9) return `$${Math.round(value / 1e9)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  if (value >= 1e3) return `$${Math.round(value / 1e3)}K`;
  return `$${Math.round(value)}`;
}

async function getCompanySize(userContactInfo) {
  function fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms: ${url}`));
      }, timeout);

      fetch(url)
        .then((res) => {
          clearTimeout(timer);
          console.log(res);
          if (!res.ok) {
            reject(new Error(`HTTP error ${res.status} from ${url}`));
          }
          // Check content type before parsing
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json();
          } else {
            // If not JSON, return null
            return null;
          }
        })
        .then((data) => {
          if (!data || data?.message === "no-company-found") {
            resolve(null);
          } else {
            resolve(data);
          }
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  try {
    const domain = userContactInfo.email.split("@")[1];

    const freeDomains = [
      "gmail.com",
      "googlemail.com",
      "yahoo.com",
      "yahoo.co.uk",
      "yahoo.co.in",
      "yahoo.fr",
      "yahoo.de",
      "yahoo.it",
      "yahoo.es",
      "yahoo.ca",
      "hotmail.com",
      "outlook.com",
      "live.com",
      "msn.com",
      "icloud.com",
      "me.com",
      "mac.com",
      "aol.com",
      "protonmail.com",
      "proton.me",
      "zoho.com",
      "yandex.com",
      "yandex.ru",
      "mail.ru",
      "gmx.com",
      "gmx.de",
      "web.de",
      "qq.com",
      "163.com",
      "126.com",
      "naver.com",
      "daum.net",
      "rediffmail.com",
    ];

    if (freeDomains.includes(domain)) return;

    const personApiUrl = `https://hook.us1.make.com/lxholkn672i1jsfsgrs82geyxn641a0u?email=${encodeURIComponent(
      userContactInfo.email
    )}`;
    const domainApiUrl = `https://hook.us1.make.com/ax4r7raw56xdx5aemjmsoxuwgbfxhu6y?domain=${encodeURIComponent(
      domain
    )}`;

    // Start both requests in parallel
    const personRequest = fetchWithTimeout(personApiUrl);
    const domainRequest = fetchWithTimeout(domainApiUrl);

    let data;

    try {
      // Try person API first
      data = await personRequest;
      if (!data) {
        // If person API returns null, try domain API
        console.log("Person API returned no company, trying domain API");
        data = await domainRequest;
      }
    } catch (error) {
      // If person API fails, try domain API
      console.log("Person API failed, trying domain API");
      data = await domainRequest;
    }

    // If both APIs returned null or failed
    if (!data) {
      throw new Error("No company data found from either API");
    }

    console.log(data);

    utilities.createCookie("companyInfo", data, true);

    utilities.updateInput(
      document.querySelectorAll(".input_company-size"),
      data.size
    );
    utilities.updateInput(
      document.querySelectorAll(".input_company-linkedin"),
      data.linkedin
    );
    utilities.updateInput(
      document.querySelectorAll(".input_company-funding"),
      this.roundCurrency(data.funding)
    );

    customTrackData.company = data;

    return data;
  } catch (error) {
    console.error(error.message);
    console.log("couldn't enrich");
    utilities.updateInput(
      document.querySelectorAll(".input_company-size"),
      "couldn't enrich"
    );
    return null;
  }
}

function updateInput(inputArr, data) {
  [...inputArr].forEach((input) => (input.value = data));
}

(() => {
  const heroRadioEls = document.querySelectorAll(".hero_form-radio");
  const firstNameInput = document.querySelector('[name="talent-first-name"]');
  const lastNameInput = document.querySelector('[name="talent-last-name"]');
  const emailInput = document.querySelector('[name="talent-email"]');
  const skillsInput = document.querySelector('[name="talent-skills-final"]');
  const submitEl = document.querySelector(".hero_form-cta-wrap .button");
  const mainForm = submitEl?.closest("form");
  const errorEl = document.querySelector(".hero_form-error");
  const formType = "talent";
  const allInputs = document.querySelectorAll("input");

  allInputs.forEach((input) =>
    input.addEventListener("keydown", handleKeydown)
  );

  mainForm.addEventListener("submit", (e) => {
    e.preventDefault();

    submitForm();
  });

  submitEl.addEventListener("click", submitForm);

  function handleKeydown(e) {
    if (e.isComposing || e.keyCode === 229) {
      return;
    }
    if (!(e.key === "Enter")) return;

    e.preventDefault();

    submitForm();
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hide");
  }

  function hideError() {
    errorEl.textContent = "Please enter values in all fields";
    errorEl.classList.add("hide");
  }

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  // radio - set class and value
  heroRadioEls.forEach((el) => {
    const inputEl = el.querySelector("input");

    inputEl.addEventListener("change", (e) => {
      heroRadioEls.forEach((el) => el.classList.remove("is-active"));
      if (e.target.checked) {
        el.classList.add("is-active");
        skillsInput.value = el.querySelector("input").value;
      }
    });
  });

  function verifyStepFields() {
    if (!firstNameInput.value || !lastNameInput.value) {
      showError("Please enter your first and last name");
      return false;
    }
    if (!emailInput.value) {
      showError("Please enter your email");
      return false;
    }
    if (emailInput.value && !validateEmail(emailInput.value)) {
      showError("Please enter email in correct format");
      return false;
    }
    if (!skillsInput.value) {
      showError("Please select the type of hire");
      return false;
    }

    hideError();
    return true;
  }

  async function submitForm() {
    const result = verifyStepFields();

    if (!result) {
      return;
    }

    console.log("ready to submit");

    submitEl.textContent = "Please wait...";

    const userContactInfo = {
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
      email: emailInput.value,
    };

    console.log(userContactInfo);

    createCookie("userContactInfo", userContactInfo, true);

    // Twitter conversion code
    window.twq && twq("event", "tw-ocr68-ooizv", {});

    console.log("twitter code fired talent");

    createCookie("talentFormSubmitted", "1", false, 7);

    // set custom params
    let numFormSubmissions = getCookieValue("numFormSubmissons");

    if (numFormSubmissions) {
      numFormSubmissions = +numFormSubmissions + 1;
    } else {
      numFormSubmissions = 1;
    }

    createCookie("numFormSubmissons", numFormSubmissions, false, 90);

    await getCompanySize(userContactInfo);

    await submitFormToMake();
  }

  // submit to make.com
  async function submitFormToMake() {
    console.log("init form submit");
    try {
      const response = await fetch(
        "https://hook.us1.make.com/iixlkvnhvlvods3gx3l1rnftpkk92std",
        {
          method: "POST",
          header: {
            Accept: "application/json",
          },
          body: new FormData(mainForm),
        }
      );

      if (!response.ok) {
        console.log(response);

        throw new Error(
          "Form not submitted! Please try again later or contact support@micro1.ai"
        );
      }

      // redirect
      console.log("form submitted successfully, redirecting!");
      document.location.href = `/book-hiring-call`;
    } catch (error) {
      console.error(error);

      showError(error.message);
    }
  }
})();
