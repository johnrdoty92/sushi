import { Vector3, MathUtils, Group } from "three";
import { KTX2Loader } from "three-stdlib";
import { useImperativeHandle, useRef, type Ref } from "react";

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath("/basis/");

const temp = new Vector3();
const SPEED = 3;
const THRESHOLD = 0.01;

type Model = string; // TODO: use keys to select different models

export interface SushiHandle {
  getCurrentPosition: () => Vector3;
  updatePosition: (targetPosition: Vector3, delta: number) => void;
}

export const Sushi = ({ model, ref }: { model: Model; ref: Ref<SushiHandle> }) => {
  const groupRef = useRef<Group>(null!);
  useImperativeHandle(
    ref,
    () => ({
      getCurrentPosition: () => groupRef.current.position,
      updatePosition: (targetPosition, delta) => {
        const grp = groupRef.current;
        if (grp.position.distanceToSquared(targetPosition) < THRESHOLD) return;
        grp.position.x = MathUtils.damp(grp.position.x, targetPosition.x, SPEED, delta);
        grp.position.z = MathUtils.damp(grp.position.z, targetPosition.z, SPEED, delta);
        temp.subVectors(targetPosition, grp.position);
        const currentRotation = grp.rotation.y;
        let diff = Math.atan2(temp.x, temp.z) - currentRotation;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        grp.rotation.y = MathUtils.damp(currentRotation, currentRotation + diff, 10, delta);
      },
    }),
    [],
  );

  return (
    <group ref={groupRef}>
      <mesh>
        <meshNormalMaterial />
        <sphereGeometry args={[0.5]} />
      </mesh>
      <arrowHelper args={[new Vector3(0, 0, 1), new Vector3(), 1, "red", 0.5, 0.5]} />
    </group>
  );
};
