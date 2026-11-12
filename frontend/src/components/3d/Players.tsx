import { useConnectionState } from "@/lib/store";
import { Suspense, useRef } from "react";
import { Vector3 } from "three";
import { Sushi, type SushiHandle } from "./Sushi";
import { useFrame } from "@react-three/fiber";
import { useShallow } from "zustand/shallow";

export const Players = () => {
  const playerIds = useConnectionState(
    useShallow((s) => s.room.subscribers.filter((p) => p.id !== s.id).map((p) => p.id)),
  );

  return playerIds.map((id) => <Player key={id} id={id} />);
};

const Player = ({ id }: { id: string }) => {
  const position = useRef(new Vector3());
  const player = useConnectionState((s) => s.room.subscribers.find((sub) => sub.id === id));
  if (player) position.current.set(player.position.x, 0, player.position.y);

  const sushi = useRef<SushiHandle>(null!);

  useFrame((_, delta) => {
    sushi.current.updatePosition(position.current, delta);
  });

  return (
    <Suspense>
      <Sushi model="" ref={sushi} />
    </Suspense>
  );
};
