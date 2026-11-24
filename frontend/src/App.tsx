import { Outlet } from "react-router";
import { Canvas } from "@/components/3d/Canvas";
import { Scene } from "@/components/3d/Scene";
import { Perf } from "r3f-perf";
import { Initialize } from "./Initialize";
import { Loader } from "@react-three/drei";

function App() {
  return (
    <main className="flex flex-col relative">
      <Canvas>
        {import.meta.env.DEV && <Perf />}
        <Initialize>
          <Scene />
        </Initialize>
      </Canvas>
      <Loader
        barStyles={{ background: "white" }}
        innerStyles={{ background: "oklch(45.2% 0.211 324.591)" }}
        containerStyles={{ background: "oklch(83.3% 0.145 321.434)" }}
      />
      <Outlet />
    </main>
  );
}

export default App;
