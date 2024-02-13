import React, { useEffect } from "react";
import logo from "./logo.svg";
import * as Three from "three";
import "./App.css";
import { getFormaToken } from "./store/oauth";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CallbackPage from "./components/CallbackPage";
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
