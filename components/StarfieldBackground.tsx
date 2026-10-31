'use client';

import { useEffect, useRef } from 'react';
import type * as ThreeModule from 'three';

/**
 * Site-wide 3D WebGL starfield rendered with Three.js point sprites.
 * Faithfully mirrors the DevHQ starfield: a custom radial star texture, slow
 * auto-rotation, and mouse-driven parallax so the stars steer toward the cursor.
 * Performance guards: three is dynamically imported, devicePixelRatio is capped
 * at 2, the star count is reduced on small screens, and the render loop pauses
 * while the tab is hidden.
 *
 * The wrapper carries its own dark, Odoo-tinted "night sky" gradient. The stars
 * are white with additive blending, so they need a dark backdrop to be visible
 * on top of the otherwise light AssetFlow theme.
 */
export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: ThreeModule.WebGLRenderer | undefined;
    let scene: ThreeModule.Scene | undefined;
    let camera: ThreeModule.PerspectiveCamera | undefined;
    let stars: ThreeModule.Points | undefined;
    let geometry: ThreeModule.BufferGeometry | undefined;
    let material: ThreeModule.PointsMaterial | undefined;
    let starTexture: ThreeModule.Texture | undefined;

    let frameId = 0;
    let paused = false;
    let disposed = false;

    // Cursor offset from the viewport centre (scaled down), used to steer rotation.
    let mouseX = 0;
    let mouseY = 0;

    const createStarTexture = (THREE: typeof ThreeModule) => {
      const tex = document.createElement('canvas');
      tex.width = 32;
      tex.height = 32;
      const ctx = tex.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(tex);

      const center = 16;
      const radius = 14;
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      return new THREE.CanvasTexture(tex);
    };

    const renderFrame = () => {
      if (renderer && scene && camera) renderer.render(scene, camera);
    };

    const animate = () => {
      if (disposed || paused || !stars) return;
      frameId = requestAnimationFrame(animate);

      // Slow constant drift, steered by the cursor for an interactive parallax.
      stars.rotation.y += 0.0001 + mouseX * 0.5;
      stars.rotation.x += 0.00005 + mouseY * 0.5;
      renderFrame();
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.0001;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.0001;
    };

    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderFrame();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(frameId);
      } else if (paused) {
        paused = false;
        animate();
      }
    };

    const init = async () => {
      const THREE = await import('three');
      if (disposed) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 20;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Fewer stars on small screens keeps mobile GPUs comfortable.
      const starCount = window.innerWidth < 768 ? 1600 : 3200;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      starTexture = createStarTexture(THREE);

      material = new THREE.PointsMaterial({
        size: 0.15,
        map: starTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false,
        // Additive blending makes the stars glow against the dark sky.
        blending: THREE.AdditiveBlending,
      });

      stars = new THREE.Points(geometry, material);
      scene.add(stars);

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibilityChange);

      animate();
    };

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      geometry?.dispose();
      material?.dispose();
      starTexture?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(1200px 700px at 50% -10%, rgba(113, 75, 103, 0.35), transparent 60%), #06010f',
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
