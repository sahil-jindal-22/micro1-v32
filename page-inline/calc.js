const { useState, useRef, useEffect } = React;

// Constants for calculations
const CONSTANTS = {
  RECRUITER_PER_HOUR: 25,
  TRADITIONAL: {
    RESUME_SCREENING_PER_APP: 4,
    SCREENING_PASS_RATE: 0.2,
    SCHEDULING_PER_APP: 5,
    REPORT_PER_APP: 10,
    INTERVIEW_PASS_RATE: 0.1,
  },
  AI: {
    INTERVIEW_TAKE_RATE: 0.2,
    INTERVIEW_PASS_RATE: 0.2,
    REVIEW_PER_REPORT: 2,
    INTERVIEW_COST_PER_APP: 3,
  },
};

// Utility functions
const formatters = {
  candidates: (candidates) =>
    candidates.toLocaleString("en-US", { maximumFractionDigits: 0 }),

  minsToHrs: (mins) => {
    const hrs = mins / 60;
    const formattedNumber = Number.isInteger(hrs)
      ? hrs.toLocaleString("en-US")
      : parseFloat(hrs.toFixed(2)).toLocaleString("en-US");

    return `${formattedNumber} ${hrs <= 1 ? "hr" : "hrs"}`;
  },

  amount: (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount),
};

// Calculator functions
const calculateTraditional = (totalApplications, inputTime) => {
  const C = CONSTANTS.TRADITIONAL;

  const screenedCandidates = totalApplications * C.SCREENING_PASS_RATE;
  const passedCandidates = screenedCandidates * C.INTERVIEW_PASS_RATE;

  const times = {
    resumeScreening: totalApplications * C.RESUME_SCREENING_PER_APP,
    scheduling: screenedCandidates * C.SCHEDULING_PER_APP,
    interview: screenedCandidates * inputTime,
    reporting: passedCandidates * C.REPORT_PER_APP,
  };

  const totalTime = Object.values(times).reduce((sum, time) => sum + time, 0);
  const totalCost = (totalTime / 60) * CONSTANTS.RECRUITER_PER_HOUR;

  return {
    times,
    candidates: { screened: screenedCandidates, passed: passedCandidates },
    totalTime,
    totalCost,
  };
};

const calculateAI = (totalApplications) => {
  const C = CONSTANTS.AI;

  const interviewedCandidates = totalApplications * C.INTERVIEW_TAKE_RATE;
  const passedCandidates = interviewedCandidates * C.INTERVIEW_PASS_RATE;
  const reviewTime = passedCandidates * C.REVIEW_PER_REPORT;

  const totalTime = reviewTime;
  const totalCost =
    (totalTime / 60) * CONSTANTS.RECRUITER_PER_HOUR +
    C.INTERVIEW_COST_PER_APP * interviewedCandidates;

  return {
    reviewTime,
    candidates: {
      interviewed: interviewedCandidates,
      passed: passedCandidates,
    },
    totalTime,
    totalCost,
  };
};

function App() {
  const [inputApp, setInputApp] = useState(1000);
  const [inputTime, setInputTime] = useState(30);
  const [calcAnnually, setCalcAnnually] = useState(true);
  let inputAppNotValid,
    inputTimeNotValid,
    hideCalculations = false;

  if (inputApp < 50 || inputApp > 50000) inputAppNotValid = true;
  if (inputTime < 5 || inputTime > 120) inputTimeNotValid = true;
  if (inputAppNotValid || inputTimeNotValid) hideCalculations = true;

  const totalApplications = calcAnnually ? inputApp * 12 : inputApp;

  const traditional = calculateTraditional(totalApplications, inputTime);
  const ai = calculateAI(totalApplications);

  const savings = {
    time: traditional.totalTime - ai.totalTime,
    cost: traditional.totalCost - ai.totalCost,
    percentage: (
      ((traditional.totalCost - ai.totalCost) / traditional.totalCost) *
      100
    ).toFixed(1),
  };

  return (
    <>
      <Form
        inputApp={inputApp}
        inputTime={inputTime}
        setInputApp={setInputApp}
        setInputTime={setInputTime}
        inputAppNotValid={inputAppNotValid}
        inputTimeNotValid={inputTimeNotValid}
      />
      <Savings
        costSaved={formatters.amount(savings.cost)}
        costSavedPerc={savings.percentage}
        setCalcAnnually={setCalcAnnually}
        calcAnnually={calcAnnually}
        hideCalculations={hideCalculations}
      />
      <Detail
        traditional={traditional}
        ai={ai}
        savings={savings}
        inputTime={inputTime}
        hideCalculations={hideCalculations}
      />
    </>
  );
}

