import { useLayoutEffect, type PropsWithChildren } from "react";
import { useInitializedState } from "./lib/store";
import { useEnvironment, useKTX2, useTexture } from "@react-three/drei";

import atlas from "@/assets/sushi_atlas.ktx2";
import atlasNormal from "@/assets/sushi_atlas_normal.ktx2";
import diffKtx2 from "@/assets/soy_sauce_diff.ktx2";
import ormKtx2 from "@/assets/soy_sauce_orm.ktx2";
import diff from "@/assets/cedar_planks_diff.ktx2";
import norm from "@/assets/cedar_planks_norm.ktx2";
import rough from "@/assets/cedar_planks_rough.ktx2";

import sunset from "@/assets/bambanani_sunset_1k.jpg";
import plusOne from "@/assets/plus_one.webp?url";
import { useThree } from "@react-three/fiber";
import type { Texture, WebGLRenderer } from "three";

const initializeTextures = async (textures: Texture[], gl: WebGLRenderer) => {
  for (const texture of textures) {
    gl.initTexture(texture);
    await new Promise(requestAnimationFrame);
  }
};

export const Initialize = ({ children }: PropsWithChildren) => {
  const gl = useThree((s) => s.gl);
  const isInitialized = useInitializedState((s) => s.isInitialized);
  const dispatchInitialized = useInitializedState((s) => s.dispatchInitialized);

  const ktx2s = useKTX2([atlas, atlasNormal, diffKtx2, ormKtx2, diff, norm, rough], "/basis/");
  const env = useEnvironment({ files: sunset });
  const plusOneSprite = useTexture(plusOne);

  useLayoutEffect(() => {
    let cancelled = false;
    initializeTextures([...ktx2s, env, plusOneSprite], gl).then(() => {
      if (!cancelled) dispatchInitialized();
    });
    return () => {
      cancelled = true;
    };
  }, [dispatchInitialized, ktx2s, env, plusOneSprite, gl]);

  if (isInitialized) return children;

  return null;
};
