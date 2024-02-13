import { useEffect, useRef, useContext } from "react";
import * as THREE from 'three';
import { useGlobalStore } from "../store/global";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function Scene() {
  const refContainer = useRef(null);
  const store = useGlobalStore()

  useEffect(() => {
    var scene = new THREE.Scene();
    store.setScene(scene)

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    camera.position.z = 1;

    store.setCamera(camera)

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // white, half intensity
    scene.add(directionalLight);

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );
    // use ref as a mount point of the Three.js scene instead of the document.body

    //@ts-ignore
    refContainer.current && refContainer.current.children.length < 1 && refContainer.current.appendChild(renderer.domElement);

    var animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
  }, []);

  return (
    <div ref={refContainer} />
  );
}

export default Scene