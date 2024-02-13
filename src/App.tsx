import React, { useEffect } from "react";
import "./App.css";
import { createSubscription } from "./store/subscription";
import Scene from "./components/Scene";
import { useGlobalStore } from "./store/global";

function App() {
  const store = useGlobalStore();
  console.log(store);

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
