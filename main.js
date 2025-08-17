let sliders;
const staging = window.location.href.includes("webflow.io") ? true : false;
const URLParams = new URLSearchParams(location.search);

const utilities = {
  roundCurrency(value) {
    if (value >= 1e9) return `$${Math.round(value / 1e9)}B`;
    if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
    if (value >= 1e3) return `$${Math.round(value / 1e3)}K`;
    return `$${Math.round(value)}`;
  },
  updateInput(inputArr, data) {
    [...inputArr].forEach((input) => (input.value = data));
  },
  createCookie(name, data, stringify = false, expiry = 30) {
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + expiry);

    document.cookie = `${name}=${encodeURIComponent(
      stringify ? JSON.stringify(data) : data
    )}; path=/; expires=${expireTime}`;
  },
  loadScript(src, defer = false) {
    return new Promise((resolve) => {
      const scriptEl = document.createElement("script");
      if (defer) scriptEl.defer = true;
      else scriptEl.async = true;
      scriptEl.src = src;
      scriptEl.type = "text/javascript";

      document.body.appendChild(scriptEl);

      scriptEl.addEventListener("load", () => {
        resolve();
      });
    });
  },
  async getCompanySize(userContactInfo) {
    function fetchWithTimeout(url, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout after ${timeout}ms: ${url}`));
        }, timeout);

        fetch(url)
          .then((res) => {
            clearTimeout(timer);
            // console.log(res);
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
        "pm.me",
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

      // console.log(data);

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
  },
  loadStyle(href) {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.href = href;
      link.rel = "stylesheet";
      link.type = "text/css";

      document.head.appendChild(link);

      link.addEventListener("load", () => {
        resolve();
      });
    });
  },
  addClassToEls(arr, className) {
    arr.forEach((el) => el.classList.add(className));
  },
  removeClassFromEls(arr, className) {
    arr.forEach((el) => el.classList.remove(className));
  },
  toSnakeCaseObject(originalObj) {
    const formatToSnakeCase = (input) => {
      return input
        .replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase to snake_case
        .replace(/[\s-]+/g, "_") // spaces and hyphens to underscores
        .toLowerCase(); // lowercase everything
    };

    const newObj = {};
    for (const [key, value] of Object.entries(originalObj)) {
      const formattedKey = formatToSnakeCase(key);
      newObj[formattedKey] = value;
    }

    return newObj;
  },
};

const initTracking = {
  initWidgetCta() {
    const realLink = document.getElementById("clientRegister");
    window.addEventListener("message", (event) => {
      // console.log(event.data);
      if (
        event.data.type === "clientRegistration" ||
        event.data.type === "clientRegistrationInterviewer"
      ) {
        if (event.data.cta) {
          realLink.dataset.text = event.data.cta;
        }

        if (event.data.widget) {
          realLink.dataset.widget = event.widget;
        }

        realLink?.click();
      }
    });
  },
  hutk() {
    function getUTK(deskTimeout, mobTimeout, interval) {
      const initialTime = +new Date();
      let timeout = deskTimeout;

      if (window.innerWidth < 992) timeout = mobTimeout;

      return new Promise(function promiseResolver(resolve, reject) {
        function checkUTK() {
          const currentTime = +new Date();
          if (currentTime - initialTime > timeout) return reject("");

          let utk = getCookieValue("hubspotutk");
          if (utk !== "") return resolve(utk);

          setTimeout(checkUTK, interval);
        }

        checkUTK();
      });
    }

    window.addEventListener("load", async function () {
      let hutk = getCookieValue("hubspotutk");

      if (!hutk) {
        try {
          hutk = await getUTK(10000, 15000, 1000);
        } catch {
          hutk = "";
        }
      }

      utilities.updateInput(document.querySelectorAll(".hutk_input"), hutk);

      customTrackData.hutk = hutk;
    });
  },
  organicSocialRef() {
    const ref = document.referrer;
    const refTwitter = ref.includes("//t.co/");
    const refLinkedin = ref.includes("linkedin.com") || ref.includes("lnkd.in");

    if (!refTwitter && !refLinkedin) return;

    if (getCookieValue("utm_cookie_contact")) return;

    let refSource;
    const utm_cookie_contact = {};

    if (refTwitter) refSource = "Twitter";
    if (refLinkedin) refSource = "LinkedIn";

    utm_cookie_contact.utm_source = refSource;
    utm_cookie_contact.utm_medium = "social";
    utm_cookie_contact.utm_term = null;
    utm_cookie_contact.utm_content = null;
    utm_cookie_contact.utm_campaign = null;

    utilities.createCookie("utm_cookie_contact", utm_cookie_contact, true);
  },
  setRef() {
    let refCookie = getCookieValue("cus_ref_site");

    if (refCookie) {
      refCookie = decodeURIComponent(refCookie);

      if (
        refCookie.includes("micro1.ai") ||
        refCookie.includes("staging") ||
        refCookie.includes("meetings")
      )
        return;

      customTrackData.cusRef = refCookie;

      utilities.updateInput(
        document.querySelectorAll(".ref_site_input"),
        refCookie
      );
    }

    let ref = document.referrer;

    if (!ref) return;

    if (
      ref.includes("micro1.ai") ||
      ref.includes("staging") ||
      ref.includes("meetings")
    )
      return;

    const refObj = new URL(ref);

    ref = refObj.host ? refObj.host : refObj.pathname;

    utilities.createCookie("cus_ref_site", ref);

    customTrackData.cusRef = ref;
    utilities.updateInput(document.querySelectorAll(".ref_site_input"), ref);
  },
  storeUTM() {
    const utm_source = URLParams.get("utm_source");
    const utm_campaign = URLParams.get("utm_campaign");
    const utm_medium = URLParams.get("utm_medium");
    const utm_content = URLParams.get("utm_content");
    const utm_term = URLParams.get("utm_term");

    if (utm_source || utm_campaign || utm_medium || utm_content || utm_term) {
      const curr_cookie_contact = getCookieValue("utm_cookie_contact");

      if (curr_cookie_contact) {
        const currentCookieUTM = JSON.parse(
          decodeURIComponent(curr_cookie_contact)
        );

        if (!utm_campaign && currentCookieUTM.utm_campaign) return;
      }

      const utm_cookie_contact = {};

      utm_cookie_contact.utm_source = utm_source;
      utm_cookie_contact.utm_campaign = utm_campaign;
      utm_cookie_contact.utm_medium = utm_medium;
      utm_cookie_contact.utm_content = utm_content;
      utm_cookie_contact.utm_term = utm_term;

      utilities.createCookie("utm_cookie_contact", utm_cookie_contact, true);
    }
  },
  fetchUTM() {
    try {
      const utm_cookie_contact = getCookieValue("utm_cookie_contact");

      if (!utm_cookie_contact) return;

      const { utm_source, utm_campaign, utm_medium, utm_content, utm_term } =
        JSON.parse(decodeURIComponent(utm_cookie_contact));

      utilities.updateInput(
        document.querySelectorAll(".utm_source_input"),
        utm_source
      );
      utilities.updateInput(
        document.querySelectorAll(".utm_campaign_input"),
        utm_campaign
      );
      utilities.updateInput(
        document.querySelectorAll(".utm_medium_input"),
        utm_medium
      );
      utilities.updateInput(
        document.querySelectorAll(".utm_content_input"),
        utm_content
      );
      utilities.updateInput(
        document.querySelectorAll(".utm_term_input"),
        utm_term
      );

      customTrackData.utm = {
        utm_source,
        utm_campaign,
        utm_medium,
        utm_content,
        utm_term,
      };
    } catch (err) {
      console.error(err);
    }
  },
  trackPages() {
    // Current page
    let current_page = location.href;
    utilities.updateInput(
      document.querySelectorAll(".current_page_name"),
      current_page
    );

    if (current_page === "/") current_page = "/home";

    customTrackData.current_page = current_page;

    // Last page
    try {
      let last_page = decodeURIComponent(getCookieValue("last_page"));

      if (!last_page) {
        last_page = URLParams.get("last_page");
      }

      if (last_page) {
        if (last_page === "/") last_page = "/home";

        utilities.updateInput(
          document.querySelectorAll(".last_page_name"),
          last_page
        );

        customTrackData.last_page = last_page;
      }

      utilities.createCookie("last_page", current_page);
    } catch (err) {
      console.error(err);
    }

    // First page
    (() => {
      let first_page = decodeURIComponent(getCookieValue("first_page"));

      if (!first_page) {
        first_page = URLParams.get("first_page");

        if (!first_page) first_page = document.location.href;

        if (first_page === "/") first_page = "/home";

        utilities.createCookie("first_page", first_page);
      }

      utilities.updateInput(
        document.querySelectorAll(".first_page_name"),
        first_page
      );

      customTrackData.first_page = first_page;
    })();

    // Ref parameter
    (() => {
      const ref = URLParams.get("ref");
      if (ref) utilities.createCookie("ref", ref);

      let refCookie = getCookieValue("ref");
      if (!refCookie) return;
      try {
        refCookie = decodeURIComponent(refCookie);
        utilities.updateInput(
          document.querySelectorAll(".ref_input"),
          refCookie
        );
        customTrackData.ref = refCookie;
      } catch {
        console.log("error");
      }
    })();
  },
  setURLParms() {
    let first_page, last_page;

    if (customTrackData.first_page) {
      first_page = document.createElement("a");
      first_page.href = customTrackData.first_page;
      first_page = first_page.pathname;

      if (first_page === "/") first_page = "/home";
    }
    if (customTrackData.current_page) {
      last_page = document.createElement("a");
      last_page.href = customTrackData.current_page;
      last_page = last_page.pathname;

      if (last_page === "/") last_page = "/home";
    }

    const currentPath = window.location.pathname;
    const { utm, user } = customTrackData;

    const paramsObj = {
      ...(utm.utm_campaign && { utm_campaign: utm.utm_campaign }),
      ...(utm.utm_medium && { utm_medium: utm.utm_medium }),
      ...(utm.utm_source && { utm_source: utm.utm_source }),
      ...(utm.utm_content && { utm_content: utm.utm_content }),
      ...(utm.utm_term && { utm_term: utm.utm_term }),
      ...(first_page && { first_page: first_page }),
      ...(last_page && { last_page: last_page }),
    };

    const addParamsToURLs = function (paramsObj, identifierArr) {
      const paramsStr = decodeURIComponent(
        new URLSearchParams(paramsObj).toString()
      );

      customTrackData.portalParams = paramsStr;

      const links = [
        ...document.querySelectorAll("a[href]:not([href='#'])"),
      ].filter((link) => identifierArr.some((str) => link.href.includes(str)));

      links.forEach(
        (link) =>
          (link.href += link.href.includes("?")
            ? `&${paramsStr}`
            : `?${paramsStr}`)
      );

      return links;
    };

    (() => {
      const paths = ["/letter"];

      addParamsToURLs(paramsObj, paths);
    })();

    (() => {
      let hutk;

      hutk = getCookieValue("hubspotutk");

      let deviceId;

      if (window.amplitude) {
        deviceId = amplitude.getDeviceId();
      }

      let src;

      if (
        currentPath.includes("ai-recruiter") ||
        currentPath.includes("saas") ||
        currentPath.includes("zara") ||
        currentPath.includes("pricing") ||
        currentPath.includes("calculator")
      ) {
        src = "ai-interviewer";
      } else if (
        currentPath.includes("cor") ||
        currentPath.includes("onboard")
      ) {
        src = "cor";
      } else if (
        currentPath.includes("talent") ||
        currentPath.includes("/tech/") ||
        currentPath.includes("human-data") ||
        currentPath.includes("vetting")
      ) {
        src = "search-talent";
      } else {
        src = "general";
      }

      console.log(src);

      const paramsObjPortal = {
        ...paramsObj,
        ...(user.first_name && { first_name: user.first_name }),
        ...(user.last_name && { last_name: user.last_name }),
        ...(user.email && { email: user.email }),
        ...((currentPath.includes("search-talent") ||
          currentPath.includes("thank") ||
          currentPath.includes("register")) && {
          meeting: "booked",
        }),
        src,
        ...(hutk && { hutk: hutk }),
        ...(customTrackData.cusRef && { ref_site: customTrackData.cusRef }),
        ...(deviceId && { deviceId }),
        ...(encodeURIComponent(getCookieValue("formSubmitted")) && {
          formSubmitted: true,
        }),
      };

      const domainList = [
        "client.micro1.ai",
        "zara.micro1.ai",
        "dev.d3tafas16ltk5f.amplifyapp.com",
        "talent.micro1.ai",
        "dev.d1y3udqq47tapp.amplifyapp.com",
        "feat-zara-dashboard.d1y3udqq47tapp.amplifyapp.com",
      ];

      const portalLinks = addParamsToURLs(paramsObjPortal, domainList);

      portalLinks.forEach((link) => {
        const accountType = link.dataset.accountType;

        if (accountType) {
          console.log(link, "changed account type to", accountType);
          link.href = link.href.replace(`src=${src}`, `src=${accountType}`);
        }

        if (window.location.host.includes("webflow.io")) {
          link.href = link.href.replace(
            "www.client.micro1.ai",
            "dev.d1y3udqq47tapp.amplifyapp.com"
          );
          link.href = link.href.replace(
            "www.talent.micro1.ai",
            "dev.d3tafas16ltk5f.amplifyapp.com"
          );
          link.href = link.href.replace(
            "www.zara.micro1.ai",
            "feat-zara-dashboard.d1y3udqq47tapp.amplifyapp.com"
          );
        }
      });

      // Get user data from meeting form
      const meetingContainer = document.querySelector(
        ".meetings-iframe-container"
      );

      if (meetingContainer) {
        window.addEventListener("message", (event) => {
          if (event.data.meetingBookSucceeded) {
            meetingContainer.querySelector(
              ".meetings-iframe-container iframe"
            ).style.height = "auto";

            const product = meetingContainer.dataset.product;

            const { firstName, lastName, email } =
              event.data.meetingsPayload.bookingResponse.postResponse.contact;

            const userContactInfo = { firstName, lastName, email };

            utilities.createCookie("userContactInfo", userContactInfo, true);

            // send amplitude event
            const amplitudeEventParams = {
              ...(customTrackData.company && customTrackData.company),
              ...(customTrackData.utm && customTrackData.utm),
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
              ...(email && { email }),
              ...(customTrackData["first_page"] && {
                first_page: customTrackData["first_page"],
              }),
              ...(customTrackData["last_page"] && {
                last_page: customTrackData["last_page"],
              }),
              ...(customTrackData["current_page"] && {
                current_page: customTrackData["current_page"],
              }),
              ...(customTrackData["ref"] && {
                ref: customTrackData["ref"],
              }),
              ...(customTrackData["cusRef"] && {
                referring_site: customTrackData["cusRef"],
              }),
              ...(product && { product }),
            };

            if (window.amplitude) {
              window.amplitude.setUserId(amplitudeEventParams.email);

              window.amplitude.track(
                "Static - Demo booked",
                amplitudeEventParams
              );
            }

            // set custom params
            if (email && customTrackData) {
              let numFormSubmissions = getCookieValue("numFormSubmissons");

              if (numFormSubmissions) {
                numFormSubmissions = +numFormSubmissions + 1;
              } else {
                numFormSubmissions = 1;

                fetch(
                  "https://hook.us1.make.com/1c8l4ud39pmo2isaas072kr61n9skjt5",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email,
                      properties: { customTrackData },
                    }),
                  }
                );
              }

              utilities.createCookie(
                "numFormSubmissons",
                numFormSubmissions,
                false,
                90
              );
            }
          }
        });
      }
    })();
  },
  // trackScrollDepth() {
  //   if (window.__scrollDepthTrackingInitialized) return;
  //   window.__scrollDepthTrackingInitialized = true;

  //   const scrollPercents = [25, 50, 75, 100];
  //   const triggered = new Set();
  //   const markers = {};

  //   function createOrUpdateMarkers() {
  //     const scrollHeight = document.documentElement.scrollHeight;

  //     scrollPercents.forEach((percent) => {
  //       let marker = markers[percent];

  //       if (!marker) {
  //         marker = document.createElement("div");
  //         marker.style.position = "absolute";
  //         marker.style.left = "0";
  //         marker.style.width = "1px";
  //         marker.style.height = "1px";
  //         marker.style.pointerEvents = "none";
  //         marker.style.opacity = "0";
  //         marker.dataset.percent = percent;
  //         marker.classList.add("scroll-depth-marker");
  //         document.body.appendChild(marker);
  //         markers[percent] = marker;
  //         observer.observe(marker);
  //       }
  //       const position = (percent / 100) * scrollHeight;
  //       // console.log(position, percent === 100, percent);

  //       marker.style.top = `${percent === 100 ? position - 150 : position}px`;
  //     });
  //   }

  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         if (entry.isIntersecting) {
  //           const percent = entry.target.dataset.percent;
  //           if (!triggered.has(percent)) {
  //             triggered.add(percent);
  //             amplitude?.track("Scroll Depth", {
  //               percent: Number(percent),
  //               "[Amplitude] Page Path": window.location.pathname,
  //               "[Amplitude] Page Domain": window.location.host,
  //             });
  //           }
  //         }
  //       });
  //     },
  //     {
  //       root: null,
  //       threshold: 0.01,
  //     }
  //   );

  //   // Initial marker placement
  //   createOrUpdateMarkers();

  //   // Recalculate on content resize
  //   let resizeTimeout;
  //   const resizeObserver = new ResizeObserver(() => {
  //     clearTimeout(resizeTimeout);
  //     resizeTimeout = setTimeout(() => {
  //       createOrUpdateMarkers();
  //     }, 500); // Wait 500ms after last resize
  //   });
  //   resizeObserver.observe(document.body);
  // },
  initCTATracking() {
    const links = [...document.querySelectorAll("a")];
    const page = window.location.pathname;
    const host = window.location.host;

    const paths = [
      "/demo",
      "/zara-demo",
      "/book-hiring-call",
      "/book-cor-demo",
      "/human-data-demo",
      "/thank-you-zara",
      "/thank-you",
      "/onboard-talent",
      "/search-talent",
      "/zara-register",
      "/human-data-register",
      "/pricing",
    ];

    const domainList = [
      "client.micro1.ai",
      "zara.micro1.ai",
      "dev.d1y3udqq47tapp.amplifyapp.com",
      "feat-zara-dashboard.d1y3udqq47tapp.amplifyapp.com",
    ];

    const selectedLinks = links.filter(
      (link) =>
        link.dataset.formCta ||
        paths.some((str) => link.href.includes(str)) ||
        domainList.some((str) => link.href.includes(str))
    );

    selectedLinks.forEach((link) => {
      link.addEventListener("click", () => {
        amplitude?.track("CTA Clicked", {
          "[Amplitude] Element Text": link.textContent || link.dataset.text,
          "[Amplitude] Page Path": page,
          "[Amplitude] Page Domain": host,
          "[Amplitude] Element Href": link.href,
          ...(link.dataset.widget && { widget: link.dataset.widget }),
        });
      });
    });
  },
};

const initCore = {
  trackVisibility() {
    const elements = document.querySelectorAll("[data-track-visibility]");

    if (!elements.length) return;

    const options = {};
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, options);

    elements.forEach((el) => observer.observe(el));
  },
  trackImgsLoad() {
    const images = document.querySelectorAll("[data-track-img-load]");

    images.forEach((img) => {
      const onLoad = () => {
        console.log("loaded");
        img.classList.add("loaded");
        img.parentElement.classList.add("loaded");
      };

      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener("load", onLoad);
      }
    });
  },
  textRotateAnimation() {
    const textWrap = document.querySelectorAll(".rotate-text_wrap");

    textWrap.forEach((wrap) => {
      const target = wrap.querySelector(".rotate-text_target");
      const elements = target.dataset.list.split(",");

      target.dataset.activeEl = 0;

      const showNext = () => {
        const activeEl = +target.dataset.activeEl;
        let nextEl;

        if (elements.length === +target.dataset.activeEl) {
          console.log("reached last");
          nextEl = 1;
        } else nextEl = activeEl + 1;

        const element = document.createElement("span");
        element.innerText = elements[nextEl - 1];
        element.style.opacity = 0;
        element.style.transition = "250ms opacity";

        target.innerHTML = "";

        target.insertAdjacentElement("beforeend", element);

        setTimeout(() => {
          element.style.opacity = 1;
        }, 50);

        target.dataset.activeEl = nextEl;
      };

      setInterval(() => {
        if (wrap.classList.contains("is-visible")) showNext();
      }, 2500);

      showNext();
    });
  },
  hideSignupCta() {
    try {
      const URLParams = new URLSearchParams(window.location.search);

      if (
        URLParams.get("utm_medium") !== "paid-social" &&
        !sessionStorage.getItem("utm_medium")
      )
        return;

      console.log("hide");

      sessionStorage.setItem("utm_medium", "paid-social");

      const buttons = [
        ...document.querySelectorAll(
          '[data-wf--button_register--variant="tertiary"] a, [data-wf--button_register--variant="sec"] a, [data-wf--button--variant="sec"] a, [data-wf--button--variant="tertiary"] a'
        ),
      ].filter(
        (link) =>
          link.href.includes("client.micro1.ai") ||
          link.href.includes("d1y3udqq47tapp.amplifyapp.com")
      );

      buttons.forEach((btn) => btn.remove());

      console.log("removed btns", buttons);
    } catch {
      console.log("Error in hiding sec CTA");
    }
  },
  hideOverflow() {
    document
      .querySelectorAll(".overflow-hide")
      .forEach((el) =>
        el.addEventListener("click", () =>
          document.querySelector("body").classList.toggle("no-scroll")
        )
      );
  },
  initCookie() {
    const consent = getCookieValue("consent");
    if (consent) return;

    const cookieHTML = `<div class="cookie_bar-wrapper" style="display: flex;opacity:0"><div class="cookie_bar-text">by using micro1.ai, you accept our <a href="/cookie-policy" class="hyperlink is-cookie">cookie policy</a></div><a href="#" class="button cookie_bar-btn w-button">Accept</a></div>`;

    document.body.insertAdjacentHTML("beforeend", cookieHTML);

    const cookieEl = document.querySelector(".cookie_bar-wrapper");
    const acceptBtn = cookieEl.querySelector(".cookie_bar-btn");

    acceptBtn.addEventListener("click", () => {
      cookieEl.style.opacity = 0;
      setTimeout(() => cookieEl.remove(), 300);

      utilities.createCookie("consent", "true", false, 180);
    });

    setTimeout(() => {
      cookieEl.style.opacity = 1;
    }, 100);
  },
  async initGsap() {
    await Promise.all([
      utilities.loadScript(
        "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"
      ),
      utilities.loadScript(
        "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js"
      ),
      utilities.loadScript(
        "https://cdn.jsdelivr.net/gh/timothydesign/script/split-type.js"
      ),
    ]);

    // console.log("GSAP + plugins loaded");

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.config({
      normalizeScroll: true,
    });

    Object.values(initGsap).forEach((fn) => fn());

    if (window.innerWidth > 991)
      Object.values(initGsapDesk).forEach((fn) => fn());
    else Object.values(initGsapMob).forEach((fn) => fn());
  },
  pageResize() {
    const debounce = (callback, wait) => {
      let timeoutId = null;
      return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          callback.apply(null, args);
        }, wait);
      };
    };

    const initialWidth = window.innerWidth;

    const desktop = initialWidth >= 992;
    const tablet = initialWidth < 992 && initialWidth > 767;
    const mobilePotrait = initialWidth <= 767 && initialWidth > 478;
    const mobile = initialWidth <= 478;

    const handleresize = debounce((ev) => {
      const curWidth = window.innerWidth;

      if (desktop && curWidth < 992) {
        location.reload();
      }
      if (tablet && (curWidth >= 992 || curWidth <= 767)) {
        location.reload();
      }
      if (mobilePotrait && (curWidth > 767 || curWidth <= 478)) {
        location.reload();
      }
      if (mobile && curWidth > 478) {
        location.reload();
      }
    }, 250);

    window.addEventListener("resize", handleresize);
  },
  initializePopovers() {
    const popovers = document.querySelectorAll("[data-popover]");

    popovers.forEach((popover) => {
      const content = popover.querySelector("[data-popover-content]");

      content.style.opacity = "0";
      content.style.visibility = "hidden";
      content.style.transition = "opacity 0.3s, visibility 0.3s";

      const showPopover = () => {
        content.style.opacity = "1";
        content.style.visibility = "visible";
      };

      const hidePopover = () => {
        content.style.opacity = "0";
        content.style.visibility = "hidden";
      };

      const isMobile = window.matchMedia("(max-width: 991px)").matches;

      if (isMobile) {
        let isOpen = false;

        popover.addEventListener("click", (e) => {
          e.preventDefault();
          if (isOpen) {
            hidePopover();
          } else {
            showPopover();
          }
          isOpen = !isOpen;
        });

        document.addEventListener("click", (e) => {
          if (!popover.contains(e.target)) {
            hidePopover();
            isOpen = false;
          }
        });
      } else {
        popover.addEventListener("mouseenter", showPopover);
        popover.addEventListener("mouseleave", hidePopover);
      }
    });
  },
  initFAQMore() {
    const button = document.querySelector(".faq_load-wrap .button");
    if (button) {
      button.addEventListener("click", () => {
        window.scrollTo({
          top: window.scrollY + 1,
          behavior: "smooth",
        });
      });
    }
  },
  fixBlogBorder() {
    const blogItems = document.querySelectorAll(
      ".blog_collection_list_wrapper.is-check-border .blog_item"
    );
    const blogCount = blogItems.length;

    if (
      window.matchMedia("(min-width: 992px)").matches &&
      blogCount % 2 === 0
    ) {
      const style = document.createElement("style");
      style.innerHTML = `
        @media screen and (min-width: 992px) {
          .blog_collection_list_wrapper.is-check-border .blog_item:nth-last-child(2) {
            border: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },
  autoplayVideos() {
    const containers = document.querySelectorAll(".wi_video-wrap");

    containers.forEach((container) => {
      const video = container.querySelector("video");
      const button = container.querySelector(".wi_video-button");
      const playIcon = button.querySelector(".is-play");
      const pauseIcon = button.querySelector(".is-pause");

      let hasUserInteracted = false;

      video.removeAttribute("controls");

      const tryPlay = () => {
        video
          .play()
          .then(() => {
            playIcon.style.opacity = 0;
            pauseIcon.style.opacity = 1;
            container.classList.remove("show-controls");
          })
          .catch(() => container.classList.add("show-controls"));
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              tryPlay();
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(video);

      // Play/pause logic
      button.addEventListener("click", () => {
        if (video.paused) {
          video.play();
          playIcon.style.opacity = 0;
          pauseIcon.style.opacity = 1;
          container.classList.remove("show-controls");
        } else {
          video.pause();
          playIcon.style.opacity = 1;
          pauseIcon.style.opacity = 0;
          container.classList.add("show-controls");
        }
      });

      // Mobile: show controls on tap
      video.addEventListener(
        "touchstart",
        () => {
          if (!hasUserInteracted) {
            hasUserInteracted = true;
            container.classList.add("show-controls");
            setTimeout(() => {
              container.classList.remove("show-controls");
              hasUserInteracted = false;
            }, 3000);
          }
        },
        { passive: true }
      );
    });
  },
};

const initForm = {
  formLogic() {
    const validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };
    const validatePhone = (phoneObj) => {
      if (phoneObj) {
        return phoneObj.isValidNumber();
      } else return true;
    };

    const validateNumber = (input) => {
      return (
        String(input)
          .toLowerCase()
          .match(/^[0-9-+s()]*$/) && String(input).length < 25
      );
    };

    document.querySelectorAll(".forms-steps-wrapper").forEach((form) => {
      form
        .querySelectorAll(".w-condition-invisible")
        .forEach((el) => el.remove());

      let currentStep = 0;
      const mainForm = form.closest("form");
      const allSteps = form.querySelectorAll(".form-step-wrap");
      const prevButton = mainForm.querySelector("[form-element='prev-btn']");
      const nextButtons = mainForm.querySelectorAll(
        "[form-element='next-btn']"
      );
      const progressBar = mainForm.querySelector(".progress-bar");
      const submitBtn = mainForm.querySelector("[form-element='submit-btn']");
      const realSubmitBtn = mainForm.querySelector(`input[type='submit']`);
      let redirectPath = mainForm.dataset.formRedirectPath;
      const formWrap = form.closest(".popup-form");
      const formType = formWrap.dataset.formBlock;
      const messageWrapEl = formWrap.querySelector(".form_message");
      const messageCloseEls = formWrap.querySelectorAll(
        "[form-element='message-close']"
      );

      if (messageWrapEl) {
        messageCloseEls.forEach((closeEl) =>
          closeEl.addEventListener("click", () => {
            messageWrapEl.style.opacity = 0;
            setTimeout(() => {
              messageWrapEl.style.display = "none";
            }, 200);
          })
        );

        const messageNextEl = formWrap.querySelector(".from_message-next");
        const messageSteps =
          messageWrapEl.querySelectorAll(".form_message-step");

        messageNextEl.addEventListener("click", () => {
          messageSteps[0].style.opacity = 0;
          messageSteps[0].style.transform = "translateY(-10px)";
          setTimeout(() => {
            messageSteps[0].style.display = "none";

            messageSteps[1].style.display = "block";
            messageSteps[1].style.transform = "translateY(10px)";
            requestAnimationFrame(() => {
              messageSteps[1].style.opacity = 1;
              messageSteps[1].style.transform = "translateY(0px)";
            });
          }, 200);
        });
      }

      // init progress bar
      progressBar.style.position = "relative";
      progressBar.style.overflow = "hidden";
      const progress = document.createElement("div");
      progress.style.position = "absolute";
      progress.style.width = 0;
      progress.style.height = "100%";
      progress.style.backgroundColor = "#009C20";
      progress.style.transition = "all 300ms";
      progressBar.appendChild(progress);

      const phoneInput = mainForm.querySelector("input[type='tel']");
      let phoneObj;

      if (phoneInput) phoneObj = initNumber(phoneInput);

      const initNumber = function (phoneInput) {
        const iti = window.intlTelInput(phoneInput, {
          initialCountry: "auto",
          geoIpLookup: (callback) => {
            fetch("https://ipapi.co/json")
              .then((res) => res.json())
              .then((data) => {
                callback(data.country_code);
              })
              .catch(() => callback("us"));
          },
          utilsScript:
            "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.4/build/js/utils.js",
        });

        return iti;
      };

      // pass form type
      utilities.updateInput(
        mainForm.querySelectorAll(".input_form-type"),
        formType
      );

      mainForm
        .querySelectorAll(
          `input[type="text"][required], input[type="number"][required], input[type="email"][required],  input[type="tel"][required], textarea[required], .other-field-wrap input[type="text"]`
        )
        .forEach((input) =>
          input.addEventListener("input", () => {
            input.style.borderColor = "";

            const inputs =
              input.parentElement.querySelectorAll(".primary-field");

            if (inputs.length > 1) {
              if (inputs[0].value && inputs[1].value) {
                const errorView = input
                  .closest(".form-step-wrap")
                  .querySelector(".error-view");
                if (errorView) errorView.style.display = "none";
              }
            } else {
              const errorView = input
                .closest(".form-step-wrap")
                .querySelector(".error-view");
              if (errorView) errorView.style.display = "none";
            }
          })
        );

      function verifyStepFields() {
        let result = false;

        const formStep = allSteps[currentStep].querySelector("div");
        if (!formStep) return false;

        const skip = formStep.dataset?.skip;

        const showError = formStep.querySelector(".error-view");

        const checkboxes = formStep.querySelectorAll(
          `[type="checkbox"], [type="radio"]`
        );
        if (checkboxes.length > 0) {
          checkboxes.forEach((cb) => {
            if (cb.checked) {
              result = true;
              if (
                cb.parentElement.querySelector("span[data-other-input]") &&
                cb
                  .closest(".step-input-wrapper")
                  .querySelector(".other-field-wrap input").value === "" &&
                !skip
              ) {
                showError.querySelector(".error-text").innerText =
                  "This field is required.";
                result = false;
                const extraInput = cb
                  .closest(".step-input-wrapper")
                  .querySelector(".other-field-wrap input");

                extraInput.focus();
                extraInput.style.borderColor = "#f86567";
              }
            }
          });
        }

        const allInputFields = formStep.querySelectorAll(
          `input[type="text"][required], input[type="number"][required], input[type="email"][required],  input[type="tel"][required], textarea[required], input[type="file"][required]`
        );
        console.log(allInputFields);
        if (allInputFields.length > 0) {
          for (let i = 0; i < allInputFields.length; i++) {
            if (allInputFields[i].value === "") {
              result = false;
              allInputFields[i].style.borderColor = "#f86567";
              allInputFields[i].focus();

              if (allInputFields[1] && allInputFields[1].value == "") {
                allInputFields[1].style.borderColor = "#f86567";
                if (allInputFields[i].value !== "") {
                  allInputFields[1].focus();
                }
              }

              break;
            } else if (allInputFields[i].type === "email") {
              if (!validateEmail(allInputFields[i].value)) {
                showError.querySelector(".error-text").innerText =
                  "Please enter a valid email address.";
                result = false;
              } else {
                showError.querySelector(".error-text").innerText =
                  "Please enter your email.";
                result = true;
              }
            } else if (allInputFields[i].type === "number") {
              if (!validateNumber(allInputFields[i].value)) {
                showError.querySelector(".error-text").innerText =
                  "Please enter a valid integer value.";
                result = false;
              } else {
                showError.querySelector(".error-text").innerText =
                  "Please enter the value in number";
                result = true;
              }
            } else if (allInputFields[i].type === "tel") {
              if (!validatePhone(phoneObj)) {
                showError.querySelector(".error-text").innerText =
                  "Please enter a valid phone number.";
                result = false;
              } else {
                showError.querySelector(".error-text").innerText =
                  "Please enter your phone number.";
                result = true;
              }
            } else if (allInputFields[i].dataset?.url) {
              const urlValue = allInputFields[i].value;
              try {
                const validURL = new URL(urlValue);
                if (validURL) result = true;
              } catch (error) {
                result = false;
                showError.querySelector(".error-text").innerText =
                  "Please enter a valid URL.";
              }
            } else result = true;
          }
        }

        const fileUploading = formStep.querySelector(
          ".w-file-upload-uploading"
        );

        if (
          fileUploading &&
          getComputedStyle(fileUploading)["display"] === "block"
        ) {
          result = false;
        }

        if (skip && skip === "true") result = true;

        if (checkboxes.length && allInputFields.length) {
          if (!checkboxes[0].checked || !allInputFields[0].value)
            result = false;
        }

        if (!result && showError) showError.style.display = "block";
        if (result && showError) showError.style.display = "none";

        return result;
      }

      function showStep(number, previous = false) {
        if (!previous) {
          const currStep = allSteps[number - 1];
          const nextStep = allSteps[number];

          currStep?.classList.remove("active");
          currStep?.classList.add("prev");

          nextStep?.classList.remove("next");
          nextStep?.classList.add("active");
        } else {
          const currStep = allSteps[number + 1];
          const prevStep = allSteps[number];

          currStep?.classList.remove("active");
          currStep?.classList.add("next");

          prevStep?.classList.remove("prev");
          prevStep?.classList.add("active");
        }

        if (number === 0) {
          progress.style.width = "10%";
          prevButton.classList.add("hide");
        } else {
          const progressValue = (
            ((number + 1) / allSteps.length) *
            100
          ).toFixed(0);
          progress.style.width = `${progressValue}%`;
          prevButton.classList.remove("hide");
        }
      }

      function moveToNextStep() {
        let onlyCheckboxes;
        const formStep = allSteps[currentStep].querySelector("div");
        const hasOtherOption = formStep.dataset?.hasOtherOption;

        onlyCheckboxes = formStep.querySelectorAll(`[type="checkbox"]`);
        let checkValues = "";
        if (onlyCheckboxes.length > 0) {
          onlyCheckboxes.forEach((cb) => {
            if (cb.checked) {
              let curValue = jQuery(cb).parent().find(".checkbox-label").text();
              if (checkValues) {
                checkValues = checkValues + ", " + curValue;
              } else {
                checkValues = curValue;
              }
            }
          });

          if (hasOtherOption) {
            const customValue = formStep.querySelector(
              ".other-field-wrap input"
            )?.value;

            if (customValue) {
              checkValues = checkValues
                ? checkValues + ", " + customValue
                : customValue;
            }
          }
        }

        jQuery(formStep).find(".hidden-input").attr("value", checkValues);

        const result = verifyStepFields();
        if (!result) {
          return;
        }

        if (currentStep + 1 <= allSteps.length - 1) currentStep++;
        showStep(currentStep);

        const emailInput = formStep.querySelector("[type='email']");

        if (
          messageWrapEl &&
          emailInput &&
          (emailInput.value.includes("gmail") ||
            emailInput.value.includes("yahoo") ||
            emailInput.value.includes("icloud"))
        ) {
          messageWrapEl.style.display = "flex";
          requestAnimationFrame(() => {
            messageWrapEl.style.opacity = 1;
          });
        }

        // amplitude
        const product = formType;
        const step = currentStep;
        const question = formStep.querySelector(".step-title")?.textContent;
        let answer;

        if (product === "general" && step === 1) {
          answer = formStep.querySelector(
            ".radio-wrapper.is-checked input"
          )?.value;
        }

        if (window.amplitude) {
          window.amplitude.track("Static - Moved step in form", {
            product,
            step,
            question,
            ...(answer && { answer }),
          });
        }
      }

      function handleKeydown(e) {
        if (e.isComposing || e.keyCode === 229) {
          return;
        }
        if (!(e.key === "Enter") && !(e.key === "Tab")) return;

        const compStyles = window.getComputedStyle(form.closest(".popup-form"));

        if (compStyles.getPropertyValue("display") == "none") {
          console.log("form not open");
          return;
        } else {
          console.log("form open");
        }

        if (e.target.classList.contains("text-area") && e.key === "Enter")
          return;

        if (e.key === "Tab") {
        }

        e.preventDefault();

        currentStep === allSteps.length - 1 ? submitForm() : moveToNextStep();
      }

      async function submitForm() {
        const result = verifyStepFields();

        if (!result) return;

        // amplitude
        const product = formType;
        const step = currentStep + 1;
        const question =
          allSteps[currentStep]?.querySelector(".step-title")?.textContent;

        if (window.amplitude) {
          window.amplitude.track("Static - Moved step in form", {
            product,
            step,
            question,
          });
        }

        console.log("ready to submit");

        submitBtn.textContent = "Please wait...";
        submitBtn.classList.add("disabled");

        mainForm
          .querySelectorAll(
            ".w-checkbox:not(.checkbox_legal), [data-has-other-option='checkbox'] .other-field-wrap input, .iti__selected-country, .iti__search-input"
          )
          .forEach((el) => el.remove());

        console.log("removed");

        if (phoneInput) {
          phoneInput.value = phoneObj.getNumber();
        }

        const allFormData = new FormData(mainForm);

        const ampFormObj = {};

        for (const pair of allFormData.entries()) {
          const field = pair[0];
          const answer = pair[1];

          if (
            answer &&
            !field.includes("first-name") &&
            !field.includes("last-name") &&
            !field.includes("email") &&
            !field.includes("form-type")
          ) {
            ampFormObj[field] = answer;
          }
        }

        const userContactInfo = {
          firstName: allFormData.get(`${formType}-first-name`),
          lastName: allFormData.get(`${formType}-last-name`),
          email: allFormData.get(`${formType}-email`),
        };

        console.log(userContactInfo);

        utilities.createCookie("userContactInfo", userContactInfo, true);

        utilities.createCookie("formSubmitted", "1", false, 7);

        // Twitter conversion code
        if (formType === "talent") {
          window.twq && twq("event", "tw-ocr68-ooizv", {});

          console.log("twitter code fired talent");
        }
        if (formType === "human-data") {
          window.twq && twq("event", "tw-ocr68-opq5o", {});

          console.log("twitter code fired human-data");
        }
        if (formType === "ai-interviewer") {
          window.twq && twq("event", "tw-ocr68-opq5p", {});

          console.log("twitter code fired ai recruiter");
        }
        if (formType === "general") {
          window.twq && twq("event", "tw-ocr68-opq1t", {});

          console.log("twitter code fired general");
        }

        // set custom params
        let numFormSubmissions = getCookieValue("numFormSubmissons");

        if (numFormSubmissions) {
          numFormSubmissions = +numFormSubmissions + 1;
        } else {
          numFormSubmissions = 1;
        }

        utilities.createCookie(
          "numFormSubmissons",
          numFormSubmissions,
          false,
          90
        );

        const companyData =
          (await utilities.getCompanySize(userContactInfo)) || {};

        // if general form
        const leadType = allFormData.get("general-requirement");
        if (leadType) {
          if (leadType === "Hire pre-vetted talent") {
            redirectPath = "/book-hiring-call";
          }

          if (leadType === "Interview your own candidates") {
            redirectPath = "/zara-demo";
            // prev logic below to send only ent to demo
            // const companyStage = getCompanyStage(
            //   customTrackData.company?.size || companyData?.size,
            //   customTrackData.company?.funding || companyData?.funding
            // );

            // if (
            //   companyStage === "ES" ||
            //   companyStage === "Growth" ||
            //   !companyStage
            // ) {
            //   redirectPath = "/zara-register";
            // } else {
            //   redirectPath = "/zara-demo";
            // }
          }
        }

        // if ai-interviewer form
        // prev logic below to send only ent to demo
        // if (formType === "ai-interviewer") {
        //   if (
        //     customTrackData.company?.size ||
        //     customTrackData.company?.funding ||
        //     companyData?.size ||
        //     companyData?.funding
        //   ) {
        //     const companyStage = getCompanyStage(
        //       customTrackData.company?.size || companyData?.size,
        //       customTrackData.company?.funding || companyData?.funding
        //     );

        //     if (companyStage === "Enterprises") {
        //       redirectPath = "/zara-demo";
        //     }
        //   }
        // }

        const amplitudeEventParams = utilities.toSnakeCaseObject({
          ...(companyData && companyData),
          ...(userContactInfo && userContactInfo),
          ...(ampFormObj && ampFormObj),
          redirectPath,
          product: formType,
        });

        console.log(amplitudeEventParams);

        await submitFormToMake(amplitudeEventParams);
      }

      function getCompanyStage(companySize, funding) {
        let companyStage;

        if (!companySize && !funding) return companyStage;

        // early stage, keep default
        if (
          (companySize === "Self-employed" ||
            companySize === "1 employee" ||
            companySize === "1-10 employees" ||
            companySize === "2-10 employees" ||
            companySize === "11-50 employees" ||
            companySize === "1-10" ||
            companySize === "11-50" ||
            !companySize) &&
          (!funding || funding <= 5000000)
        ) {
          console.log("early stage");
          companyStage = "ES";
          return companyStage;
        }

        // growth
        if (
          (companySize === "Self-employed" ||
            companySize === "1 employee" ||
            companySize === "1-10 employees" ||
            companySize === "2-10 employees" ||
            companySize === "11-50 employees" ||
            companySize === "1-10" ||
            companySize === "11-50" ||
            companySize === "51-200 employees" ||
            companySize === "201-500 employees" ||
            companySize === "51-200" ||
            companySize === "201-500" ||
            !companySize) &&
          (funding <= 30000000 || !funding)
        ) {
          console.log("growth");
          companyStage = "Growth";

          return companyStage;
        }

        // enterprise
        console.log("enterprise");
        companyStage = "Enterprises";

        return companyStage;
      }

      // submit to make.com
      async function submitFormToMake(amplitudeEventParams) {
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

          // send amplitude event
          if (window.amplitude) {
            window.amplitude.setUserId(amplitudeEventParams.email);

            window.amplitude.track(
              "Static - Form submitted",
              amplitudeEventParams
            );
          }

          // redirect
          console.log("form submitted successfully, redirecting!");
          document.location.href = `${redirectPath}`;
        } catch (error) {
          console.error(error);

          const errorHTML = `<p class="error-text" style="margin-top:1rem">${error.message}</p>`;

          allSteps[currentStep]
            .querySelector("div")
            .insertAdjacentHTML("beforeend", errorHTML);
        }
      }

      submitBtn.addEventListener("click", submitForm);
      nextButtons.forEach((btn) =>
        btn.addEventListener("click", moveToNextStep)
      );
      document.addEventListener("keydown", handleKeydown);
      prevButton.onclick = () => {
        if (currentStep - 1 >= 0) currentStep--;
        showStep(currentStep, true);
      };
      // init
      console.log(currentStep);
      showStep(currentStep);
    });
  },
  setCheckBoxRadio() {
    const allRadioInputs = document.querySelectorAll(
      ".popup-form [type='radio']"
    );

    const changeRadioInput = (input) => {
      if (input.checked) {
        input
          .closest(".step-input-wrapper")
          .querySelectorAll("[type='radio']")
          .forEach((input) => {
            input.parentElement.classList.remove("is-checked");
          });
        input.parentElement.classList.add("is-checked");
      }
    };

    allRadioInputs.forEach((input) =>
      input.addEventListener("change", () => {
        changeRadioInput(input);
      })
    );

    const allCheckboxInputs = document.querySelectorAll(
      ".popup-form [type='checkbox']:not([name='Accept-Conditions'])"
    );

    const changeCheckboxInput = (input) => {
      if (input.checked) {
        input.closest(".checkbox-wrapper").classList.add("is-checked");
      } else {
        input.closest(".checkbox-wrapper").classList.remove("is-checked");
      }
    };

    allCheckboxInputs.forEach((input) =>
      input.addEventListener("change", () => {
        changeCheckboxInput(input);
      })
    );

    const otherRadioInputs = document.querySelectorAll(
      "[data-has-other-option='radio'] [type='radio']"
    );

    otherRadioInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const otherTextInputWrapper = input
          .closest(".step-input-wrapper")
          .querySelector(".other-field-wrap");
        if (
          input.parentElement.querySelector("[data-other-input='true']") !==
          null
        ) {
          const otherInputText = input.parentElement.querySelector(
            "[data-other-input='true']"
          ).dataset.otherInputText;
          otherTextInputWrapper.querySelector("input").placeholder =
            otherInputText || "Please enter here";

          otherTextInputWrapper.classList.remove("hidden");

          otherTextInputWrapper.querySelector("input").value = "";
        } else {
          otherTextInputWrapper.classList.add("hidden");
        }
      });
    });

    const otherRadioActualInputs = document.querySelectorAll(
      "[data-has-other-option='radio'] .other-field-wrap input"
    );

    otherRadioActualInputs.forEach((input) =>
      input.addEventListener("input", (e) => {
        const otherRadio = input
          .closest(".step-input-wrapper")
          .querySelector(".radio-wrapper.is-checked input");

        otherRadio.value = e.target.value;
      })
    );

    const otherCheckboxLabels = document.querySelectorAll(
      "[data-has-other-option='checkbox'] [data-other-input='true']"
    );
    const otherCheckboxInputs = Array.from(otherCheckboxLabels).map((label) =>
      label.parentElement.querySelector("[type='checkbox']")
    );

    otherCheckboxInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const otherTextInputWrapper = input
          .closest(".step-input-wrapper")
          .querySelector(".other-field-wrap");
        otherTextInputWrapper.classList.toggle("hidden");
      });
    });

    const allCheckboxes = document.querySelectorAll(
      ".popup-form input[type='checkbox']:not([name='Accept-Conditions']), .popup-form input[type='radio']"
    );

    if (allCheckboxes.length > 0) {
      allCheckboxes.forEach((el) => {
        el.addEventListener("change", () => {
          const errorEl = el
            .closest(".step-input-wrapper")
            .querySelector(".error-view");
          if (errorEl && errorEl.style.display === "block")
            errorEl.style.display = "none";
        });
      });
    }
  },
  setFormTrigger() {
    (() => {
      const openTriggers = document.querySelectorAll("[data-form-cta]");

      openTriggers.forEach((trigger) => {
        const type = trigger.dataset.formCta;

        if (!type) return;

        trigger.addEventListener("click", () => {
          const form = document.querySelector(`[data-form-block='${type}']`);

          console.log(form, type);

          if (form) showForm(form);
          else console.error(`Form:${type} not found!`);
        });
      });

      function showForm(form) {
        document.querySelector("body").classList.add("no-scroll");
        form.style.display = "block";
        setTimeout(() => {
          form.classList.add("is-visible");
        }, 50);
      }

      const closeTriggers = document.querySelectorAll("[data-form-close]");

      closeTriggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const type = trigger.dataset.formClose;

          const form = document.querySelector(`[data-form-block='${type}']`);

          if (form) closeForm(form);
          else console.error(`Form:${type} not found!`);
        });
      });

      function closeForm(form) {
        document.querySelector("body").classList.remove("no-scroll");
        form.classList.remove("is-visible");
        setTimeout(() => {
          form.style.display = "none";
        }, 300);
      }
    })();
  },
};

