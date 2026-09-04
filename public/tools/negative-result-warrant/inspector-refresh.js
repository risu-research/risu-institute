const quickstart = document.querySelector("#recorded-quickstart");
const recordedMode = document.querySelector("#recorded-mode");
const workspace = document.querySelector("#workspace");

quickstart?.addEventListener("click", () => {
  recordedMode?.click();
  workspace?.scrollIntoView({ behavior: "smooth", block: "start" });
});
