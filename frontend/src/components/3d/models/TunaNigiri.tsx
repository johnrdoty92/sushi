import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Mesh } from "three";
import { type GLTF } from "three-stdlib";
import tunaNigiri from "@/assets/tuna_nigiri.glb";
import { useAtlas } from "@/lib/useAtlas";

type GLTFResult = GLTF & {
  nodes: {
    tuna: Mesh;
    tuna_rice: Mesh;
  };
};

export function TunaNigiri(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(tunaNigiri) as unknown as GLTFResult;
  const material = useAtlas()
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.tuna.geometry}
        material={material}
        position={[-0.015, 0.167, 0.003]}
        scale={0.505}
      />
      <mesh
        castShadow
        geometry={nodes.tuna_rice.geometry}
        material={material}
        position={[-0.001, 0.144, -0.013]}
        scale={0.472}
      />
    </group>
  );
}

useGLTF.preload(tunaNigiri);
