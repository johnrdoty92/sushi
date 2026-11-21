import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Mesh } from "three";
import { type GLTF } from "three-stdlib";
import salmonNigiri from "@/assets/salmon_nigiri.glb";
import { useAtlas } from "@/lib/useAtlas";

type GLTFResult = GLTF & {
  nodes: {
    salmon: Mesh;
    salmon_rice: Mesh;
  };
};

export function SalmonNigiri(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(salmonNigiri) as unknown as GLTFResult;
  const material = useAtlas();
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.salmon.geometry}
        material={material}
        position={[-0.021, 0.159, 0.002]}
        scale={0.51}
      />
      <mesh
        castShadow
        geometry={nodes.salmon_rice.geometry}
        material={material}
        position={[-0.018, 0.138, -0.013]}
        scale={0.477}
      />
    </group>
  );
}

useGLTF.preload(salmonNigiri);
