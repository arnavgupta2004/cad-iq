import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1a1d27",
          color: "#ffffff",
          border: "1px solid rgba(79, 142, 247, 0.25)",
        },
      }}
    />
  </React.StrictMode>
);