// gsap being called in core
const initGsap = {
  loadWidget() {
    const reportWidgets = document.querySelectorAll("#report-widget");

    if (!reportWidgets.length) return;

    gsap.timeline({
      scrollTrigger: {
        once: true,
        start: "top+=10",
        end: "+=1",
        onEnter: () => {
          reportWidgets.forEach((reportWidget) => {
            const url = reportWidget.dataset.src;

            if (!url) {
              console.log("Widget URL missing");
              return;
            }

            reportWidget.src = url;

            console.log("added URL");
          });
        },
      },
    });
  },
  navScroll() {
    const nav = document.querySelector(".nav_component");

    if (!nav) return;

    gsap.timeline({
      scrollTrigger: {
        start: "top+=10",
        end: "+=1",
        onEnter: () => nav.classList.add("is-scrolled"),
        onLeaveBack: () => nav.classList.remove("is-scrolled"),
      },
    });
  },
  textScroll() {
    const textEl = document.querySelectorAll("[data-animation='split-text']");

    let mm = gsap.matchMedia();

    textEl.forEach((textEl) => {
      mm.add("(min-width: 992px)", () => {
        new SplitType(textEl, { types: ["words"] });

        const chars = textEl.querySelectorAll(".word");

        gsap
          .timeline({
            scrollTrigger: {
              trigger: textEl,
              start: "top bottom",
              end: "top 35%",
              scrub: 1,
              ease: "power1.inOut",
            },
          })
          .from(
            chars,
            {
              duration: 1,
              opacity: 0.2,
              stagger: 0.1,
            },
            "<"
          );
      });
    });
  },
  processScroll() {
    let mm = gsap.matchMedia();
    const component = document.querySelector(".section_process");

    if (!component) return;

    const wrapper = component.querySelector(".process_wrapper");
    const imgListWrap = component.querySelector(".process_img-list");
    const textList = [...component.querySelectorAll(".process_text")];
    const imgList = gsap.utils.toArray(".process_img-wrapper");

    let activeElement;

    mm.add("(min-width: 992px)", () => {
      textList[0].classList.add("is-active");

      const t1 = gsap.timeline({});

      t1.to(imgListWrap, {
        y: -imgListWrap.offsetHeight + imgList[0].offsetHeight,
        duration: 1,
        ease: "none",
      });

      ScrollTrigger.create({
        animation: t1,
        trigger: component,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const segments = textList.length;
          const progress = self.progress.toFixed(1);

          const segmentSize = 1 / segments;
          const currentSegment = Math.floor(progress / segmentSize);

          const segmentIndex = Math.min(currentSegment, segments - 1);

          if (activeElement === segmentIndex) return;

          updateActiveText(segmentIndex);

          activeElement = segmentIndex;
        },
      });
    });

    function updateActiveText(index) {
      textList.forEach((text) => text.classList.remove("is-active"));

      const textWrap = textList[index];

      textWrap.classList.add("is-active");
    }
  },
  processScrollv2() {
    let mm = gsap.matchMedia();
    const component = document.querySelector(".section_wi");

    if (!component) {
      return;
    }

    const wrapper = component.querySelector(".wi_wrapper");
    const imgListWrap = component.querySelector(".wi_img-list");
    const textList = [...component.querySelectorAll(".wi_text")];
    const imgList = gsap.utils.toArray(".wi_img-wrapper");

    let activeElement;

    mm.add("(min-width: 992px)", () => {
      textList[0].classList.add("is-active");

      const t1 = gsap.timeline({});

      t1.to(imgListWrap, {
        y: -imgListWrap.offsetHeight + imgList[0].offsetHeight,
        duration: 1,
        ease: "none",
      }).from(
        ".wi_line_fill, .wi_line_blur",
        {
          height: 0,
          duration: 1,
          ease: "none",
        },
        "<"
      );

      ScrollTrigger.create({
        animation: t1,
        trigger: component,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const segments = textList.length;
          const progress = self.progress.toFixed(1);

          const segmentSize = 1 / segments;
          const currentSegment = Math.floor(progress / segmentSize);

          const segmentIndex = Math.min(currentSegment, segments - 1);

          if (activeElement === segmentIndex) return;

          updateActiveText(segmentIndex);

          activeElement = segmentIndex;
        },
      });
    });

    function updateActiveText(index) {
      textList.forEach((text) => text.classList.remove("is-active"));

      const textWrap = textList[index];

      textWrap.classList.add("is-active");
    }
  },
  initAfterScroll() {
    gsap.timeline({
      scrollTrigger: {
        once: true,
        start: "top+=10",
        end: "+=1",
        onEnter: () => {
          Object.values(initAfterScroll).forEach((fn) => fn());
          document.body.classList.add("page-scrolled");
        },
      },
    });
  },
};
const initGsapMob = {
  handleBackButton() {
    const backButton = document.querySelectorAll(".nav_back-btn");

    const closeDropdown = (link) => {
      const dropdown = link.closest(".w--nav-dropdown-open");
      const toggle = dropdown.querySelector(".w--nav-dropdown-toggle-open");

      toggle.click();
    };

    backButton.forEach((btn) => {
      btn.addEventListener("click", () => {
        closeDropdown(btn);
      });
    });

    const breadCrumbBack = document.querySelectorAll(
      ".nav_dd_p_title-mob.is-back"
    );

    breadCrumbBack.forEach((link) => {
      link.addEventListener("click", () => {
        closeDropdown(link);
      });
    });
  },
  observeDropdowns() {
    const dropdownToggles = document.querySelectorAll(".w-dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "class"
          ) {
            const element = mutation.target;

            if (element.classList.contains("w--open")) {
              const parent = element.parentElement;
              if (parent) {
                parent.style.zIndex = 5;
              }
            } else {
              const parent = element.parentElement;
              if (parent) {
                parent.style.zIndex = "";
              }
            }
          }
        });
      });

      observer.observe(toggle, { attributes: true });
    });
  },
};
const initGsapDesk = {
  mapDotsFill() {
    const wrap = document.querySelectorAll(".bg-map_dots-wrap");

    if (!wrap.length) return;

    wrap.forEach((wrap) => {
      ScrollTrigger.create({
        trigger: wrap,
        top: "top bottom",
        onEnter: setDotsTimestamp,
        once: true,
      });

      function setDotsTimestamp() {
        const images = wrap.querySelectorAll(".bg-map_dots-img");

        const showNext = () => {
          const activeIndex = +wrap.dataset.activeIndex;
          let nextIndex;

          if (images.length - 1 === +wrap.dataset.activeIndex) {
            nextIndex = 1;
          } else nextIndex = activeIndex + 1;

          const activeEl = images[activeIndex];
          const nextEl = images[nextIndex];

          activeEl.style.opacity = 0;

          setTimeout(() => {
            nextEl.style.opacity = 0.8;
          }, 1000);

          wrap.dataset.activeIndex = nextIndex;
        };

        wrap.dataset.activeIndex = 0;
        setTimeout(() => {
          images[0].style.opacity = 0.8;

          setInterval(() => {
            if (wrap.classList.contains("is-visible")) showNext();
          }, 4000);
        }, 1000);
      }
    });
  },
  footerLogo() {
    const footerWrap = document.querySelector(".footer_logo-wrap");

    if (!footerWrap) return;

    footerWrap.addEventListener("mousemove", (e) => {
      const wrapRect = footerWrap.getBoundingClientRect();

      const x = e.clientX - wrapRect.left;
      const y = e.clientY - wrapRect.top;

      gsap.to(footerWrap, {
        "--pointer-x": `${x}px`,
        "--pointer-y": `${y}px`,
        duration: 0.6,
      });
    });
  },
  useCaseDropdown() {
    const wrappers = document.querySelectorAll(".nav_dd_list");

    wrappers.forEach((wrapper) => {
      const links = wrapper.querySelectorAll(".nav_dd_p-item");
      const lists = wrapper.querySelectorAll(".nav_dd_c-list");
      const listContainer = wrapper.querySelector(".nav_dd_c-col");

      if (!(window.innerWidth > 991) || !links.length) return;

      links.forEach((link, i) =>
        link.addEventListener("mouseenter", () => {
          utilities.removeClassFromEls(links, "is-selected");
          link.classList.add("is-selected");
          listContainer.innerHTML = "";
          listContainer.insertAdjacentElement("afterbegin", lists[i]);
        })
      );

      links[0].classList.add("is-selected");
      listContainer.insertAdjacentElement("afterbegin", lists[0]);
    });
  },
};

