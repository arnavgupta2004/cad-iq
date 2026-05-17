import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { isStlFile } from "../lib/validateStl";

function frameGeometry({ geometry, camera, controls }) {
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
  camera.position.set(maxDim * 1.6, maxDim * 1.15, maxDim * 1.6);
  camera.near = 0.1;
  camera.far = maxDim * 20;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}

export default function ModelViewer({ file }) {
  const mountRef = useRef(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoadError(null);
  }, [file]);

  useEffect(() => {
    if (!file || !isStlFile(file) || !mountRef.current) {
      return undefined;
    }

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f1117");

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.AmbientLight("#ffffff", 1.5));
    const keyLight = new THREE.DirectionalLight("#ffffff", 1.1);
    keyLight.position.set(8, 10, 6);
    const fillLight = new THREE.DirectionalLight("#4f8ef7", 0.7);
    fillLight.position.set(-8, 4, -6);
    scene.add(keyLight, fillLight);

    const material = new THREE.MeshStandardMaterial({
      color: "#c7ccd6",
      metalness: 0.12,
      roughness: 0.75,
    });

    const loader = new STLLoader();
    const objectUrl = URL.createObjectURL(file);
    let mesh;
    let animationFrame;

    loader.load(
      objectUrl,
      (geometry) => {
        frameGeometry({ geometry, camera, controls });
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
        setLoadError("Could not render this STL in the browser preview.");
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
  }, [file]);

  let content = (
    <div className="flex h-[360px] items-center justify-center rounded-3xl border border-[#4f8ef7]/20 bg-[#0f1117] text-[#9ca3af]">
      Upload an STL file to preview geometry here.
    </div>
  );

  if (loadError) {
    content = (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-3xl border border-red-500/30 bg-[#0f1117] px-6 text-center">
        <p className="text-lg font-medium text-white">Preview failed</p>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#9ca3af]">{loadError}</p>
      </div>
    );
  } else if (file && isStlFile(file)) {
    content = <div ref={mountRef} className="h-[360px] overflow-hidden rounded-3xl border border-[#4f8ef7]/20 bg-[#0f1117]" />;
  }

  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#4f8ef7]">Model Viewer</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Geometry Preview</h2>
        </div>
        <p className="text-sm text-[#9ca3af]">Rotate, zoom, and pan the uploaded STL mesh.</p>
      </div>
      {content}
    </section>
  );
}
