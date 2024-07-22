chrome.runtime.onStartup.addListener(async () => {
  const isTracking = await chrome.storage.sync.get({ isTracking: false });
  if (isTracking) {
    chrome.tabs.onActivated.addListener(handleTracking);
    chrome.webNavigation.onHistoryStateUpdated.addListener(handleTracking);
  }
});

chrome.runtime.onMessage.addListener((request) => {
  const isTracking = request.isTracking;
  if (isTracking) {
    chrome.tabs.onActivated.addListener(handleTracking);
    chrome.webNavigation.onHistoryStateUpdated.addListener(handleTracking);
  } else {
    chrome.tabs.onActivated.removeListener(handleTracking);
    chrome.webNavigation.onHistoryStateUpdated.removeListener(handleTracking);
  }
});
chrome.tabs.onActivated.addListener(async function (activeInfo) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || tab.url.includes("chrome://")) return;
  const websiteName = new URL(tab.url).hostname;
  const date = new Date().toLocaleTimeString();
  const url = "http://localhost:5021/update";
  await fetch(url, {
    method: "POST",
    body: JSON.stringify({ websiteName, startTime: date, endTime: date }),
    headers: {
      "Content-Type": "application/json",
    },
  });
});

async function handleTracking() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || tab.url.includes("chrome://")) return;

  const { data } = await chrome.storage.sync.get({ data: [] });
  const websiteName = new URL(tab.url).hostname;
  const date = new Date().toLocaleTimeString();

  // Update endTime for the last website visited
  if (data.length > 0 && !data[data.length - 1].endTime) {
    data[data.length - 1].endTime = date;
  }

  // Only add a new entry if it's a new site
  if (!data.length || data[data.length - 1].websiteName !== websiteName) {
    const url = "http://localhost:5021/update";
    // try {
    //   await fetch(url, {
    //     method: "POST",
    //     body: JSON.stringify({ websiteName, startTime: date, endTime: "" }),
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   });
    // } catch (e) {
    //   await fetch(url, {
    //     method: "POST",
    //     body: JSON.stringify({ websiteName, startTime: date, endTime: "" }),
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   });
    // }
    data.push({ websiteName, startTime: date, endTime: "" });
  }

  await chrome.storage.sync.set({ data: data });
}
function getTabInfo(tabId) {
  chrome.tabs.get(tabId, function (tab) {
    if (lastUrl != tab.url || lastTitle != tab.title)
      console.log((lastUrl = tab.url), (lastTitle = tab.title));
  });
}
