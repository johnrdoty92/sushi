import { BOARD_SIZE } from "@/lib/constants";
import { useTexture } from "@react-three/drei";
import { useLoader, type ThreeElements } from "@react-three/fiber";
import diff from "@/assets/japanese_cedar_planks_diff_1k.jpg?url";
import norm from "@/assets/japanese_cedar_planks_nor_gl_1k.exr?url";
import rough from "@/assets/japanese_cedar_planks_rough_1k.exr?url";
import { EXRLoader } from "three-stdlib";
import { RepeatWrapping } from "three";

export const Board = (props: ThreeElements["mesh"]) => {
  const diffuse = useTexture(diff, (t) => {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(2, 2);
  });
  const normals = useLoader(EXRLoader, norm);
  const roughness = useLoader(EXRLoader, rough);

  return (
    <mesh {...props} position-y={-0.5}>
      <boxGeometry args={[BOARD_SIZE, 1, BOARD_SIZE]} />
      <meshStandardMaterial
        attach="material-2"
        map={diffuse}
        roughnessMap={roughness}
        normalMap={normals}
        normalScale={[0.5, 1]}
        roughness={1}
        metalness={0.5}
      />
      <meshStandardMaterial attach="material-0" color={0x8e6024} />
      <meshStandardMaterial attach="material-4" color={0x61302d} />
    </mesh>
  );
};
