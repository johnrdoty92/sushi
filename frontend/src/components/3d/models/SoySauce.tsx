import { useGLTF, useKTX2 } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import soySauce from "@/assets/soy_sauce.glb";
import diffKtx2 from "@/assets/soy_sauce_diff.ktx2";
import ormKtx2 from "@/assets/soy_sauce_orm.ktx2";
import type { ThreeElements } from "@react-three/fiber";
import type { Mesh } from "three";

type GLTFResult = GLTF & {
  nodes: {
    defaultMaterial: Mesh;
  };
};

export function SoySauce(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(soySauce) as unknown as GLTFResult;
  const orm = useKTX2(ormKtx2);
  const diff = useKTX2(diffKtx2);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.defaultMaterial.geometry}
        position={[0, 0.225, 0]}
        scale={0.381}
      >
        <meshStandardMaterial map={diff} metalnessMap={orm} roughnessMap={orm} />
      </mesh>
    </group>
  );
}

useGLTF.preload(soySauce);
