import React, { useEffect } from "react";
import "./App.css";
import { Forma } from "forma-embedded-view-sdk/auto";
import Scene from "./Scene";

function App() {
  // useEffect(() => {
  //   Forma.geometry
  //     .getPathsByCategory({ category: "buildings" })
  //     .then((paths) => { console.log(paths.length) })
  // }, [])

  return (
    <div className="App">
      <Scene />
    </div>
  );
}

export default App;
