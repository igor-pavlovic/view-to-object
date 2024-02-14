import React, { useEffect, useState } from "react";
import "./App.css";
import Scene from "./components/Scene";
import { useGlobalStore } from "./store/global";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";

function App() {
  const store = useGlobalStore();
  const [from, setFrom] = useState<THREE.Vector3>(new THREE.Vector3());
  const [to, setTo] = useState<THREE.Vector3>(new THREE.Vector3());
  const [samplePoint, setSamplePoint] = useState<number>(100);
  const [toTarget, setToTarget] = useState<any>();

  const intersect = () => {
    store.checkIntersection(from, to)
  }

  const intersectSphere = () => {
    store.sphereCaster(from)
  }

  const intersectSelection = () => {
    store.checkSelectionVisibility(from, samplePoint)
  }

  const pickFrom = () => {
    Forma.designTool.getPoint().then((point) => {
      setFrom(new THREE.Vector3(point?.x, point?.y, point?.z))
    });
  }

  const pickTo = () => {
    Forma.designTool.getPoint().then((point) => {
      setTo(new THREE.Vector3(point?.x, point?.y, point?.z))
    });
  }

  const pickToTarget = () => {
    const result: any = {}
    Forma.selection.getSelection().then(async (paths) => {
      console.log("paths", paths)
      paths.forEach(async path => {
        const pathTriangles = await Forma.geometry.getTriangles({ path })
        result[`${path}`] = pathTriangles
        const vertices = new Float32Array(pathTriangles);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3)
        );

        const mesh = new THREE.Mesh(geometry, store.material);
        const raycast = new THREE.Raycaster();
        const intersections = []
        mesh.raycast(raycast, intersections)
        console.log("intersections", intersections)
      })
      setToTarget(result)
      console.log("Target triangle paths", result)

    });
  }

  return (
    <div className="app" >
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <weave-button onClick={() => pickFrom()}>
          {/* <weave-dot slot="icon"></weave-dot> */}
          From
        </weave-button>
        <weave-button onClick={() => pickTo()}>To</weave-button>
        <weave-button onClick={() => pickToTarget()}>To Target</weave-button>
        <weave-button onClick={() => intersect()}>Intersect</weave-button>
        <weave-button onClick={() => intersectSelection()}>Intersect selection (just select From point and wait up to minute)</weave-button>
        <weave-button onClick={() => intersectSphere()}>Intersect sphere (just select From point and wait up to minute)</weave-button>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span>Number of points to sample</span>
          <weave-inputslider style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <weave-slider value={samplePoint} step={10} min={100} max={1000} label="Sample points" variant="continuous" onInput={(e) => { console.log(e); setSamplePoint(e.nativeEvent.target.slider.value) }} />
            <weave-input id="samplePoint" value={samplePoint} step={10} min={100} max={1000} variant="outlined" onInput={(e) => { setSamplePoint(e.nativeEvent.target.value) }} />
          </weave-inputslider>
        </div>

      </div>
      <Scene />
    </div>
  );
}

export default App;
