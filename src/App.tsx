import React, { useEffect } from "react";
import logo from "./logo.svg";
import * as Three from "three";
import "./App.css";
import { getFormaToken } from "./store/oauth";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CallbackPage from "./components/CallbackPage";
import { Forma } from "forma-embedded-view-sdk/auto";
import { createSubscription } from "./store/subscription";

function App() {
  useEffect(() => {
    createSubscription();
  });

  return (
    <div className="App">
      <header className="App-header"></header>
    </div>
  );
}

export default App;
