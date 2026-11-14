import type { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback } from "react";
import { KTX2Loader, MeshoptDecoder } from "three-stdlib";

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath("/basis/");

export const useExtendLoader = () => {
  const gl = useThree((s) => s.gl);
  return useCallback<NonNullable<Parameters<typeof useGLTF>[3]>>(
    (loader) => {
      loader.setKTX2Loader(ktx2Loader.detectSupport(gl));
      loader.setMeshoptDecoder(MeshoptDecoder);
    },
    [gl],
  );
};
