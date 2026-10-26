// Python -> UI bridge.
//
// This file is deliberately a plain, unbundled script: eel discovers which JS
// functions Python may call by scanning the web folder for literal eel.expose calls
// at startup, so these calls must survive as literal text. Each function only
// forwards to the handler the React app registered under the same name.
(function () {
  var bridge = (window.__robinBridge = window.__robinBridge || {
    handlers: {},
    // keybind fields currently capturing input; the macro ignores hotkeys meanwhile
    recording: {},
  });

  function forward(name, args) {
    var handler = bridge.handlers[name];
    if (typeof handler === "function") return handler.apply(null, args);
    return null;
  }

  window.log = function log() {
    return forward("log", arguments);
  };
  window.loadTasks = function loadTasks() {
    return forward("loadTasks", arguments);
  };
  window.loadInputs = function loadInputs() {
    return forward("loadInputs", arguments);
  };
  window.toggleStartStop = function toggleStartStop() {
    return forward("toggleStartStop", arguments);
  };
  window.updateMacroMode = function updateMacroMode() {
    return forward("updateMacroMode", arguments);
  };
  window.refreshCurrentTabContent = function refreshCurrentTabContent() {
    return forward("refreshCurrentTabContent", arguments);
  };
  window.updateProgress = function updateProgress() {
    return forward("updateProgress", arguments);
  };
  window.updateButtonReset = function updateButtonReset() {
    return forward("updateButtonReset", arguments);
  };
  window.closeWindow = function closeWindow() {
    var win = window.open(location, "_self");
    win.top.close();
  };
  // Python polls dataset.recording of the keybind inputs to pause its hotkeys.
  window.getElementProperty = function getElementProperty(id, property) {
    if (property === "dataset.recording") return bridge.recording[id] ? "true" : "false";
    return null;
  };

  if (!window.eel) return;
  eel.expose(log);
  eel.expose(loadTasks);
  eel.expose(loadInputs);
  eel.expose(toggleStartStop);
  eel.expose(updateMacroMode);
  eel.expose(refreshCurrentTabContent);
  eel.expose(updateProgress);
  eel.expose(updateButtonReset);
  eel.expose(closeWindow);
  eel.expose(getElementProperty);
})();
