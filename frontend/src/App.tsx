import { Outlet } from "react-router";
import { Canvas } from "@/components/3d/Canvas";
import { Scene } from "@/components/3d/Scene";

function App() {
  return (
    <main className="flex flex-col relative">
      <Canvas>
        <Scene />
      </Canvas>
      <Outlet />
    </main>
  );
}

export default App;
