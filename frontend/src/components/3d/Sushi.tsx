import { Vector3, MathUtils, type Group } from "three";
import { useImperativeHandle, useRef, type FC, type Ref } from "react";
import { type ThreeElements } from "@react-three/fiber";
import {
  CucumberRoll,
  SalmonNigiri,
  SalmonRoll,
  TunaNigiri,
  TunaRoll,
} from "@/components/3d/models";

const temp = new Vector3();
const SPEED = 3;
const THRESHOLD = 0.01;

const modelNames = [
  "cucumberRoll",
  "salmonNigiri",
  "salmonRoll",
  "tunaRoll",
  "tunaNigiri",
] as const;

type Model = (typeof modelNames)[number];

const models: Record<Model, FC<ThreeElements["group"]>> = {
  cucumberRoll: CucumberRoll,
  salmonNigiri: SalmonNigiri,
  salmonRoll: SalmonRoll,
  tunaNigiri: TunaNigiri,
  tunaRoll: TunaRoll,
};

export const getModelFromName = (name: string) => {
  const index = (name[0] ?? "a").charCodeAt(0) % modelNames.length;
  return modelNames[index];
};

export interface SushiHandle {
  getCurrentPosition: () => Vector3;
  updatePosition: (targetPosition: Vector3, delta: number) => void;
}

export const Sushi = ({
  model,
  ref,
  children,
  ...props
}: Omit<ThreeElements["group"], "ref"> & { model: Model; ref?: Ref<SushiHandle> }) => {
  const Model = models[model];
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
    <group ref={groupRef} {...props}>
      <Model />
      {children}
    </group>
  );
};
