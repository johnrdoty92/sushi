export const Light = () => {
  return (
    <directionalLight
      castShadow
      shadow-intensity={12}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={7.5}
      shadow-camera-bottom={-7.5}
      args={["white", 0.25]}
      position={[-12, 10, -9]}
    />
  );
};
