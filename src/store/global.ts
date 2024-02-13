import { useContext, createContext } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Forma } from "forma-embedded-view-sdk/auto";


class GlobalStore {
  triangles = [];
  scene = null
  camera = null

  setTriangles(triangles: Float32Array[]) {
    triangles.forEach((triangle) => {
      this.triangles.push(triangle)
    })
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene
  }

  setCamera(camera: THREE.Camera) {
    this.camera = camera
  }

  addGeometryToScene(geometry) {
    this.scene.add(geometry)

    this.camera.lookAt(this.scene.position);
    console.log('added geometry to scene')
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      console.log("subscription callback", paths);
      console.log("lenght of paths", paths.length)

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(triangles);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);


        this.addGeometryToScene(mesh)
      });
    });

    return unsubscribe;
  };

}

const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}
