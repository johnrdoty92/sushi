import { Suspense } from "react";
import { Board } from "@/components/3d/Board";
import { TargetPositionIndicator } from "./TargetPositionIndicator";
import { Items } from "./Items";
import { Players } from "./Players";
import { MainPlayer } from "./MainPlayer";
import { Environment } from "@react-three/drei";
import sunset from "@/assets/bambanani_sunset_1k.jpg?url";

export const Scene = () => {
  return (
    <>
      <ambientLight intensity={4} />
      <Environment files={sunset} />
      <TargetPositionIndicator />
      <Suspense>
        <MainPlayer />
      </Suspense>
      <Items />
      <Players />
      <Board />
    </>
  );
};