function Form({
  inputApp,
  inputTime,
  setInputApp,
  setInputTime,
  inputAppNotValid,
  inputTimeNotValid,
}) {
  return (
    <div class="c_input-col">
      <h2 class="heading-style-h4 text-weight-medium">Savings Calculator</h2>
      <p class="text-size-small margin-top margin-tiny">
        Find out how much you can save using the micro1 AI Recruiter.
      </p>
      <div class="c_form w-form">
        <div class="c_form-title">Adjust hiring needs</div>
        <form className="c_form-wrap">
          <div>
            <div class="c_form-label-wrap">
              <label class="c_form-label" for="applicants">
                Total inbound applicants each month
              </label>

              <div class="c_form-input-wrapper">
                <input
                  class={`c_form-input w-input ${
                    inputAppNotValid && "is-error"
                  }`}
                  maxlength="256"
                  placeholder="e.g. 1000"
                  type="number"
                  name="applicants"
                  value={inputApp}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputApp(value === "" ? "" : Number(value).toString());
                  }}
                />
                <div class="c_form_input-text">/month</div>
              </div>

              {inputAppNotValid && (
                <div class="c_form-error">
                  {inputApp == 0
                    ? "Please enter the number of applicants"
                    : "Please enter a value between 50 to 50,000"}
                </div>
              )}
            </div>
          </div>
          <div>
            <div class="c_form-label-wrap">
              <label class="c_form-label" for="time">
                Time spent interviewing each <strong>relevant</strong> candidate
              </label>

              <div class="c_form-input-wrapper">
                <input
                  class={`c_form-input w-input ${
                    inputTimeNotValid && "is-error"
                  }`}
                  maxlength="256"
                  placeholder="e.g. 1000"
                  type="number"
                  name="time"
                  value={inputTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputTime(value === "" ? "" : Number(value).toString());
                  }}
                />
                <div class="c_form_input-text">minutes</div>
              </div>

              {inputTimeNotValid && (
                <div class="c_form-error">
                  {inputTime == 0
                    ? "Please enter the time spent per interview"
                    : "Please enter a value between 5 to 120"}
                </div>
              )}
            </div>
          </div>
        </form>
        <div
          class="w-form-done"
          tabindex="-1"
          role="region"
          aria-label="Email Form success"
        >
          <div>Thank you! Your submission has been received!</div>
        </div>
        <div
          class="w-form-fail"
          tabindex="-1"
          role="region"
          aria-label="Email Form failure"
        >
          <div>Oops! Something went wrong while submitting the form.</div>
        </div>
      </div>
    </div>
  );
}

