import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box3, MathUtils, Vector3 } from "three";

const MODEL_PATH = "/models/vegetables.glb";

function canUseWebGL() {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function getInitialQuality() {
  if (typeof window === "undefined") return { dpr: 1.5, shadows: true, reducedMotion: false };

  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isWeakDevice = memory <= 4 || cores <= 4 || isSmallScreen || prefersReducedMotion;

  return {
    dpr: isWeakDevice ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
    shadows: !isWeakDevice,
    reducedMotion: prefersReducedMotion,
  };
}

function VegetableScene({ quality, pointerRef }) {
  const groupRef = useRef(null);
  const motionRef = useRef({ scroll: 0, x: 0, y: 0, depth: 0, section: 0 });
  const { scene } = useGLTF(MODEL_PATH);

  const { model, scale, shadowY } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = quality.shadows;
      child.receiveShadow = quality.shadows;
      child.frustumCulled = true;
    });

    const box = new Box3().setFromObject(cloned);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    cloned.position.sub(center);

    return {
      model: cloned,
      scale: 2.55 / maxAxis,
      shadowY: -(size.y * (2.55 / maxAxis)) / 2 - 0.08,
    };
  }, [scene, quality.shadows]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const target = motionRef.current;

    const updateFromScroll = () => {
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const rawProgress = MathUtils.clamp(window.scrollY / scrollable, 0, 1);
      const hero = document.querySelector(".hero");
      const heroRect = hero?.getBoundingClientRect();
      const heroProgress = heroRect
        ? MathUtils.clamp(-heroRect.top / Math.max(heroRect.height - window.innerHeight * 0.25, 1), 0, 1)
        : MathUtils.clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1);

      gsap.to(target, {
        scroll: rawProgress,
        x: (heroProgress - 0.5) * 0.72,
        y: heroProgress * -0.18,
        depth: heroProgress * 0.75,
        section: heroProgress,
        duration: 0.85,
        ease: "power3.out",
        overwrite: true,
      });
    };

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      gsap.killTweensOf(target);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const elapsed = state.clock.elapsedTime;
    const motion = motionRef.current;
    const pointer = pointerRef.current;
    const autoSpeed = quality.reducedMotion ? 0 : quality.shadows ? 0.16 : 0.11;
    const pointerEase = 0.08 + pointer.force * 0.08;

    groupRef.current.rotation.y += delta * autoSpeed;
    groupRef.current.rotation.x = MathUtils.lerp(
      groupRef.current.rotation.x,
      0.28 + motion.section * 0.76 + pointer.y * 0.26 + Math.sin(elapsed * 0.55) * 0.025,
      pointerEase,
    );
    groupRef.current.rotation.z = MathUtils.lerp(
      groupRef.current.rotation.z,
      -0.12 + motion.section * 0.34 - pointer.x * 0.22,
      pointerEase,
    );
    groupRef.current.position.x = MathUtils.lerp(groupRef.current.position.x, motion.x + pointer.x * 0.22, 0.07);
    groupRef.current.position.y = MathUtils.lerp(
      groupRef.current.position.y,
      motion.y + pointer.y * -0.18 + Math.sin(elapsed * 0.8) * 0.035,
      0.07,
    );
    groupRef.current.position.z = MathUtils.lerp(groupRef.current.position.z, motion.depth + pointer.force * 0.2, 0.07);

    state.camera.position.x = MathUtils.lerp(state.camera.position.x, motion.x * -0.45 + pointer.x * -0.18, 0.04);
    state.camera.position.y = MathUtils.lerp(state.camera.position.y, 0.55 + motion.section * 0.18, 0.035);
    state.camera.lookAt(0, 0.06, 0);
  });

  return (
    <>
      <group ref={groupRef} scale={scale} position={[0, 0, 0]} rotation={[0.28, -0.45, -0.12]}>
        <primitive object={model} />
      </group>
      
    {quality.shadows (
      
         <ContactShadows
        position={[0, shadowY, 0]}
        opacity={0.34}
        scale={3.3}
        blur={1.5}
        far={4}
        resolution={128}
  /> 
)} 
    </>
  );
}

