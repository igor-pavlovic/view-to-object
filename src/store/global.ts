import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";

class GlobalStore {
  triangles = [];
  scene = null;
  camera: THREE.Camera = null;
  raycaster = new THREE.Raycaster();
  selectedGeometry = []

  setTriangles(triangles: Float32Array[]) {
    triangles.forEach((triangle) => {
      this.triangles.push(triangle);
    });
  }

  createScene() {
    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // soft white light
    ambientLight.position.set(2000, 2000, 1000);
    ambientLight.castShadow = true;
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // white, half intensity
    directionalLight.position.set(2000, 2000, 1000);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
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

  async getAllGeometry() {
    const allGeometry = await Forma.geometry.getTriangles()

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(allGeometry);

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh)
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      this.clearScene();

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(triangles);

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

        this.selectedGeometry.push(mesh)
        this.scene.add(mesh)
      });
    });

    return unsubscribe;
  }

  async createCameraSubscription() {
    const setCameraState = (cameraState) => {
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

    setCameraState(await Forma.camera.getCurrent());

    const { unsubscribe } = await Forma.camera.subscribe((cameraState) => {
      console.log("Camera subscription", cameraState);
      setCameraState(cameraState);
    });


    return unsubscribe;
  }

  clearScene() {
    this.selectedGeometry.forEach((geometry) => {
      this.scene.remove(geometry);
    })
  }

  checkIntersection(origin: THREE.Vector3, target: THREE.Vector3) {
    // const originTemp = new THREE.Vector3(0, 0, 0);
    // const targetTemp = this.scene.children[0]

    const directionVector = new THREE.Vector3().subVectors(target, origin).normalize();
    this.raycaster.set(origin, directionVector);

    const intersected = this.raycaster.intersectObjects(this.scene.children)

    console.log("Intersecting: ", intersected)

    this.clearScene()
    intersected.forEach((intersection) => {
      this.scene.add(intersection)
    })
  }
}

const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}
