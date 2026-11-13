export const Light = () => {
  return (
    <directionalLight
      castShadow
      shadow-intensity={5}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={7.5}
      shadow-camera-bottom={-7.5}
      args={["white", 1]}
      position={[0, 10, -10]}
    />
  );
};
