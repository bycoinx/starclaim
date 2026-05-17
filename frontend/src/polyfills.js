import { Buffer } from "buffer";
import process from "process";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;
  
  // React 19 / Vite / CRA compatibility
  if (!window.global) {
    window.global = window;
  }
}
