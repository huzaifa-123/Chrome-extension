// When the DOM is fully loaded, set up the initial state and event listeners.
document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("toggleButton");
  button.addEventListener("click", toggleTracking);

  // Initialize the tracking state from chrome.storage.sync.
  chrome.storage.sync.get({ isTracking: false }, function (response) {
    updateTrackingState(response.isTracking);
  });
});

// Updates the button text based on the tracking state.
function updateTrackingState(isTracking) {
  const button = document.getElementById("toggleButton");
  button.innerText = isTracking ? "Stop Tracking" : "Start Tracking";
}

// Downloads the tracked data as a CSV file directly to the default download folder.
async function downloadCSV() {
  const { data } = await chrome.storage.sync.get({ data: [] });
  const csvContent =
    "Website Name, Start Time, End Time\n" +
    data
      .map((d) => `${d.websiteName}, ${d.startTime}, ${d.endTime}`)
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  await chrome.downloads.download({
    url: url,
    filename: "visited_urls.csv",
    conflictAction: "overwrite",
    saveAs: false, // Download directly without prompting for location.
  });

  // Clear the stored data after downloading.
  // await chrome.storage.sync.set({ data: [] });
}

// Toggles the tracking state and updates UI and stored state accordingly.
async function toggleTracking() {
  chrome.storage.sync.get({ isTracking: false }, async function (response) {
    const newIsTracking = !response.isTracking;
    await chrome.storage.sync.set({ isTracking: newIsTracking });

    // Notify the background service worker of the new tracking state.
    chrome.runtime.sendMessage({ isTracking: newIsTracking });

    // If tracking was just stopped, download the data as a CSV.
    if (!newIsTracking) {
      await downloadCSV();
    }

    // Update the button text based on the new tracking state.
    updateTrackingState(newIsTracking);
  });
}
