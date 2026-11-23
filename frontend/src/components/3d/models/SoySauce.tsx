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
  const [orm, diff] = useKTX2([ormKtx2, diffKtx2], "/basis/");
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
useKTX2.preload(ormKtx2, "/basis/");
useKTX2.preload(diffKtx2, "/basis/");
