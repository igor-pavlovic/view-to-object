import React, { useEffect } from "react";
import "./App.css";
import Scene from "./components/Scene";
import { useGlobalStore } from "./store/global";

function App() {
  const store = useGlobalStore();

  useEffect(() => {
    store.createSubscription();
    store.createCameraSubscription();
  });

  return (
    <div className="App">
      <Scene />
    </div>
  );
}

export default App;
