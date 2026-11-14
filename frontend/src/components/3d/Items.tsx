import { useConnectionState } from "@/lib/store";
import { useExtendLoader } from "@/lib/useExtendLoader";
import { useGLTF } from "@react-three/drei";
import { dispose, type ThreeElements } from "@react-three/fiber";
import soySauce from "@/assets/soy_sauce.glb?url";
import { useEffect, useMemo } from "react";

export const Item = (props: ThreeElements["group"]) => {
  const extendLoader = useExtendLoader();
  const gltf = useGLTF(soySauce, false, true, extendLoader);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);
  useEffect(() => () => dispose(scene), [scene]);
  return (
    <group {...props}>
      <primitive object={scene} />
      <mesh rotation-x={-Math.PI / 2} position={[-0.09, 0.001, 0.15]}>
        <circleGeometry args={[0.35]} />
        <meshBasicMaterial transparent color={0x4c2412} opacity={0.5} />
      </mesh>
    </group>
  );
};

export const Items = () => {
  const items = useConnectionState((s) => s.room.items);
  return items.map(({ id, position, visible, ownerId }) => {
    return (
      <Item key={id} position={[position.x, 0.001, position.y]} visible={visible && !ownerId} />
    );
  });
};
