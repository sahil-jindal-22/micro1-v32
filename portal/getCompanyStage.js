async function getCompanyStage(email) {
  try {
    const info = await getCompanyInfo(email);

    if (!info || (!info.size && !info.funding)) return "Early Stage";

    return calcCompanyStage(info.size, info.funding);
  } catch (e) {
    return "Early Stage";
  }
}

async function getCompanyInfo(email) {
  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status} from ${url}`);
    }
    // Check content type before parsing
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    } else {
      // If not JSON, return null
      return null;
    }
  }

  try {
    const domain = email.split("@")[1];

    // no need to check for free domains
    if (isFreeEmail(domain)) {
      console.log("free");
      return null;
    }

    const personApiUrl = `https://hook.us1.make.com/lxholkn672i1jsfsgrs82geyxn641a0u?email=${encodeURIComponent(
      email
    )}`;
    const domainApiUrl = `https://hook.us1.make.com/ax4r7raw56xdx5aemjmsoxuwgbfxhu6y?domain=${encodeURIComponent(
      domain
    )}`;

    // Start both requests in parallel
    const personRequest = fetchJson(personApiUrl);
    const domainRequest = fetchJson(domainApiUrl);

    let data;

    try {
      // Try person API first
      data = await personRequest;
      if (!data || data?.message === "no-company-found") {
        // If person API returns null or no-company-found, try domain API
        data = await domainRequest;
      }
    } catch (error) {
      // If person API fails, try domain API
      data = await domainRequest;
    }

    // If both APIs returned null or failed
    if (!data || data?.message === "no-company-found") {
      throw new Error("No company data found from either API");
    }

    return data;
  } catch (error) {
    return null;
  }
}

function calcCompanyStage(size, funding) {
  // early stage: size <= 50 && funding < 5M
  if (
    (size === "Self-employed" ||
      size === "1 employee" ||
      size === "1-10 employees" ||
      size === "2-10 employees" ||
      size === "11-50 employees" ||
      size === "1-10" ||
      size === "11-50" ||
      !size) &&
    (!funding || funding <= 5000000)
  ) {
    return "Early Stage";
  }

  // growth: size < 500 && funding < 30M
  if (
    (size === "Self-employed" ||
      size === "1 employee" ||
      size === "1-10 employees" ||
      size === "2-10 employees" ||
      size === "11-50 employees" ||
      size === "1-10" ||
      size === "11-50" ||
      size === "51-200 employees" ||
      size === "201-500 employees" ||
      size === "51-200" ||
      size === "201-500" ||
      !size) &&
    (funding <= 30000000 || !funding)
  ) {
    return "Growth";
  }

  // if not ES or Growth, it is enterprise
  return "Enterprise";
}

function isFreeEmail(domain) {
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

  return freeDomains.includes(domain);
}
