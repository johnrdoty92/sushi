import { BOARD_SIZE } from "@/lib/constants";
import type { ThreeElements } from "@react-three/fiber";

export const Board = (props: ThreeElements["mesh"]) => {
  return (
    <mesh {...props} position-y={-0.5}>
      <boxGeometry args={[BOARD_SIZE, 1, BOARD_SIZE]} />
      <meshNormalMaterial />
    </mesh>
  );
};
