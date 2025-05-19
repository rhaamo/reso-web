const HubOnlineStatus = Object.freeze({
  0: { name: "Offline", hex: "#4f4f4f" },
  1: { name: "Invisible", hex: "#4f4f4f" },
  2: { name: "Away", hex: "#0fe1ff000" },
  3: { name: "Busy", hex: "#ff0022" },
  4: { name: "Online", hex: "#2fff00" },
  5: { name: "Sociable", hex: "#0033ff" }
});

const HubUserSessionType = Object.freeze({
  0: { name: "Unknown" },
  1: { name: "Graphical Client" },
  2: { name: "Chat Client" },
  3: { name: "Headless" },
  4: { name: "Bot" }
});

export {
  HubOnlineStatus,
  HubUserSessionType
}
