import { useKTX2 } from "@react-three/drei";
import atlas from "@/assets/sushi_atlas.ktx2";
import atlasNormal from "@/assets/sushi_atlas_normal.ktx2";
import { MeshPhysicalMaterial } from "three";
import { useLayoutEffect } from "react";

const material = new MeshPhysicalMaterial();

export const useAtlas = () => {
  const texture = useKTX2(atlas);
  const normals = useKTX2(atlasNormal);

  useLayoutEffect(() => {
    material.map = texture;
    material.normalMap = normals;
    material.normalScale.set(0, 0.7);
    material.clearcoat = 1;
    material.clearcoatRoughness = 0.25;
  }, [texture, normals]);

  return material;
};
