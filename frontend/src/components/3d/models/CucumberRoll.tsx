import { useGLTF } from "@react-three/drei";
import type { Mesh } from "three";
import { type GLTF } from "three-stdlib";
import cucumber from "@/assets/cucumber_roll.glb";
import type { ThreeElements } from "@react-three/fiber";
import { useAtlas } from "@/lib/useAtlas";

type GLTFResult = GLTF & {
  nodes: {
    cucumber: Mesh;
    cucumber_nori: Mesh;
    cucumber_roll_rice: Mesh;
  };
};

export function CucumberRoll(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(cucumber) as unknown as GLTFResult;
  const material = useAtlas();
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.cucumber.geometry}
        position={[-0.017, 0.132, -0.014]}
        scale={0.154}
      >
        <meshStandardMaterial color={0xafd683} />
      </mesh>
      <mesh
        castShadow
        material={material}
        geometry={nodes.cucumber_nori.geometry}
        position={[0.003, 0.135, 0.001]}
        scale={0.314}
      />
      <mesh
        castShadow
        material={material}
        geometry={nodes.cucumber_roll_rice.geometry}
        position={[-0.001, 0.137, -0.001]}
        scale={0.3}
      />
    </group>
  );
}

useGLTF.preload(cucumber);
