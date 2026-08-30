import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box3, MathUtils, Vector3 } from "three";

const MODEL_PATH = "/models/vegetables.glb";
const SHADOWS_ENABLED = false;

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
  if (typeof window === "undefined") return { dpr: 1.25, shadows: SHADOWS_ENABLED, reducedMotion: false };

  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isWeakDevice = memory <= 3 || cores <= 4 || (isSmallScreen && (memory <= 4 || cores <= 6)) || prefersReducedMotion;
  const maxDpr = isTouch || isSmallScreen ? 1.15 : 1.5;

  return {
    dpr: isWeakDevice ? 1 : Math.min(window.devicePixelRatio || 1, maxDpr),
    shadows: SHADOWS_ENABLED,
    reducedMotion: prefersReducedMotion,
  };
}

function VegetableScene({ quality, pointerRef, active }) {
  const groupRef = useRef(null);
  const motionRef = useRef({ scroll: 0, x: 0, y: 0, depth: 0, section: 0 });
  const { scene } = useGLTF(MODEL_PATH);

  const { model, scale } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
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
    };
  }, [scene]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const target = motionRef.current;
    const hero = document.querySelector(".hero");
    let raf = 0;
    let quickSetters = null;

    if (!quality.reducedMotion) {
      quickSetters = {
        scroll: gsap.quickTo(target, "scroll", { duration: 0.85, ease: "power3.out" }),
        x: gsap.quickTo(target, "x", { duration: 0.85, ease: "power3.out" }),
        y: gsap.quickTo(target, "y", { duration: 0.85, ease: "power3.out" }),
        depth: gsap.quickTo(target, "depth", { duration: 0.85, ease: "power3.out" }),
        section: gsap.quickTo(target, "section", { duration: 0.85, ease: "power3.out" }),
      };
    }

    const measureScroll = () => {
      raf = 0;
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const rawProgress = MathUtils.clamp(window.scrollY / scrollable, 0, 1);
      const heroRect = hero?.getBoundingClientRect();
      const heroProgress = heroRect
        ? MathUtils.clamp(-heroRect.top / Math.max(heroRect.height - window.innerHeight * 0.25, 1), 0, 1)
        : MathUtils.clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1);

      const values = {
        scroll: rawProgress,
        x: (heroProgress - 0.5) * 0.72,
        y: heroProgress * -0.18,
        depth: heroProgress * 0.75,
        section: heroProgress,
      };

      if (quickSetters) {
        quickSetters.scroll(values.scroll);
        quickSetters.x(values.x);
        quickSetters.y(values.y);
        quickSetters.depth(values.depth);
        quickSetters.section(values.section);
      } else {
        Object.assign(target, values);
      }
    };

    const updateFromScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measureScroll);
    };

    measureScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      gsap.killTweensOf(target);
    };
  }, [quality.reducedMotion]);

  useFrame((state, delta) => {
    if (!groupRef.current || !active) return;

    const elapsed = state.clock.elapsedTime;
    const motion = motionRef.current;
    const pointer = pointerRef.current;
    const autoSpeed = quality.reducedMotion ? 0 : 0.11;
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
    </>
  );
}

useGLTF.preload(MODEL_PATH);

export default function VegetableModel() {
  const [quality, setQuality] = useState(getInitialQuality);
  const [webGLAvailable] = useState(canUseWebGL);
  const [isVisible, setIsVisible] = useState(true);
  const shellRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, force: 0 });
  const pointerTweensRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const shell = shellRef.current;
    if (!shell) return undefined;

    const hero = shell.closest(".hero");
    let raf = 0;
    const quickY = gsap.quickTo(shell, "y", { duration: 0.8, ease: "power3.out", overwrite: "auto" });

    const updateTravel = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!hero) return;

        const shellRect = shell.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const progress = MathUtils.clamp(-heroRect.top / Math.max(heroRect.height - window.innerHeight * 0.25, 1), 0, 1);
        const bottomLimit = Math.max(heroRect.bottom - shellRect.bottom - 28, 0);

        quickY(bottomLimit * progress);
      });
    };

    updateTravel();
    window.addEventListener("scroll", updateTravel, { passive: true });
    window.addEventListener("resize", updateTravel);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateTravel);
      window.removeEventListener("resize", updateTravel);
      gsap.killTweensOf(shell);
    };
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "160px 0px 160px 0px", threshold: 0 },
    );

    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const pointer = pointerRef.current;
    pointerTweensRef.current = {
      x: gsap.quickTo(pointer, "x", { duration: 0.34, ease: "power3.out", overwrite: "auto" }),
      y: gsap.quickTo(pointer, "y", { duration: 0.34, ease: "power3.out", overwrite: "auto" }),
      force: gsap.quickTo(pointer, "force", { duration: 0.34, ease: "power3.out", overwrite: "auto" }),
    };

    return () => {
      gsap.killTweensOf(pointer);
      pointerTweensRef.current = null;
    };
  }, []);

  const moveFromPointer = (event) => {
    const shell = shellRef.current;
    if (!shell) return;

    const rect = shell.getBoundingClientRect();
    const x = MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    const force = event.pointerType === "touch" ? 1 : 0.72;

    const setters = pointerTweensRef.current;
    if (setters) {
      setters.x(x);
      setters.y(y);
      setters.force(force);
    } else {
      Object.assign(pointerRef.current, { x, y, force });
    }
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
        dpr={quality.dpr}
        frameloop={isVisible && !quality.reducedMotion ? "always" : "demand"}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: true,
        }}
        shadows={false}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = false;
        }}
      >
        <PerformanceMonitor
          onDecline={() => setQuality((current) => ({ ...current, dpr: 1, shadows: SHADOWS_ENABLED }))}
          onIncline={() => setQuality((current) => ({ ...current, dpr: Math.min(1.5, current.dpr + 0.1), shadows: SHADOWS_ENABLED }))}
        />
        <ambientLight intensity={1.25} />
        <directionalLight
          position={[3.5, 5, 4.5]}
          intensity={2.15}
        />
        <spotLight position={[-4, 3, 3]} intensity={1.4} angle={0.45} penumbra={1} />
        <Suspense fallback={null}>
          <VegetableScene quality={quality} pointerRef={pointerRef} active={isVisible && !quality.reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
