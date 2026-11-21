import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Mesh } from "three";
import { type GLTF } from "three-stdlib";
import salmonRoll from "@/assets/salmon_roll.glb";
import { useAtlas } from "@/lib/useAtlas";

type GLTFResult = GLTF & {
  nodes: {
    salmon_filling: Mesh;
    salmon_roll_nori: Mesh;
    salmon_roll_rice: Mesh;
  };
};

export function SalmonRoll(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(salmonRoll) as unknown as GLTFResult;
  const material = useAtlas();
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.salmon_filling.geometry}
        material={material}
        position={[0.008, 0.135, -0.03]}
        scale={0.179}
      />
      <mesh
        castShadow
        geometry={nodes.salmon_roll_nori.geometry}
        material={material}
        position={[0.003, 0.135, 0.001]}
        scale={0.314}
      />
      <mesh
        castShadow
        geometry={nodes.salmon_roll_rice.geometry}
        material={material}
        position={[-0.001, 0.137, -0.001]}
        scale={0.3}
      />
    </group>
  );
}

useGLTF.preload(salmonRoll);
