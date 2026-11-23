import { Outlet } from "react-router";
import { Canvas } from "@/components/3d/Canvas";
import { Scene } from "@/components/3d/Scene";
import { Perf } from "r3f-perf";

function App() {
  return (
    <main className="flex flex-col relative">
      <Canvas>
        {import.meta.env.DEV && <Perf />}
        <Scene />
      </Canvas>
      <Outlet />
    </main>
  );
}

export default App;
