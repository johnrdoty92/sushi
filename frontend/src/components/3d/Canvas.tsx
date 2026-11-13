import { useCallback, useImperativeHandle, useRef, type PropsWithChildren, type Ref } from "react";
import { Canvas as R3FCanvas, useThree } from "@react-three/fiber";
import { BOARD_SIZE, CAMERA_OFFSET } from "@/lib/constants";
import { MathUtils, Plane, Vector3 } from "three";
import { normalizePositionValue } from "@/lib/utils";
import { type SubscriberState, updatePlayer } from "@/lib/requests";
import { useConnectionState } from "@/lib/store";
import { useParams, useSearchParams } from "react-router";
import useSWRMutation from "swr/mutation";

export const targetPosition = new Vector3();

interface TapHandle {
  onTap(): void;
}

const useUpdatePositionRemote = () => {
  const slug = useParams<{ slug: string }>().slug;
  const name = useSearchParams()[0].get("name");
  const id = useConnectionState((s) => s.id);

  const { trigger } = useSWRMutation(
    `/rooms/${slug}`,
    (
      _: string,
      { arg: { slug, playerState } }: { arg: { slug: string; playerState: SubscriberState } },
    ) => updatePlayer(slug, playerState),
  );

  return useCallback(() => {
    if (!slug || !id || !name) return;
    const { x, z } = targetPosition;
    trigger({
      slug,
      playerState: {
        id,
        name,
        position: { x: normalizePositionValue(x), y: normalizePositionValue(z) },
      },
    });
  }, [trigger, slug, name, id]);
};

const TapHandler = ({ ref }: { ref: Ref<TapHandle> }) => {
  const get = useThree((s) => s.get);
  const updatePositionRemote = useUpdatePositionRemote();

  const UP = new Vector3(0, 1, 0);
  const plane = new Plane().setFromNormalAndCoplanarPoint(UP, new Vector3());

  useImperativeHandle(
    ref,
    () => ({
      onTap() {
        const ray = get().raycaster.ray;
        ray.intersectPlane(plane, targetPosition);
        targetPosition.setX(MathUtils.clamp(targetPosition.x, BOARD_SIZE / -2, BOARD_SIZE / 2));
        targetPosition.setY(0);
        targetPosition.setZ(MathUtils.clamp(targetPosition.z, BOARD_SIZE / -2, BOARD_SIZE / 2));
        updatePositionRemote();
      },
    }),
    [get, updatePositionRemote],
  );
  return <></>;
};

export const Canvas = ({ children }: PropsWithChildren) => {
  const tapHandle = useRef<TapHandle>(null);
  return (
    <R3FCanvas
      shadows
      className="bg-radial-[at_50%_25%] from-orange-100 via-amber-100 to-fuchsia-300"
      camera={{ position: CAMERA_OFFSET, fov: 35 }}
      onPointerDown={() => tapHandle.current?.onTap()}
    >
      <TapHandler ref={tapHandle} />
      {children}
    </R3FCanvas>
  );
};
