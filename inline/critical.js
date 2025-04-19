// initiate custom tracking object
const customTrackData = {
  utm: {},
  user: {},
  company: {},
};

const getCookieValue = (name) =>
  document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() || "";

// Get user info from cookie
(() => {
  const userContactInfoCookie = getCookieValue("userContactInfo");

  if (!userContactInfoCookie) return;

  const userContactInfo = JSON.parse(decodeURIComponent(userContactInfoCookie));

  customTrackData.user = {
    first_name: userContactInfo.firstName,
    last_name: userContactInfo.lastName,
    email: userContactInfo.email,
  };
})();

// Get company info from cookie
(() => {
  const companyInfoCookie = getCookieValue("companyInfo");

  if (!companyInfoCookie) return;

  customTrackData.company = JSON.parse(decodeURIComponent(companyInfoCookie));
})();

function preFillUserData() {
  const meetingEl = document.querySelector(".meetings-iframe-container");
  if (!meetingEl) return;

  // update link for small companies
  if (customTrackData.company.size || customTrackData.company.funding) {
    const esMeetingLink = getESLink(
      customTrackData.company.size,
      customTrackData.company.funding
    );

    console.log(esMeetingLink);

    if (esMeetingLink) {
      meetingEl.dataset.src = `${esMeetingLink}?embed=true`;
    }
  }

  // pre-fill user data
  const user = customTrackData.user;
  if (!user.first_name || !user.last_name || !user.email) return;

  const userFormatted = {
    ...(user.first_name && { firstName: user.first_name }),
    ...(user.last_name && { lastName: user.last_name }),
    ...(user.email && { email: user.email }),
  };

  const paramsStr = new URLSearchParams(userFormatted).toString();

  meetingEl.dataset.src += `&${paramsStr}`;
}

function getESLink(companySize, funding) {
  const currentPath = window.location.pathname;
  let esMeetingLink;

  if (
    !(
      currentPath !== "/demo" ||
      currentPath !== "/book-hiring-call" ||
      currentPath !== "/human-data-demo"
    )
  )
    return;

  // early stage - keep default es links
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
    return esMeetingLink;
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
      companySize === "501-1,000 employees" ||
      companySize === "501-1000" ||
      !companySize) &&
    (funding <= 50000000 || !funding)
  ) {
    console.log("growth");
    switch (currentPath) {
      case "/demo":
        esMeetingLink = "https://meetings.hubspot.com/micro1/micro1-demo";
        break;
      case "/zara-demo":
        esMeetingLink =
          "https://meetings.hubspot.com/micro1/ai-interviewer-demo";
        break;
      case "/book-hiring-call":
        esMeetingLink = "https://meetings.hubspot.com/micro1/hiring-call";
        break;
      case "/human-data-demo":
        esMeetingLink = "https://meetings.hubspot.com/micro1/micro1-rlhf-call-";
        break;
    }

    return esMeetingLink;
  }

  // ent
  switch (currentPath) {
    case "/demo":
      esMeetingLink =
        "https://meetings.hubspot.com/micro1/micro1-demo-enterprise";
      break;
    case "/zara-demo":
      esMeetingLink =
        "https://meetings.hubspot.com/micro1/zara-demo-enterprise";
      break;
    case "/book-hiring-call":
      esMeetingLink =
        "https://meetings.hubspot.com/micro1/talent-demo-enterprise";
      break;
    case "/human-data-demo":
      esMeetingLink =
        "https://meetings.hubspot.com/micro1/human-data-demo-enterprise";
      break;
  }

  return esMeetingLink;
}
