import { Vector3, MathUtils, Group, Mesh } from "three";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type PropsWithChildren,
  type Ref,
} from "react";
import { useGLTF } from "@react-three/drei";
import { dispose } from "@react-three/fiber";
import cucumberRoll from "@/assets/cucumber_roll.glb?url";
import salmonNigiri from "@/assets/salmon_nigiri.glb?url";
import salmonRoll from "@/assets/salmon_roll.glb?url";
import tunaNigiri from "@/assets/tuna_nigiri.glb?url";
import tunaRoll from "@/assets/tuna_roll.glb?url";
import { useExtendLoader } from "@/lib/useExtendLoader";

const temp = new Vector3();
const SPEED = 3;
const THRESHOLD = 0.01;

const models = ["cucumberRoll", "salmonNigiri", "salmonRoll", "tunaRoll", "tunaNigiri"] as const;

type Model = (typeof models)[number];

const modelUrls: Record<Model, string> = {
  cucumberRoll,
  salmonNigiri,
  salmonRoll,
  tunaNigiri,
  tunaRoll,
};

export const getModelFromName = (name: string) => {
  const index = (name[0] ?? "a").charCodeAt(0) % models.length;
  return models[index];
};

export interface SushiHandle {
  getCurrentPosition: () => Vector3;
  updatePosition: (targetPosition: Vector3, delta: number) => void;
}

export const Sushi = ({
  model,
  ref,
  children,
}: PropsWithChildren<{ model: Model; ref: Ref<SushiHandle> }>) => {
  const extendLoader = useExtendLoader();
  const gltf = useGLTF(modelUrls[model], false, true, extendLoader);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
      }
    });
    return () => dispose(scene);
  }, [scene]);

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
      <primitive object={scene} />
      {children}
    </group>
  );
};
