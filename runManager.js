let runHistory = JSON.parse(localStorage.getItem("runHistory") || "[]");
let currentRun = null;

function startNewRun(settings) {
  currentRun = {
    id: Date.now(),
    settings,
    actions: [],
    success: null,
  };
}

function endCurrentRun(success) {
  if
