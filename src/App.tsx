import React, { useEffect } from "react";
import "./App.css";
import { Forma } from "forma-embedded-view-sdk/auto";
import { createSubscription } from "./store/subscription";
import Scene from "./Scene"

function App() {
  useEffect(() => {
    createSubscription();
  });

  return (
    <div className="App">
      <Scene />
    </div>
  );
}

export default App;
