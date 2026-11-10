import { useImperativeHandle, useRef, type PropsWithChildren, type Ref } from "react";
import { Canvas as R3FCanvas, useThree } from "@react-three/fiber";
import { BOARD_SIZE, CAMERA_OFFSET } from "@/lib/constants";
import { MathUtils, Plane, Vector3 } from "three";

export const targetPosition = new Vector3();

interface TapHandle {
  onTap(): void;
}

const TapHandler = ({ ref }: { ref: Ref<TapHandle> }) => {
  const get = useThree((s) => s.get);

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
      },
    }),
    [get],
  );
  return <></>;
};

export const Canvas = ({ children }: PropsWithChildren) => {
  const tapHandle = useRef<TapHandle>(null);
  return (
    <R3FCanvas
      camera={{ position: CAMERA_OFFSET }}
      onPointerDown={() => tapHandle.current?.onTap()}
    >
      <TapHandler ref={tapHandle} />
      {children}
    </R3FCanvas>
  );
};
