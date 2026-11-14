import { Suspense } from "react";
import { Board } from "@/components/3d/Board";
import { Items } from "@/components/3d/Items";
import { Players } from "@/components/3d/Players";
import { MainPlayer } from "@/components/3d/MainPlayer";
import { Environment } from "@react-three/drei";
import { Light } from "./Light";
import sunset from "@/assets/bambanani_sunset_1k.jpg?url";

export const Scene = () => {
  return (
    <Suspense>
      <Light />
      <Environment files={sunset} />
      <MainPlayer />
      <Items />
      <Players />
      <Board receiveShadow />
    </Suspense>
  );
};
