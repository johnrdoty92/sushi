import { BOARD_SIZE } from "@/lib/constants";
import { useKTX2 } from "@react-three/drei";
import { type ThreeElements } from "@react-three/fiber";
import diff from "@/assets/cedar_planks_diff.ktx2";
import norm from "@/assets/cedar_planks_norm.ktx2";
import rough from "@/assets/cedar_planks_rough.ktx2";
import { RepeatWrapping } from "three";
import { useLayoutEffect } from "react";

export const Board = (props: ThreeElements["mesh"]) => {
  const textures = useKTX2([diff, norm, rough]);

  useLayoutEffect(() => {
    for (const texture of textures) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(2, 2);
    }
  }, [textures]);

  const [diffuse, normals, roughness] = textures;

  return (
    <mesh {...props} position-y={-0.5}>
      <boxGeometry args={[BOARD_SIZE, 1, BOARD_SIZE]} />
      <meshStandardMaterial
        attach="material-2"
        map={diffuse}
        roughnessMap={roughness}
        normalMap={normals}
        normalScale={[0.5, 0.5]}
        roughness={1}
        metalness={0.25}
      />
      <meshStandardMaterial attach="material-0" color={0x8e6024} />
      <meshStandardMaterial attach="material-4" color={0x61302d} />
    </mesh>
  );
};
