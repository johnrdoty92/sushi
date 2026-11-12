import { Suspense } from "react";
import { Board } from "@/components/3d/Board";
import { TargetPositionIndicator } from "./TargetPositionIndicator";
import { Items } from "./Items";
import { Players } from "./Players";
import { MainPlayer } from "./MainPlayer";

export const Scene = () => {
  return (
    <>
      <ambientLight intensity={4} />
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