useGLTF.preload(MODEL_PATH);

export default function VegetableModel() {
  const [quality, setQuality] = useState(getInitialQuality);
  const [webGLAvailable] = useState(canUseWebGL);
  const shellRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, force: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateTravel = () => {
      const shell = shellRef.current;
      const hero = shell?.closest(".hero");
      if (!shell || !hero) return;

      const shellRect = shell.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const progress = MathUtils.clamp(-heroRect.top / Math.max(heroRect.height - window.innerHeight * 0.25, 1), 0, 1);
      const bottomLimit = Math.max(heroRect.bottom - shellRect.bottom - 28, 0);

      gsap.to(shell, {
        y: bottomLimit * progress,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    updateTravel();
    window.addEventListener("scroll", updateTravel, { passive: true });
    window.addEventListener("resize", updateTravel);

    return () => {
      window.removeEventListener("scroll", updateTravel);
      window.removeEventListener("resize", updateTravel);
      if (shellRef.current) gsap.killTweensOf(shellRef.current);
    };
  }, []);

  useEffect(() => {
    const pointer = pointerRef.current;
    return () => {
      gsap.killTweensOf(pointer);
    };
  }, []);

  const moveFromPointer = (event) => {
    const shell = shellRef.current;
    if (!shell) return;

    const rect = shell.getBoundingClientRect();
    const x = MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    const force = event.pointerType === "touch" ? 1 : 0.72;

    gsap.to(pointerRef.current, {
      x,
      y,
      force,
      duration: event.pointerType === "touch" ? 0.22 : 0.34,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const settlePointer = () => {
    gsap.to(pointerRef.current, {
      x: 0,
      y: 0,
      force: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.55)",
      overwrite: "auto",
    });
  };

  const tapModel = (event) => {
    moveFromPointer(event);
    gsap.fromTo(
      pointerRef.current,
      { force: 1.15 },
      { force: 0.55, duration: 0.55, ease: "elastic.out(1, 0.45)", overwrite: "auto" },
    );
  };

  if (!webGLAvailable) {
    return (
      <div className="vegetable-model vegetable-model--lite" ref={shellRef} aria-hidden="true">
        <span className="vegetable-model__ring vegetable-model__ring--one" />
        <span className="vegetable-model__ring vegetable-model__ring--two" />
      </div>
    );
  }

  return (
    <div
      className={`vegetable-model${quality.shadows ? "" : " vegetable-model--lite"}`}
      ref={shellRef}
      aria-hidden="true"
      onPointerDown={tapModel}
      onPointerMove={moveFromPointer}
      onPointerLeave={settlePointer}
      onPointerCancel={settlePointer}
      onLostPointerCapture={settlePointer}
    >
      <span className="vegetable-model__ring vegetable-model__ring--one" />
      <span className="vegetable-model__ring vegetable-model__ring--two" />
      <span className="vegetable-model__spark vegetable-model__spark--one" />
      <span className="vegetable-model__spark vegetable-model__spark--two" />
      <span className="vegetable-model__spark vegetable-model__spark--three" />
      <Canvas
        camera={{ position: [0, 0.55, 5.4], fov: 32 }}
        dpr={[1, quality.dpr]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: true,
      }}
  shadows={quality.shadows}
>
        <PerformanceMonitor
          onDecline={() => setQuality((current) => ({ ...current, dpr: 1, shadows: true }))}
          onIncline={() => setQuality((current) => ({ ...current, dpr: Math.min(1.5, current.dpr + 0.15) }))}
        />
        <ambientLight intensity={1.25} />
        <directionalLight
          castShadow={quality.shadows}
          position={[3.5, 5, 4.5]}
          intensity={2.15}
          shadow-mapSize={[256, 256]}
          shadow-camera-near={0.5}
          shadow-camera-far={14}
        />
        <spotLight position={[-4, 3, 3]} intensity={1.4} angle={0.45} penumbra={1} />
        <Suspense fallback={null}>
          <VegetableScene quality={quality} pointerRef={pointerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
