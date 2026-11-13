import { useConnectionState } from "@/lib/store";
import { Suspense, useRef } from "react";
import { Vector3 } from "three";
import { getModelFromName, Sushi, type SushiHandle } from "./Sushi";
import { useFrame } from "@react-three/fiber";
import { useShallow } from "zustand/shallow";
import { Html } from "@react-three/drei";
import { getHueFromName } from "@/lib/utils";

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
  const name = player?.name ?? "";


  const sushi = useRef<SushiHandle>(null!);

  useFrame((_, delta) => {
    sushi.current.updatePosition(position.current, delta);
  });

  return (
    <Suspense>
      <Sushi model={getModelFromName(player?.name ?? "")} ref={sushi}>
        {name ? (
          <Html position-y={1}>
            <div
              className="-translate-x-1/2 px-1 relative z-1 after:absolute after:content-[''] after:w-3 after:h-3 after:bg-inherit after:left-1/2 after:-translate-x-1/2 after:rotate-45 after:-bottom-1 after:-z-1"
              style={{ backgroundColor: getHueFromName(name)}}
            >
              {name.length > 15 ? `${name.substring(0, 15)}...`: name}
            </div>
          </Html>
        ) : null}
      </Sushi>
    </Suspense>
  );
};
