import { useConnectionState } from "@/lib/store";
import { type ThreeElements } from "@react-three/fiber";
import { SoySauce } from "./models/SoySauce";

export const Item = (props: ThreeElements["group"]) => {
  return (
    <group {...props}>
      <SoySauce />
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
