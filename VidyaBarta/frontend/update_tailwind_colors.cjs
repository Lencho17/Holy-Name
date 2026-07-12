const fs = require('fs');

const configPath = './tailwind.config.js';
let configContent = fs.readFileSync(configPath, 'utf8');

const newColors = {
  "secondary-fixed-dim": "#b7c8e1",
  "outline": "#747685",
  "on-error-container": "#93000a",
  "inverse-surface": "#2f3038",
  "on-secondary": "#ffffff",
  "secondary": "#505f76",
  "on-background": "#1a1b23",
  "tertiary-container": "#4d5052",
  "background": "#fbf8ff",
  "surface-variant": "#e2e1ec",
  "on-tertiary-container": "#c0c2c4",
  "tertiary-fixed": "#e0e3e5",
  "secondary-fixed": "#d3e4fe",
  "surface": "#fbf8ff",
  "on-secondary-fixed": "#0b1c30",
  "surface-container-lowest": "#ffffff",
  "outline-variant": "#c4c5d6",
  "on-tertiary-fixed-variant": "#444749",
  "on-secondary-fixed-variant": "#38485d",
  "surface-container-highest": "#e2e1ec",
  "on-surface-variant": "#444654",
  "inverse-primary": "#b7c4ff",
  "error": "#ba1a1a",
  "surface-dim": "#dad9e4",
  "error-container": "#ffdad6",
  "on-secondary-container": "#54647a",
  "surface-container": "#eeedf8",
  "on-surface": "#1a1b23",
  "tertiary": "#36393b",
  "on-primary-fixed-variant": "#0438b6",
  "primary": "#002c98",
  "primary-container": "#1a43bf",
  "on-primary": "#ffffff",
  "on-tertiary": "#ffffff",
  "primary-fixed-dim": "#b7c4ff",
  "surface-bright": "#fbf8ff",
  "inverse-on-surface": "#f1f0fa",
  "on-error": "#ffffff",
  "on-primary-fixed": "#001453",
  "surface-container-low": "#f4f2fd",
  "tertiary-fixed-dim": "#c4c7c9",
  "surface-tint": "#2f53ce",
  "surface-container-high": "#e8e7f2",
  "on-primary-container": "#b2bfff",
  "primary-fixed": "#dde1ff",
  "on-tertiary-fixed": "#191c1e",
  "secondary-container": "#d0e1fb"
};

// Simple naive replace, assuming a specific structure, or we can just use regex.
for (const [key, value] of Object.entries(newColors)) {
  const regex = new RegExp(`"${key}":\\s*"[^"]*",?`, 'g');
  if (configContent.match(regex)) {
    configContent = configContent.replace(regex, `"${key}": "${value}",`);
  } else {
    // Inject at the end of colors block
    configContent = configContent.replace(/colors:\s*\{/, `colors: {\n        "${key}": "${value}",`);
  }
}

fs.writeFileSync(configPath, configContent);
console.log('tailwind.config.js updated');
