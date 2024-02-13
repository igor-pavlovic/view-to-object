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
    <div className="App">
      <button onClick={() => pickFrom()}>From</button>
      <button onClick={() => pickTo()}>To</button>
      <button onClick={() => intersect()}>Intersect</button>
      <Scene />
    </div>
  );
}

export default App;
