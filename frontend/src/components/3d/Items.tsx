import { useConnectionState } from "@/lib/store";

export const Items = () => {
  const items = useConnectionState((s) => s.room.items);
  return items.map(({ id, position, visible, ownerId }) => {
    return (
      <mesh key={id} position={[position.x, 0.5, position.y]} visible={visible && !ownerId}>
        <meshNormalMaterial />
        <dodecahedronGeometry args={[0.5]} />
      </mesh>
    );
  });
};
