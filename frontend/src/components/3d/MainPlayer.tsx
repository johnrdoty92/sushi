import { useCallback, useRef } from "react";
import { Sushi, type SushiHandle } from "./Sushi";
import { useFrame } from "@react-three/fiber";
import { CAMERA_OFFSET } from "@/lib/constants";
import { targetPosition } from "./Canvas";
import { useConnectionState } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import useSWRMutation from "swr/mutation";
import { useParams } from "react-router";
import { claimItem, type ClaimItemPayload } from "@/lib/requests";
import { Vector3 } from "three";

const temp = new Vector3();
const THRESHOLD = 1;

const useClaimValidItems = () => {
  const requestedItemIds = useRef(new Set<string>());
  const itemIds = useConnectionState(useShallow((s) => s.room.items.map((i) => i.id)));
  const playerId = useConnectionState((s) => s.id);
  const slug = useParams<{ slug: string }>().slug ?? "";

  const { trigger } = useSWRMutation(
    `/rooms/${slug}/items`,
    (_: string, { arg }: { arg: { slug: string; payload: ClaimItemPayload } }) =>
      claimItem(arg.slug, arg.payload),
  );

  return useCallback(
    (currentPosition: Vector3) => {
      const { items, timeRemaining } = useConnectionState.getState().room;
      for (const item of items) {
        const hasOwner = !!item.ownerId;
        const isWithinRange =
          temp.set(item.position.x, 0, item.position.y).distanceToSquared(currentPosition) <
          THRESHOLD;
        const isGameStarted = timeRemaining > 0;
        if (
          !item.visible ||
          hasOwner ||
          !slug ||
          !isWithinRange ||
          requestedItemIds.current.has(item.id) ||
          !isGameStarted
        )
          continue;
        requestedItemIds.current.add(item.id);
        trigger({ slug, payload: { playerId, itemId: item.id } });
      }
    },
    [itemIds, slug, playerId],
  );
};

export const MainPlayer = () => {
  const sushi = useRef<SushiHandle>(null!);
  const claimValidItems = useClaimValidItems();

  useFrame(({ camera }, delta) => {
    sushi.current.updatePosition(targetPosition, delta);
    const currentPosition = sushi.current.getCurrentPosition();
    camera.position.copy(currentPosition).add(CAMERA_OFFSET);
    camera.lookAt(currentPosition);
    claimValidItems(currentPosition);
  });

  return <Sushi ref={sushi} model="" />;
};
