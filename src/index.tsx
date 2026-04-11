import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";

import { PeepsGenerator } from "./components/App";
import { Provider } from "./utils/contextProvider";
import { AuthProvider } from "./utils/authContext";

import "rc-slider/assets/index.css";
import "./styles/index.css";
import "./styles/auth-taskboard.css";
import "@mantine/core/styles.css";

const theme = createTheme({ fontFamily: "Itim, sans-serif" });

const container = document.getElementById("main");
if (!container) throw new Error("Failed to find the root element");

createRoot(container).render(
    <React.StrictMode>
        <MantineProvider theme={theme}>
            <AuthProvider>
                <Provider>
                    <PeepsGenerator />
                </Provider>
            </AuthProvider>
        </MantineProvider>
    </React.StrictMode>
);