import { useFrame } from "@react-three/fiber";
import { targetPosition } from "@/components/3d/Canvas";
import { type CircleGeometry, Mesh, type MeshBasicMaterial } from "three";
import { useRef } from "react";

const frequency = 6;
const amplitude = 0.5;

export const TargetPositionIndicator = () => {
  const meshRef = useRef<Mesh<CircleGeometry, MeshBasicMaterial>>(null!);

  useFrame(({ clock }) => {
    meshRef.current.position.copy(targetPosition);
    meshRef.current.position.setY(0.01);
    meshRef.current.material.opacity = 0.5 + amplitude * Math.sin(clock.elapsedTime * frequency);
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2}>
      <circleGeometry />
      <meshBasicMaterial transparent color="red" />
    </mesh>
  );
};
