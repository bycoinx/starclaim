import { Buffer } from "buffer";
import process from "process";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;
}

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
