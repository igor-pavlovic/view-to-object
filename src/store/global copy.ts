import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

class GlobalStore {
  triangles = [];
  scene = null;
  camera: THREE.Camera = null;
  raycaster = new THREE.Raycaster();
  selectedGeometry = []
  intersectionMaterial = new THREE.MeshBasicMaterial( { color: 0xff4400, } )

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
      setCameraState(cameraState);
    });

    return unsubscribe;
  }

  clearScene() {
    this.selectedGeometry.forEach((geometry) => {
      this.scene.remove(geometry);
    })
  }

  getFirstIntersection(origin, intersected) {
    for (let i = 0; i < intersected.length; i++) {
      const object = intersected[i];
      const d = origin.distanceTo(object.point);
      console.log("distance between origin and first intersection", d);
      console.log("object", object);
      if (d !== 0) return object;
    }
    return null;
  }
  

  checkIntersection(origin: THREE.Vector3, target: THREE.Vector3) {
    const directionVector = new THREE.Vector3().subVectors(target, origin);
    this.raycaster.set(origin, directionVector);

    const intersected = this.raycaster.intersectObjects(this.scene.children)
    let firstIntersection = this.getFirstIntersection(origin, intersected);
    
    console.log("Intersecting: ", intersected)
    console.log("Intersecting Length: ", intersected.length)
    console.log("First Intersection: ", firstIntersection)
    
    console.log("Direction Vector: ", directionVector.length())
    
    const group = new THREE.Group();

    this.clearScene()
    
    this.scene.add(firstIntersection)
    const intersectionPoint = firstIntersection.point.clone()

    if (firstIntersection.distance + 1 - directionVector.length() < 0.1) {
      console.log("Hit Intersection: ", firstIntersection)
      //@ts-ignore
      const sphere = new THREE.SphereGeometry(5, 16, 16)
      const mesh = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x0000ff })) // red
      mesh.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z)
      group.add(mesh)
    } else {
      console.log("Non hit Intersection: ", firstIntersection)
      //@ts-ignore
      const sphere = new THREE.SphereGeometry(5, 16, 16)
      const mesh = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x008000 })) // green
      mesh.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z)
      group.add(mesh)
    }
      
    console.log(group)

    
    this.drawGroupToFormaScene(group)
  }

  async drawGroupToFormaScene(group: THREE.Group) {
    const exporter = new GLTFExporter()

    group.matrixAutoUpdate = false;

    /* prettier-ignore */
    group.matrix.set(
      1, 0, 0, 0,
      0, 0, 1, 0,
      0, -1, 0, 0,
      0, 0, 0, 1
    )

    const resultScene = new THREE.Scene();
    resultScene.add(group);
    const gltf = await exporter.parseAsync(resultScene, { binary: true });

    if (gltf instanceof ArrayBuffer) {
      Forma.render.glb.add({
        glb: gltf as ArrayBuffer,
      });
    }
  }
}

const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}
