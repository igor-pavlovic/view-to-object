import { useEffect, useRef, useContext } from "react";
import * as THREE from 'three';
import { useGlobalStore } from "../store/global";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function Scene() {
  const refContainer = useRef(null);
  const store = useGlobalStore()

  useEffect(() => {
    store.createScene()
    store.createCamera()

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );
    // use ref as a mount point of the Three.js scene instead of the document.body

    //@ts-ignore
    refContainer.current && refContainer.current.children.length < 1 && refContainer.current.appendChild(renderer.domElement);

    var animate = function () {
      requestAnimationFrame(animate);
      renderer.render(store.scene, store.camera);
    };

    animate();
  }, []);

  return (
    <div ref={refContainer} />
  );
}

export default Scene