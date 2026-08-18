import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";


// --- Global Uppercase Interceptor ---
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const type = target.type ? target.type.toLowerCase() : '';
    
    // Exclude specific types
    const excludedTypes = ['email', 'password', 'url', 'file', 'hidden', 'color', 'date', 'datetime-local', 'month', 'time', 'week', 'number', 'range', 'checkbox', 'radio'];
    
    if (!excludedTypes.includes(type) && target.getAttribute('data-no-uppercase') !== 'true') {
      const oldVal = target.value;
      const newVal = oldVal.toUpperCase();
      
      if (oldVal !== newVal) {
        // Save cursor position
        const start = target.selectionStart;
        const end = target.selectionEnd;
        
        // Mutate the native value so React's synthetic event system picks it up correctly
        if (target.tagName === 'INPUT') {
          nativeInputValueSetter.call(target, newVal);
        } else {
          nativeTextAreaValueSetter.call(target, newVal);
        }
        
        // Dispatch a synthetic input event to force React to update its state
        const ev = new Event('input', { bubbles: true });
        target.dispatchEvent(ev);
        
        // Restore cursor position
        if (target.setSelectionRange) {
          try {
            target.setSelectionRange(start, end);
          } catch(err) {
            // some input types like 'number' don't support setSelectionRange, though we excluded them above just in case
          }
        }
      }
    }
  }
}, true); // Capture phase
// ------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
