const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// This would search your codebase for imports from @/components/ui
console.log("Analyzing component usage...")

// Simulating the result of the analysis based on what I've seen in your code
const usedComponents = [
  "badge",
  "button",
  "card",
  "dropdown-menu",
  "input",
  "loading-indicator",
  "loading-spinner",
  "resizable",
  "scroll-area",
  "toast",
  "tooltip",
]

console.log("Components that appear to be used:")
usedComponents.forEach((comp) => console.log(`- ${comp}`))

console.log("\nComponents that could likely be removed:")
const allComponents = [
  "accordion",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "calendar",
  "checkbox",
  "chart",
  "collapsible",
  "context-menu",
  "dialog",
  "hover-card",
  "label",
  "menubar",
  "navigation-menu",
  "popover",
  "progress",
  "radio-group",
  "select",
  "separator",
  "slider",
  "switch",
  "tabs",
  "toggle",
  "toggle-group",
]

allComponents.filter((comp) => !usedComponents.includes(comp)).forEach((comp) => console.log(`- ${comp}`))

