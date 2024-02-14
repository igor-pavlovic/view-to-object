import { useEffect, useRef, useContext } from "react";
import * as THREE from "three";
import { useGlobalStore } from "../store/global";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function Scene() {
  const refContainer = useRef(null);
  const store = useGlobalStore();

  useEffect(() => {
    console.log("useEffect Scene");
    store.createScene();
    store.createCamera();
    store.getAllGeometry()
    store.createSubscription();
    store.createCameraSubscription();

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow mapping
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //@ts-ignore
    refContainer.current && refContainer.current?.children.length < 1 && refContainer.current.appendChild(renderer.domElement);

    var animate = function () {
      requestAnimationFrame(animate);
      renderer.render(store.scene, store.camera);
    };

    // animate();
  }, []);

  return <div ref={refContainer} className="scene" />;
}

export default Scene;
