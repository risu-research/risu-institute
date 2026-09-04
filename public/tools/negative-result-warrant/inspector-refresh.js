const quickstart = document.querySelector("#recorded-quickstart");
const recordedMode = document.querySelector("#recorded-mode");
const loadOrdinary = document.querySelector("#load-q");
const workspace = document.querySelector("#workspace");

quickstart?.addEventListener("click", () => {
  recordedMode?.click();
  loadOrdinary?.click();
  workspace?.scrollIntoView({ behavior: "smooth", block: "start" });
});
