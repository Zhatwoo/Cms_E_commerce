'use client';

import { useEffect, useRef } from 'react';
import type { WebGLRenderer } from 'three';
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const GLOBE_DATA_URL = '/globe-data-min.json';

const ARC_LAND_INTERVAL_MS = 2500;
const MAX_LANDINGS = 10;
const LANDING_SPREAD_DEG = 1.2;

const DUMMY_TESTIMONIALS = [
  { quote: 'Great platform.', title: 'Jane D.', description: 'CEO' },
  { quote: 'Smooth onboarding.', title: 'Mark T.', description: 'Founder' },
  { quote: 'Go global.', title: 'Sarah L.', description: 'Director' },
  { quote: 'Best decision.', title: 'Alex K.', description: 'Ops' },
  { quote: 'Reliable.', title: 'Chris M.', description: 'CTO' },
  { quote: 'Customers love it.', title: 'Pat R.', description: 'Product' },
  { quote: 'Fast and easy.', title: 'Sam W.', description: 'Manager' },
  { quote: 'Highly recommend.', title: 'Jordan P.', description: 'Lead' },
];

type LandingDatum = {
  id: number;
  lat: number;
  lng: number;
  quote: string;
  title: string;
  description: string;
};

function createTestimonialCardEl(d: LandingDatum): HTMLElement {
  const el = document.createElement('div');
  el.className = 'globe-testimonial-card';
  el.style.cssText = [
    'width:160px;min-width:160px;max-width:160px;',
    'padding:14px;border-radius:16px;',
    'background:rgba(7,8,18,0.95);border:1px solid rgba(255,255,255,0.2);',
    'color:#fff;font-size:18px;line-height:1.3;text-align:left;',
    'box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;',
    'overflow:hidden;display:flex;flex-direction:column;gap:6px;',
    'transition:opacity 0.2s ease;',
  ].join(' ');
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  el.innerHTML = [
    `<p style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escape(d.quote)}">&ldquo;${escape(d.quote)}&rdquo;</p>`,
    `<p style="margin:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escape(d.title)}</p>`,
    `<p style="margin:0;opacity:0.85;font-size:16px;">${escape(d.description)}</p>`,
  ].join('');
  return el;
}

interface GlobeInstance {
  hexPolygonsData: (data: unknown[]) => GlobeInstance;
  hexPolygonResolution: (n: number) => GlobeInstance;
  hexPolygonMargin: (n: number) => GlobeInstance;
  showAtmosphere: (show: boolean) => GlobeInstance;
  atmosphereColor: (c: string) => GlobeInstance;
  atmosphereAltitude: (n: number) => GlobeInstance;
  hexPolygonColor: (fn: (e: { properties?: { ISO_A3?: string } }) => string) => GlobeInstance;
  arcsData: (data: unknown[]) => GlobeInstance;
  arcColor: (fn: () => string) => GlobeInstance;
  arcAltitude: (fn: (e: { arcAlt?: number }) => number) => GlobeInstance;
  arcStroke: (n: number) => GlobeInstance;
  arcDashLength: (n: number) => GlobeInstance;
  arcDashGap: (n: number) => GlobeInstance;
  arcDashAnimateTime: (n: number) => GlobeInstance;
  arcsTransitionDuration: (n: number) => GlobeInstance;
  arcDashInitialGap: (fn: (e: { order?: number }) => number) => GlobeInstance;
  rotateY: (n: number) => GlobeInstance;
  rotateZ: (n: number) => GlobeInstance;
  globeMaterial: () => { color: { setHex?: (n: number) => void }; emissive: { setHex?: (n: number) => void }; emissiveIntensity: number; shininess: number };
  htmlElementsData: (data: LandingDatum[]) => GlobeInstance;
  htmlLat: (fn: (d: LandingDatum) => number) => GlobeInstance;
  htmlLng: (fn: (d: LandingDatum) => number) => GlobeInstance;
  htmlAltitude: (n: number) => GlobeInstance;
  htmlElement: (fn: (d: LandingDatum) => HTMLElement) => GlobeInstance;
  htmlElementVisibilityModifier: (fn: (el: HTMLElement, isVisible: boolean) => void) => GlobeInstance;
  rendererSize: (v: { x: number; y: number }) => GlobeInstance;
  setPointOfView: (camera: unknown) => void;
}

