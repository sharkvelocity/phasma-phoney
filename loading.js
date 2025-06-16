// loading.js
export function showLoading(message = "Loading...") {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.style.position = "fixed";
  loadingOverlay.style.top = 0;
  loadingOverlay.style.left = 0;
  loadingOverlay.style.width = "100%";
  loadingOverlay.style.height = "100%";
  loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  loadingOverlay.style.display = "flex";
  loadingOverlay.style.justifyContent = "center";
  loadingOverlay.style.alignItems = "center";
  loadingOverlay.style.zIndex = 10000;

  const messageBox = document.createElement("div");
  messageBox.style.color = "#fff";
  messageBox.style.fontSize = "1.5rem";
  messageBox.style.fontFamily = "serif";
  messageBox.textContent = message;

  loadingOverlay.appendChild(messageBox);
  document.body.appendChild(loadingOverlay);
}

export function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    document.body.removeChild(loadingOverlay);
  }
}
