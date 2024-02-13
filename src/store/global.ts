import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

class GlobalStore {
  scene = new THREE.Scene();
  camera: THREE.Camera = null;
  raycaster = new THREE.Raycaster();
  selectedGeometry: THREE.Mesh[] = []
  material = new THREE.MeshBasicMaterial({ color: 0xffffff })
  hitMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, })
  missMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

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
    const triangles = await Forma.geometry.getTriangles()
    const vertices = new Float32Array(triangles);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );

    const mesh = new THREE.Mesh(geometry, this.material);

    this.scene.add(mesh)
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      this.clearScene();

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });
        const vertices = new Float32Array(triangles);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );

        const mesh = new THREE.Mesh(geometry, this.material);

        this.selectedGeometry.push(mesh)
      });

      this.scene.add(...this.selectedGeometry)
    });

    return unsubscribe;
  }

  async createCameraSubscription() {
    this.setCamera(await Forma.camera.getCurrent());

    const { unsubscribe } = await Forma.camera.subscribe((cameraState) => {
      this.setCamera(cameraState);
    });

    return unsubscribe;
  }

  setCamera(cameraState) {
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

  clearScene() {
    this.selectedGeometry.forEach((geometry) => {
      this.scene.remove(geometry);
    })
  }

  checkIntersection(origin: THREE.Vector3, target: THREE.Vector3) {

    const intersections = this.getIntersections(origin, target)
    console.log("Intersecting: ", intersections)

    const directionVector = new THREE.Vector3().subVectors(target, origin);
    const group = this.createRenderingGroup(intersections, directionVector.length())
    this.drawGroupToFormaScene(group)
  }

  getIntersections(origin: THREE.Vector3, target: THREE.Vector3) {
    const directionVector = new THREE.Vector3().subVectors(target, origin);
    this.raycaster.set(origin, directionVector);
    return this.raycaster.intersectObjects(this.scene.children)
  }

  createRenderingGroup(intersections, length) {
    const group = new THREE.Group();
    const sphere = new THREE.SphereGeometry(1, 16, 16)

    this.clearScene()

    // intersections.forEach((intersection) => {
    //   const point = intersection.point.clone()
    //   const mesh = new THREE.Mesh(sphere)

    //   if (intersection.distance - length < 0.1) {
    //     mesh.material = this.hitMaterial
    //     console.log("Hit Intersection: ", intersection)
    //   } else {
    //     console.log("Non hit Intersection: ", intersection)
    //     mesh.material = this.missMaterial
    //   }

    //   mesh.position.set(point.x, point.y, point.z)
    //   group.add(mesh)
    // })


    /*
    get only the first dot
    */

    const point = intersections[0].point.clone()
    const mesh = new THREE.Mesh(sphere)

    if (intersections[0].distance - length < 0.1) {
      mesh.material = this.hitMaterial
      console.log("Hit Intersection: ", intersections)
    } else {
      console.log("Non hit Intersection: ", intersections)
      mesh.material = this.missMaterial
    }

    mesh.position.set(point.x, point.y, point.z)
    group.add(mesh)

    /*
    end getting the first dot
    */

    console.log(group)
    return group
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
