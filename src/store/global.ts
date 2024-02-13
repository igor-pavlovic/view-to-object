import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";

class GlobalStore {
  triangles = [];
  scene = null;
  camera: THREE.Camera = null;
  raycaster = new THREE.Raycaster();

  setTriangles(triangles: Float32Array[]) {
    triangles.forEach((triangle) => {
      this.triangles.push(triangle);
    });
  }

  createScene() {
    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // white, half intensity
    this.scene.add(directionalLight);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    this.camera.position.z = 1;
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      this.clearScene();

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(triangles);
        console.log(vertices);

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

        this.scene.add(mesh);
      });
    });

    return unsubscribe;
  }

  async createCameraSubscription() {
    setCameraState(await Forma.camera.getCurrent());

    const { unsubscribe } = await Forma.camera.subscribe((cameraState) => {
      console.log("Camera subscription", cameraState);
      setCameraState(cameraState);
    });

    function setCameraState(cameraState) {
      if (this.camera) {
        this.camera.position.setX(cameraState.position.x);
        this.camera.position.setY(cameraState.position.y);
        this.camera.position.setZ(cameraState.position.z);

        this.camera.lookAt(
          new THREE.Vector3(
            cameraState.target.x,
            cameraState.target.y,
            cameraState.target.z
          )
        );
      }
    }
    return unsubscribe;
  }

  clearScene() {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const obj = this.scene.children[i];
      this.scene.remove(obj);
    }
  }

  addGeometryToScene(geometry) {
    this.scene.add(geometry);
  }

  // checkIntersection(origin: THREE.Vector3, target: THREE.BufferGeometry) {
  //   this.raycaster.set(origin);
  //   this.raycaster.intersectObject(this.scene)
  // }
}

const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}
