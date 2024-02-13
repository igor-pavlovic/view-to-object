import React, { useEffect, useState } from "react";
import "./App.css";
import Scene from "./components/Scene";
import { useGlobalStore } from "./store/global";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Vec3 } from "forma-embedded-view-sdk/dist/internal/scene/design-tool";


function App() {
  const store = useGlobalStore();
  const [from, setFrom] = useState<Vec3>();
  const [to, setTo] = useState<Vec3>();

  useEffect(() => {
    // Fetch all paths to buildings in the current proposal.
    // Forma.geometry.getPathsByCategory({ category: "generic" }).then((paths) => { console.log('buildings ', paths) });
    // Forma.geometry.getPathsByCategory({ category: "terrain" }).then((paths) => {
    //   console.log('terrain ', paths)
    // });


    store.createSubscription();
    store.createCameraSubscription();
    store.getAllGeometry()
  });

  const intersect = () => {
    store.checkIntersection(from as THREE.Vector3, to as THREE.Vector3)
  }

  const pickFrom = () => {
    Forma.designTool.getPoint().then((point) => {
      console.log(point)
      setFrom(new THREE.Vector3(point.x, point.y, point.z))
    });
  }

  const pickTo = () => {
    Forma.designTool.getPoint().then((point) => {
      console.log(point)
      setTo(new THREE.Vector3(point.x, point.y, point.z))
    });
  }

  return (
    <div className="app" >
      <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={() => pickFrom()}>From</button>
      <button onClick={() => pickTo()}>To</button>
      <button onClick={() => intersect()}>Intersect</button>
      </div>
      <Scene />
    </div>
  );
}

export default App;
