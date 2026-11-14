import { Suspense, useRef } from "react";
import { Board } from "@/components/3d/Board";
import { Item, Items } from "@/components/3d/Items";
import { Players } from "@/components/3d/Players";
import { MainPlayer } from "@/components/3d/MainPlayer";
import { Environment } from "@react-three/drei";
import { Light } from "./Light";
import sunset from "@/assets/bambanani_sunset_1k.jpg?url";
import { useLocation } from "react-router";
import { useFrame } from "@react-three/fiber";
import { CAMERA_OFFSET } from "@/lib/constants";
import { Sushi } from "./Sushi";
import { MathUtils, type Group } from "three";

export const Scene = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const scene = useRef<Group>(null);

  useFrame(({ camera }, delta) => {
    if (!isHome) {
      if (scene.current) {
        const { y } = scene.current.rotation;
        scene.current.rotation.y = MathUtils.damp(y, 0, 2, delta) % (Math.PI * 2);
      }
      return;
    }
    const alpha = 1 - Math.exp(-3 * delta);
    camera.position.lerp(CAMERA_OFFSET, alpha);
    if (scene.current) {
      scene.current.rotation.y += delta / 4;
    }
  });
  return (
    <Suspense>
      <group ref={scene}>
        <Light />
        <Environment files={sunset} />
        {isHome ? (
          <>
            <Sushi model="tunaRoll" position={[0.33, 0, -1]} />
            <Sushi model="salmonRoll" position={[-0.33, 0, -1]} />
            <Sushi model="cucumberRoll" position={[-0.33, 0, -1.66]} />
            <Sushi model="salmonRoll" position={[0.33, 0, -1.66]} />
            <Sushi model="tunaNigiri" position-z={-0.33} rotation-y={Math.PI / 4} />
            <Sushi model="salmonNigiri" position-z={0.33} rotation-y={Math.PI / 4} />
            <Sushi model="tunaNigiri" position-z={0.9} rotation-y={Math.PI / 4} />
            <Sushi model="salmonNigiri" position-z={1.55} rotation-y={5 * (Math.PI / 4)} />
            <Item position-z={2.33} />
          </>
        ) : (
          <>
            <MainPlayer />
            <Items />
            <Players />
          </>
        )}
        <Board receiveShadow />
      </group>
    </Suspense>
  );
};