// Simple arcs for globe (inspired by github-globe-main)
const ARCS = [
  { startLat: 14.5995, startLng: 120.9842, endLat: 35.6762, endLng: 139.6503, order: 1 },
  { startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, order: 2 },
  { startLat: -33.8688, startLng: 151.2093, endLat: 34.0522, endLng: -118.2437, order: 3 },
  { startLat: 1.3521, startLng: 103.8198, endLat: 25.2048, endLng: 55.2708, order: 4 },
  { startLat: 55.7558, startLng: 37.6173, endLat: 39.9042, endLng: 116.4074, order: 5 },
  { startLat: 41.9028, startLng: 12.4964, endLat: 48.8566, endLng: 2.3522, order: 6 },
  { startLat: 28.6139, startLng: 77.209, endLat: 24.8607, endLng: 67.0011, order: 7 },
  { startLat: 22.3193, startLng: 114.1694, endLat: 37.5665, endLng: 126.978, order: 8 },
];

type GlobeData = { type?: string; features?: unknown[] };

export function Globe3D({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId: number;
    let renderer: WebGLRenderer;
    let css2dRenderer: CSS2DRenderer;

    const init = async () => {
      const [THREE, ThreeGlobe, controlsModule, css2dModule] = await Promise.all([
        import('three'),
        import('three-globe'),
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('three/examples/jsm/renderers/CSS2DRenderer.js'),
      ]);

      const { OrbitControls } = controlsModule;
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height) || 400;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050507);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
      camera.position.z = 360;
      camera.position.x = 0;
      camera.position.y = 0;

      scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));
      const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dLight.position.set(-800, 2000, 400);
      camera.add(dLight);
      const dLight1 = new THREE.DirectionalLight(0x7982f6, 1);
      dLight1.position.set(-200, 500, 200);
      camera.add(dLight1);
      const dLight2 = new THREE.PointLight(0x8566cc, 0.5);
      dLight2.position.set(-200, 500, 200);
      camera.add(dLight2);
      scene.add(camera);

      scene.fog = new THREE.Fog(0x535ef3, 400, 2000);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(size, size);
      const canvas = renderer.domElement as HTMLCanvasElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(renderer.domElement);

      const { CSS2DRenderer: CSS2DRendererClass } = css2dModule;
      css2dRenderer = new CSS2DRendererClass();
      css2dRenderer.setSize(size, size);
      (css2dRenderer.domElement as HTMLElement).style.position = 'absolute';
      (css2dRenderer.domElement as HTMLElement).style.top = '0';
      (css2dRenderer.domElement as HTMLElement).style.left = '0';
      (css2dRenderer.domElement as HTMLElement).style.width = '100%';
      (css2dRenderer.domElement as HTMLElement).style.height = '100%';
      (css2dRenderer.domElement as HTMLElement).style.pointerEvents = 'none';
      container.appendChild(css2dRenderer.domElement);

      const res = await fetch(GLOBE_DATA_URL);
      const data = (await res.json()) as GlobeData;
      const features = data?.features ?? [];

      const GlobeClass = (ThreeGlobe as unknown as { default: new (opts?: object) => GlobeInstance }).default;
      const globe: GlobeInstance = new GlobeClass({
        waitForGlobeReady: true,
        animateIn: true,
      });

      globe
        .hexPolygonsData(features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor('#3a228a')
        .atmosphereAltitude(0.25)
        .hexPolygonColor((e: { properties?: { ISO_A3?: string } }) => {
          if (
            ['KGZ', 'KOR', 'THA', 'RUS', 'UZB', 'IDN', 'KAZ', 'MYS'].includes(
              e.properties?.ISO_A3 ?? ''
            )
          ) {
            return 'rgba(255,255,255, 1)';
          }
          return 'rgba(255,255,255, 0.7)';
        });

      globe.arcsData(ARCS)
        .arcColor(() => '#ffffff')
        .arcAltitude((e: { arcAlt?: number }) => (e as { arcAlt?: number }).arcAlt ?? 0.2)
        .arcStroke(0.5)
        .arcDashLength(0.9)
        .arcDashGap(4)
        .arcDashAnimateTime(1000)
        .arcsTransitionDuration(1000)
        .arcDashInitialGap((e: { order?: number }) => (e as { order?: number }).order ?? 0);

      const landings: LandingDatum[] = [];
      let arcLandIndex = 0;
      let landingId = 0;
      const spread = () => (Math.random() - 0.5) * 2 * LANDING_SPREAD_DEG;

      globe
        .htmlElementsData(landings)
        .htmlLat((d) => d.lat)
        .htmlLng((d) => d.lng)
        .htmlAltitude(0.015)
        .htmlElement(createTestimonialCardEl)
        .htmlElementVisibilityModifier((el, isVisible) => {
          el.style.opacity = isVisible ? '1' : '0';
          el.style.visibility = isVisible ? 'visible' : 'hidden';
        });

      globe.rotateY(-Math.PI * (5 / 9));
      globe.rotateZ(-Math.PI / 6);

      const globeMaterial = globe.globeMaterial();
      globeMaterial.color = new THREE.Color(0x3a228a);
      globeMaterial.emissive = new THREE.Color(0x220038);
      globeMaterial.emissiveIntensity = 0.1;
      globeMaterial.shininess = 0.7;

      scene.add(globe as never);

      globe.rendererSize(new THREE.Vector2(size, size));
      globe.setPointOfView(camera);

      const arcLandInterval = setInterval(() => {
        const arc = ARCS[arcLandIndex % ARCS.length];
        const testimonial = DUMMY_TESTIMONIALS[arcLandIndex % DUMMY_TESTIMONIALS.length];
        landings.push({
          id: landingId++,
          lat: arc.endLat + spread(),
          lng: arc.endLng + spread(),
          quote: testimonial.quote,
          title: testimonial.title,
          description: testimonial.description,
        });
        if (landings.length > MAX_LANDINGS) landings.shift();
        globe.htmlElementsData([...landings]);
        arcLandIndex++;
      }, ARC_LAND_INTERVAL_MS);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 180;
      controls.maxDistance = 450;
      controls.rotateSpeed = 0.8;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.minPolarAngle = Math.PI / 3.5;
      controls.maxPolarAngle = Math.PI - Math.PI / 3;

      const onResize = () => {
        if (!container.parentElement) return;
        const r = container.getBoundingClientRect();
        const s = Math.min(r.width, r.height) || 400;
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        renderer.setSize(s, s);
        css2dRenderer.setSize(s, s);
        globe.rendererSize(new THREE.Vector2(s, s));
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();
        globe.setPointOfView(camera);
        renderer.render(scene, camera);
        css2dRenderer.render(scene, camera);
      };
      animate();

      // First card after a short delay
      setTimeout(() => {
        const arc = ARCS[0];
        const t = DUMMY_TESTIMONIALS[0];
        landings.push({
          id: landingId++,
          lat: arc.endLat + spread(),
          lng: arc.endLng + spread(),
          quote: t.quote,
          title: t.title,
          description: t.description,
        });
        globe.htmlElementsData([...landings]);
        arcLandIndex++;
      }, 600);

      return () => {
        clearInterval(arcLandInterval);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(frameId);
        controls.dispose();
        renderer.dispose();
        if (typeof (css2dRenderer as unknown as { dispose?: () => void }).dispose === 'function') {
          (css2dRenderer as unknown as { dispose: () => void }).dispose();
        }
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        if (css2dRenderer?.domElement && container.contains(css2dRenderer.domElement)) {
          container.removeChild(css2dRenderer.domElement);
        }
      };
    };

    let cleanup: (() => void) | void;
    init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 256,
        aspectRatio: '1',
      }}
      aria-hidden
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 256, aspectRatio: '1' }}
        aria-hidden
      />
    </div>
  );
}
