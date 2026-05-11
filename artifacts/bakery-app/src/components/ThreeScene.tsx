import { Canvas } from '@react-three/fiber';
import { OrbitControls, Torus, Sphere, Box } from '@react-three/drei';
import { useState, useEffect } from 'react';

function FloatingShapes() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#f5c842" />
      <Torus args={[2, 0.5, 16, 100]} position={[-4, 2, -5]} rotation={[0.5, 0.5, 0]}>
        <meshStandardMaterial color="#d4a844" roughness={0.3} metalness={0.8} />
      </Torus>
      <Sphere args={[1.5, 32, 32]} position={[4, -2, -3]}>
        <meshStandardMaterial color="#8a5a19" roughness={0.4} metalness={0.6} />
      </Sphere>
      <Box args={[2, 2, 2]} position={[0, -4, -6]} rotation={[0.8, 0.2, 0.5]}>
        <meshStandardMaterial color="#f5c842" roughness={0.2} metalness={0.9} />
      </Box>
      <Torus args={[1, 0.3, 12, 60]} position={[3, 3, -8]} rotation={[1.2, 0.3, 0]}>
        <meshStandardMaterial color="#c49030" roughness={0.5} metalness={0.7} />
      </Torus>
      <Sphere args={[0.8, 20, 20]} position={[-3, -3, -4]}>
        <meshStandardMaterial color="#f0d080" roughness={0.3} metalness={0.5} />
      </Sphere>
    </>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

function GradientFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #3a2410 0%, #0f0d0b 50%, #1a1208 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(212,168,68,0.25) 0%, transparent 45%),
            radial-gradient(circle at 80% 65%, rgba(138,90,25,0.2) 0%, transparent 45%),
            radial-gradient(circle at 60% 15%, rgba(245,200,66,0.15) 0%, transparent 35%),
            radial-gradient(circle at 35% 75%, rgba(180,120,40,0.12) 0%, transparent 40%)
          `,
        }}
      />
    </div>
  );
}

export default function ThreeScene() {
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setWebGLAvailable(checkWebGLSupport());
  }, []);

  if (webGLAvailable === null) return null;
  if (!webGLAvailable) return <GradientFallback />;

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <FloatingShapes />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  );
}
