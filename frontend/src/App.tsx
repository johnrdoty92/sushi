import { Outlet } from "react-router";
import "./App.css";
import { Canvas } from "@/components/3d/Canvas";

function App() {
  return (
    <main className="flex flex-col">
      <Outlet />
      <Canvas></Canvas>
    </main>
  );
}

export default App;
