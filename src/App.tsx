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

  useEffect(() => {
    // Fetch all paths to buildings in the current proposal.
    // Forma.geometry.getPathsByCategory({ category: "generic" }).then((paths) => { console.log('buildings ', paths) });
    // Forma.geometry.getPathsByCategory({ category: "terrain" }).then((paths) => {
    //   console.log('terrain ', paths)
    // }); 
  });

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
      console.log(point)
      setFrom(new THREE.Vector3(point?.x, point?.y, point?.z))
    });
  }

  const pickTo = () => {
    Forma.designTool.getPoint().then((point) => {
      console.log(point)
      setTo(new THREE.Vector3(point?.x, point?.y, point?.z))
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
