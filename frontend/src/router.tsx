import { createBrowserRouter } from "react-router";
import App from "./App.tsx";
import GameRoom from "./pages/GameRoom.tsx";
import Home from "./pages/Home.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: Home },
      { path: "rooms/:slug", Component: GameRoom },
    ],
  },
]);
