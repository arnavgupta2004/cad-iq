import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function fileExtension(file) {
  const parts = file?.name?.toLowerCase().split(".") || [];
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

function CameraFrame({ geometry, camera, controls }) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) {
    return;
  }

  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 1);
  camera.position.set(maxDim * 1.6, maxDim * 1.1, maxDim * 1.6);
  camera.near = 0.1;
  camera.far = maxDim * 20;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}

export default function ModelViewer({ file }) {
  const mountRef = useRef(null);
  const extension = fileExtension(file);
  const imageUrl = useMemo(() => {
    if (!file || ![".png", ".jpg", ".jpeg"].includes(extension)) {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file, extension]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!file || extension !== ".stl" || !mountRef.current) {
      return undefined;
    }

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0f14");

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const ambientLight = new THREE.AmbientLight("#ffffff", 1.8);
    const keyLight = new THREE.DirectionalLight("#ffffff", 1.4);
    keyLight.position.set(6, 10, 8);
    const fillLight = new THREE.DirectionalLight("#7dd3fc", 0.7);
    fillLight.position.set(-8, 4, -6);
    scene.add(ambientLight, keyLight, fillLight);

    const material = new THREE.MeshStandardMaterial({
      color: "#c9d1d9",
      metalness: 0.15,
      roughness: 0.72,
    });

    const loader = new STLLoader();
    const objectUrl = URL.createObjectURL(file);
    let mesh;
    let animationFrame;

    loader.load(
      objectUrl,
      (geometry) => {
        CameraFrame({ geometry, camera, controls });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const renderFrame = () => {
          animationFrame = window.requestAnimationFrame(renderFrame);
          controls.update();
          renderer.render(scene, camera);
        };

        renderFrame();
      },
      undefined,
      () => {
        URL.revokeObjectURL(objectUrl);
      }
    );

    const handleResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) {
        return;
      }
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrame);
      URL.revokeObjectURL(objectUrl);
      controls.dispose();
      if (mesh) {
        mesh.geometry.dispose();
      }
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [file, extension]);

  let content = (
    <div className="flex h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-[#0b0f14] text-slate-500">
      No model loaded
    </div>
  );

  if (imageUrl) {
    content = (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14]">
        <img src={imageUrl} alt={file.name} className="h-[360px] w-full object-contain" />
      </div>
    );
  } else if (file && extension === ".stl") {
    content = <div ref={mountRef} className="h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14]" />;
  } else if (file) {
    content = (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0b0f14] px-6 text-center text-slate-400">
        <p className="text-lg font-medium text-white">Preview unavailable</p>
        <p className="mt-3 max-w-md text-sm leading-6">
          3D preview is available for STL files, and inline preview is available for PNG and JPG uploads.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">Model Viewer</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Geometry Preview</h2>
        </div>
        <p className="text-sm text-slate-400">Rotate, zoom, and pan STL files directly in the browser.</p>
      </div>
      {content}
    </section>
  );
}
