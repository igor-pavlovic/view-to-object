import { useContext, createContext } from "react";

class GlobalStore {
  triangles = [];
  constructor() {
    this.triangles = [];
  }
  setTriangles() {}
}

const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}
