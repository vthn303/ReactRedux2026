import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { StyledEngineProvider, GlobalStyles } from "@mui/material";
import { store } from "./app/store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <App />
    </StyledEngineProvider>
  </Provider>
);