function Savings({
  costSaved,
  costSavedPerc,
  calcAnnually,
  setCalcAnnually,
  hideCalculations,
}) {
  return (
    <div class="c_savings-col">
      <div class="c_savings-tab">
        <div
          class={`c_savings-tab-title ${calcAnnually ? "is-active" : ""}`}
          onClick={() => setCalcAnnually(true)}
        >
          Annually
        </div>
        <div
          class={`c_savings-tab-title ${!calcAnnually ? "is-active" : ""}`}
          onClick={() => setCalcAnnually(false)}
        >
          Monthly
        </div>
      </div>
      <div class="c_savings-title">Estimated Savings</div>
      <div class="c_savings-total">
        {hideCalculations ? "-" : `$${costSaved}`}
        {!hideCalculations && (
          <span class="c_savings-percent">({costSavedPerc}%)</span>
        )}
      </div>
      <div class="c_savings-note">
        Note: Based on AI interviews replacing recruiter-led interviews,
        considering the average salary of a recruiter
      </div>
      <div class="c_arrow">
        <div class="c_arrow-wrap">
          <div class="c_arrow-icon w-embed">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.39648 15.5933H25.4304"
                stroke="white"
                stroke-width="2.06102"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M16.4121 6.57666L25.4291 15.5936L16.4121 24.6106"
                stroke="white"
                stroke-width="2.06102"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ traditional, ai, savings, inputTime, hideCalculations }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <div className="c_details-wrapper">
      <div
        className="c_details-top"
        onClick={() => setDropdownOpen((open) => !open)}
      >
        <div className="c_details-title">View detailed calculation</div>
        <img
          src="https://cdn.prod.website-files.com/68b095121300aebde21ab3f4/68dd2b483acc2b253912e7cf_Chevrons.svg"
          loading="lazy"
          alt=""
          className="c_details-icon"
        />
      </div>
      {dropdownOpen && (
        <div className="c_logic-wrap">
          <div className="c_cost-row">
            {/* Traditional Cost Column */}
            <div className="c_cost-col">
              <div className="c_cost-title">Traditional interview cost</div>
              <div className="c_cost-group">
                <div className="c_cost-list">
                  <div className="c_cost-item">
                    <div className="c_cost-text">
                      <div className="z_cost-label">Resume screening</div>
                      <Popover>4 minutes per application</Popover>
                    </div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(
                            traditional.times.resumeScreening
                          )}
                    </div>
                  </div>
                  <div className="c_cost-pipeline">
                    <div>
                      Screening pass rate: &nbsp;20% (
                      {hideCalculations
                        ? "-"
                        : formatters.candidates(
                            traditional.candidates.screened
                          )}{" "}
                      candidates)
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="c_cost-text">
                      <div className="z_cost-label">
                        Follow up and scheduling
                      </div>

                      <Popover>5 minutes per candidate</Popover>
                    </div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(traditional.times.scheduling)}
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="c_cost-text">
                      <div className="z_cost-label">Interview conducted</div>
                      <Popover>
                        {hideCalculations ? "-" : inputTime} minutes per
                        candidate
                      </Popover>
                    </div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(traditional.times.interview)}
                    </div>
                  </div>
                  <div className="c_cost-pipeline">
                    <div>
                      Interview pass rate: &nbsp;10% (
                      {hideCalculations
                        ? "-"
                        : formatters.candidates(
                            traditional.candidates.passed
                          )}{" "}
                      candidates)
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="c_cost-text">
                      <div className="z_cost-label">
                        Create candidate report
                      </div>

                      <Popover>10 minutes per candidate</Popover>
                    </div>

                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(traditional.times.reporting)}
                    </div>
                  </div>
                  <div className="c_cost-divider"></div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Total hours spent</div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(traditional.totalTime)}
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Avg. recruitment cost</div>
                    <div>${CONSTANTS.RECRUITER_PER_HOUR}/hr</div>
                  </div>
                </div>
                <div className="c_cost-list">
                  <div className="c_cost-divider"></div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Total cost</div>
                    <div className="c_cost-total">
                      {hideCalculations
                        ? "-"
                        : `$${formatters.amount(traditional.totalCost)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* AI Cost Column */}
            <div className="c_cost-col">
              <div className="c_cost-title">Zara cost</div>
              <div className="c_cost-group">
                <div className="c_cost-list">
                  <div className="z_cost-label">
                    <div>Resume screening</div>
                    <div>0 hr</div>
                  </div>
                  <div className="c_cost-pipeline">
                    <div>
                      Interview take rate: &nbsp;20% (
                      {hideCalculations
                        ? "-"
                        : formatters.candidates(ai.candidates.interviewed)}{" "}
                      candidates)
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Follow up and scheduling</div>
                    <div>0 hr</div>
                  </div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Interview conducted</div>
                    <div>0 hr</div>
                  </div>
                  <div className="c_cost-pipeline">
                    <div>
                      AI Interview pass rate: &nbsp;20% (
                      {hideCalculations
                        ? "-"
                        : formatters.candidates(ai.candidates.passed)}{" "}
                      candidates)
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="c_cost-text">
                      <div className="z_cost-label">Reviewing AI reports
                        <div/>
                      <Popover>2 minutes per candidate</Popover>
                    </div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(ai.reviewTime)}
                    </div>
                  </div>
                  <div className="c_cost-divider"></div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Total hours spent</div>
                    <div>
                      {hideCalculations
                        ? "-"
                        : formatters.minsToHrs(ai.totalTime)}
                    </div>
                  </div>
                  <div className="c_cost-item">
                    <div className="z_cost-label">Avg. recruitment cost</div>
                    <div>${CONSTANTS.RECRUITER_PER_HOUR}/hr</div>
                  </div>
                  <div className="c_cost-item">
                    <div className="z_cost-label"S>Avg cost per interview</div>
                    <div>${CONSTANTS.AI.INTERVIEW_COST_PER_APP}/interview</div>
                  </div>
                </div>
                <div className="c_cost-list">
                  <div className="c_cost-divider"></div>
                  <div className="c_cost-item">
                    <div>Total cost</div>
                    <div className="c_cost-total text-color-green">
                      {hideCalculations
                        ? "-"
                        : `$${formatters.amount(ai.totalCost)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Column */}
          <div className="c_cost-col-sav">
            <div className="c_cost-wrap">
              <div>Time saved</div>
              <div className="c_cost-save">
                {hideCalculations ? "-" : formatters.minsToHrs(savings.time)}
              </div>
            </div>
            <div className="c_cost-wrap">
              <div>Cost saved</div>
              <div className="c_cost-save">
                {hideCalculations
                  ? "-"
                  : `$${formatters.amount(savings.cost)} `}
                {!hideCalculations && (
                  <span className="c_cost-save-perc">
                    ({savings.percentage}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Popover({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const isMobile = window.innerWidth <= 991;

  // Handle click outside for mobile (<991px)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isMobile &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen && isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile]);

  const handleInteraction = {
    // Only handle click on mobile
    onClick: () => {
      if (isMobile) {
        setIsOpen(!isOpen);
      }
    },
    // Only handle hover on desktop
    onMouseEnter: () => {
      if (!isMobile) {
        setIsOpen(true);
      }
    },
    onMouseLeave: () => {
      if (!isMobile) {
        setIsOpen(false);
      }
    },
  };

  return (
    <div
      ref={popoverRef}
      data-popover=""
      className="c_popover"
      {...handleInteraction}
    >
      <div
        data-popover-content=""
        className="c_popover-content"
        style={{
          visibility: isOpen ? "visible" : "hidden",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div>{children}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
