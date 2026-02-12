import React from 'react';

export function Mannequin(props: any) {
  return (
    <group position={[0, -1, 0]} {...props}>
      {/* Head */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 2.1, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
        <meshStandardMaterial color="#e2e2e2" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 2.3, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 4, 16]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
      <mesh position={[0.45, 2.3, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 4, 16]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.15, 1, 0]}>
        <capsuleGeometry args={[0.12, 1.2, 4, 16]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
      <mesh position={[0.15, 1, 0]}>
        <capsuleGeometry args={[0.12, 1.2, 4, 16]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
    </group>
  );
}
