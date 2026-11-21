import { useGLTF } from "@react-three/drei";
import type { Mesh } from "three";
import { type GLTF } from "three-stdlib";
import tunaRoll from "@/assets/tuna_roll.glb";
import type { ThreeElements } from "@react-three/fiber";
import { useAtlas } from "@/lib/useAtlas";

type GLTFResult = GLTF & {
  nodes: {
    tuna_roll_filling: Mesh;
    tuna_roll_nori: Mesh;
    tuna_roll_rice: Mesh;
  };
};

export function TunaRoll(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(tunaRoll) as unknown as GLTFResult;
  const material = useAtlas();
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.tuna_roll_filling.geometry}
        material={material}
        position={[-0.012, 0.127, 0.011]}
        scale={0.167}
      />
      <mesh
        castShadow
        geometry={nodes.tuna_roll_nori.geometry}
        material={material}
        position={[0.003, 0.135, 0.001]}
        scale={0.314}
      />
      <mesh
        castShadow
        geometry={nodes.tuna_roll_rice.geometry}
        material={material}
        position={[-0.001, 0.137, -0.001]}
        scale={0.3}
      />
    </group>
  );
}

useGLTF.preload(tunaRoll);