// initiliazing in gsap
const initAfterScroll = {
  async initSlider() {
    const sliderWrapperEls = Array.from(
      document.querySelectorAll(".swiper-component")
    );

    console.log(sliderWrapperEls);

    if (!sliderWrapperEls.length) return;

    await utilities.loadScript(
      "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
    );

    sliders = setSlider(sliderWrapperEls);

    function setSlider(sliderWrapperEls) {
      const sliders = [];

      sliderWrapperEls.forEach((wrapperEl) => {
        if (wrapperEl.dataset.mobileOnly && window.innerWidth > 991) return;

        const swiper = wrapperEl.querySelector(".swiper");

        const slidesPerView = wrapperEl.dataset.slidesPerView
          ? wrapperEl.dataset.slidesPerView != "auto"
            ? +wrapperEl.dataset.slidesPerView
            : "auto"
          : 1;

        const desktopAutoHeight = wrapperEl.dataset.desktopAutoHeight;

        const spaceBetween = wrapperEl.dataset.spaceBetween
          ? +wrapperEl.dataset.spaceBetween
          : 24;

        const fadeEffect = wrapperEl.dataset.effectFade ? true : false;

        const loop = wrapperEl.dataset.disableLoop ? false : true;

        const arrows = wrapperEl.querySelectorAll(".swiper-arrow");

        const enableClicks = wrapperEl.dataset.preventClicks ? true : false;
        const enableClicksPropagation = wrapperEl.dataset
          .preventClicksPropagation
          ? true
          : false;

        const slider = new Swiper(swiper, {
          ...(enableClicks && { preventClicks: false }),
          ...(enableClicksPropagation && { preventClicksPropagation: false }),
          updateOnWindowResize: true,
          loop: loop,
          loopAdditionalSlides: 1,
          slidesPerView: slidesPerView,
          spaceBetween: spaceBetween,
          speed: 600,
          pagination: {
            el: wrapperEl.querySelector(".swiper-pagination"),
            clickable: true,
            dynamicBullets: true,
          },
          ...(arrows && {
            navigation: {
              prevEl: arrows[0],
              nextEl: arrows[1],
            },
          }),
          breakpoints: {
            0: {
              autoHeight: true,
              slidesPerView: slidesPerView === "auto" ? "auto" : 1,
            },
            992: {
              autoHeight: true,
              slidesPerView: slidesPerView,
            },
          },
          ...(fadeEffect && {
            effect: "fade",
            fadeEffect: {
              crossFade: true,
            },
          }),
        });

        sliders.push(slider);

        sliders.forEach((slider) => {
          slider.on("slideChange", function () {
            if (window.gsap !== undefined) ScrollTrigger.refresh();
          });
        });
      });

      return sliders;
    }

    console.log(sliders);
  },
  async initDemoWidget() {
    const widgets = document.querySelectorAll("#interview-widget");

    widgets.forEach((widget) => {
      const url = widget.dataset.src;

      if (!url) {
        console.log("Widget URL missing");
        return;
      }

      let params = customTrackData.portalParams || "";

      if (!params.includes("hutk")) {
        const hutk = customTrackData.hutk;

        if (hutk) {
          if (params && params.length > 0) {
            params += `&hutk=${hutk}`;
          } else {
            params = `hutk=${hutk}`;
          }
        }
      }

      widget.src = `${url}?${params}`;

      console.log("added URL");
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("dom-loaded");

  Object.values(initTracking).forEach((fn) => fn());
  Object.values(initCore).forEach((fn) => fn());
  Object.values(initForm).forEach((fn) => fn());

  setTimeout(() => document.body.classList.add("delay-complete"), 3000);
});

window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
});
