import { useRef } from "react";
import { Board } from "@/components/3d/Board";
import { Items } from "@/components/3d/Items";
import { Players } from "@/components/3d/Players";
import { MainPlayer } from "@/components/3d/MainPlayer";
import { Environment } from "@react-three/drei";
import { Light } from "./Light";
import sunset from "@/assets/bambanani_sunset_1k.jpg?url";
import { useLocation } from "react-router";
import { useFrame } from "@react-three/fiber";
import { CAMERA_HOME_FOCUS, CAMERA_HOME_POSITION } from "@/lib/constants";
import { type Camera, MathUtils, PerspectiveCamera, type Group } from "three";
import { CucumberRoll, SalmonNigiri, SalmonRoll, SoySauce, TunaNigiri, TunaRoll } from "./models";

const offsetCameraCenter = (camera: Camera) => {
  camera.projectionMatrix.elements[9] = -0.3;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
};

export const Scene = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const scene = useRef<Group>(null);
  const tempCamera = new PerspectiveCamera();

  useFrame(({ camera }, delta) => {
    offsetCameraCenter(camera);
    if (!isHome) {
      if (scene.current) {
        const { y } = scene.current.rotation;
        const diff = Math.atan2(Math.sin(-y), Math.cos(-y));
        scene.current.rotation.y = MathUtils.damp(y, y + diff, 2, delta) % (Math.PI * 2);
      }
      return;
    }
    const alpha = 1 - Math.exp(-3 * delta);
    camera.position.lerp(CAMERA_HOME_POSITION, alpha);
    tempCamera.position.copy(camera.position);
    tempCamera.lookAt(CAMERA_HOME_FOCUS);
    camera.quaternion.slerp(tempCamera.quaternion, alpha);
    if (scene.current) {
      scene.current.rotation.y += delta / 4;
    }
  });
  return (
    <group ref={scene}>
      <Light />
      <Environment files={sunset} />
      {isHome ? (
        <>
          <TunaRoll position={[0.33, 0, -1]} />
          <SalmonRoll position={[-0.33, 0, -1]} />
          <CucumberRoll position={[-0.33, 0, -1.66]} />
          <SalmonRoll position={[0.33, 0, -1.66]} />
          <TunaNigiri position-z={-0.33} rotation-y={Math.PI / 4} />
          <SalmonNigiri position-z={0.33} rotation-y={Math.PI / 4} />
          <TunaNigiri position-z={0.9} rotation-y={Math.PI / 4} />
          <SalmonNigiri position-z={1.55} rotation-y={5 * (Math.PI / 4)} />
          <SoySauce position-z={2.33} />
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
  );
};
