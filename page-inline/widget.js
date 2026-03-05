const btns = document.querySelectorAll(".i_report_btn");

btns.forEach((el, i) => {
  el.addEventListener("click", () => {
    btns.forEach((btn) => btn.classList.remove("is-selected"));

    el.classList.add("is-selected");

    document
      .querySelector("#widget")
      .contentWindow.postMessage({ type: "CHANGE_REPORT", report: i }, "*");
  });
});
