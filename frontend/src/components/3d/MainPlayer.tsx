import { Suspense, useCallback, useImperativeHandle, useRef, type Ref } from "react";
import { getModelFromName, Sushi, type SushiHandle } from "./Sushi";
import { useFrame } from "@react-three/fiber";
import { CAMERA_OFFSET } from "@/lib/constants";
import { targetPosition } from "./Canvas";
import { useConnectionState } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import useSWRMutation from "swr/mutation";
import { useParams, useSearchParams } from "react-router";
import { claimItem, type ClaimItemPayload } from "@/lib/requests";
import { MathUtils, Sprite, Vector3 } from "three";
import { useTexture } from "@react-three/drei";
import plusOne from "@/assets/plus_one.webp?url";

const temp = new Vector3();
const THRESHOLD = 1;

const useClaimValidItems = (onSuccess: () => void) => {
  const requestedItemIds = useRef(new Set<string>());
  const itemIds = useConnectionState(useShallow((s) => s.room.items.map((i) => i.id)));
  const playerId = useConnectionState((s) => s.id);
  const slug = useParams<{ slug: string }>().slug ?? "";

  const { trigger } = useSWRMutation(
    `/rooms/${slug}/items`,
    (_: string, { arg }: { arg: { slug: string; payload: ClaimItemPayload } }) =>
      claimItem(arg.slug, arg.payload),
    { onSuccess },
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
interface PlusOneHandle {
  resetSprite: () => void;
}

const PlusOne = ({ ref }: { ref: Ref<PlusOneHandle> }) => {
  const texture = useTexture(plusOne);
  const sprite = useRef<Sprite>(null!);
  const initialY = 1;
  const initialOpacity = 0;
  const targetY = 2;

  useImperativeHandle(
    ref,
    () => ({
      resetSprite() {
        sprite.current.position.setY(1);
        sprite.current.material.opacity = 1;
      },
    }),
    [],
  );

  useFrame((_, delta) => {
    const { y } = sprite.current.position;
    sprite.current.position.y = MathUtils.damp(y, targetY, 5, delta);
    const { opacity } = sprite.current.material;
    sprite.current.material.opacity = MathUtils.damp(opacity, initialOpacity, 3, delta);
  });

  return (
    <sprite
      ref={sprite}
      material-map={texture}
      material-transparent
      material-opacity={initialOpacity}
      position-y={initialY}
      scale={0.75}
    />
  );
};

export const MainPlayer = () => {
  const sushi = useRef<SushiHandle>(null);
  const plusOne = useRef<PlusOneHandle>(null);
  const claimValidItems = useClaimValidItems(() => plusOne.current?.resetSprite());
  const name = useSearchParams()[0].get("name") ?? "anonymous";

  useFrame(({ camera }, delta) => {
    if (!sushi.current) return;
    sushi.current.updatePosition(targetPosition, delta);
    const currentPosition = sushi.current.getCurrentPosition();
    camera.position.copy(currentPosition).add(CAMERA_OFFSET);
    camera.lookAt(currentPosition);
    claimValidItems(currentPosition);
  });

  return (
    <Suspense>
      <Sushi ref={sushi} model={getModelFromName(name)}>
        <PlusOne ref={plusOne} />
      </Sushi>
    </Suspense>
  );
};
