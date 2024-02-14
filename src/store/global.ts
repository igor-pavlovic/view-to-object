import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

class GlobalStore {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
  );
  raycaster = new THREE.Raycaster();
  selectedGeometry: THREE.Mesh[] = []
  material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  hitMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  missMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

  createScene() {
    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // soft white light
    this.scene.add(ambientLight);

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // white, half intensity
    // directionalLight.position.set(2000, 2000, 1000);
    // directionalLight.target.position.set(0, 0, 0);
    // directionalLight.castShadow = true;
    // this.scene.add(directionalLight);
  }

  createCamera() {
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
    console.log('called all geometry')
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      this.clearSelection()

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });
        const vertices = new Float32Array(triangles);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );

        const mesh = new THREE.Mesh(geometry, this.hitMaterial);

        this.scene.add(mesh)
        console.log('adding new geometry')
        this.selectedGeometry.push(mesh)
      })
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

  clearSelection() {
    this.clearScene()
    this.selectedGeometry = []
  }

  clearScene() {
    this.selectedGeometry.forEach((geometry) => {
      this.scene.remove(geometry);
    })
  }

  checkIntersection(origin: THREE.Vector3, target: THREE.Vector3) {
    const points = this.getRaycastingIntersections(origin, target)
    console.log("Intersecting: ", points)

    const point = this.getFirstIntersection(origin, points)
    const group = this.createRenderingGroup(point ? [point] : [])
    this.drawGroupToFormaScene(group)
  }

  getRaycastingIntersections(origin: THREE.Vector3, target: THREE.Vector3) {
    const direction = new THREE.Vector3().subVectors(target, origin).normalize();

    const arrowHelper = new THREE.ArrowHelper(direction, origin, 50, 0xff0000);
    this.scene.add(arrowHelper);

    this.raycaster.set(origin, direction);
    return this.raycaster.intersectObjects(this.scene.children)
  }

  getFirstIntersection(origin, intersections) {
    for (const intersection of intersections) {
      if (origin.distanceTo(intersection.point) > 0.1) return intersection;
    }
    return null;
  }

  createRenderingGroup(points) {
    const group = new THREE.Group();
    const sphere = new THREE.SphereGeometry(1, 16, 16)

    points.forEach(({ point }) => {
      const mesh = new THREE.Mesh(sphere, this.hitMaterial)
      mesh.position.set(point.x, point.y, point.z)
      group.add(mesh)
    })

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

  getRandomPointsOnMeshSurface(mesh: THREE.Mesh, numberOfPoints: number) {
    const sampler = new MeshSurfaceSampler(mesh).build();
    const position = new THREE.Vector3();

    const points = []
    for (let i = 0; i < numberOfPoints; i++) {
      points.push(sampler.sample(position));
    }

    return points
  }

  checkSelectionVisibility(origin: THREE.Vector3) {
    this.selectedGeometry.forEach((geometry) => {
    })


  }

  // checkMeshVisibility(origin: THREE.Vector3, target: THREE.Vector3) {
  //   // Sample meshes

  //   // For the list of points, we will check if ray intersects with anything (if the distance is the same)

  //   // 

  //   const intersections = this.getIntersections(origin, target)
  //   console.log("Intersecting: ", intersections)

  //   const directionVector = new THREE.Vector3().subVectors(target, origin);


  //   const group = this.createRenderingGroup(intersections, directionVector.length())
  //   this.drawGroupToFormaScene(group)
  // }

  getSphericalIntersections(origin: THREE.Vector3) {
    // Assuming an origin vector `origin` and a scene with objects `sceneObjects`
    // const origin = new THREE.Vector3(0, 0, 0); // Origin point
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    const intersections = [];

    const totalRays = 270; // Total rays to cast
    const raysPerDimension = 90; // Rays per dimension, interpretation for spherical distribution

    // Calculate the increment for theta and phi
    const thetaIncrement = Math.PI * 2 / raysPerDimension; // Full circle divided by rays in the azimuthal plane
    const phiIncrement = Math.PI / raysPerDimension; // Half circle for polar angle, since we only need to go from 0 to π

    // Generate and cast rays
    for (let i = 0; i < totalRays; i++) {
      const theta = (i % raysPerDimension) * thetaIncrement;
      const phi = Math.floor(i / raysPerDimension) * phiIncrement;

      // Convert spherical coordinates to Cartesian for the direction vector
      direction.setFromSphericalCoords(1, phi, theta); // Radius is 1 since we only need the direction

      // Set raycaster and perform intersection test
      raycaster.set(origin, direction.normalize());
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        const point = this.getFirstIntersection(origin, intersects)
        // Assuming we're interested in the closest intersection per ray
        if (point) intersections.push(point);
      }
    }

    // `intersections` now contains information about the closest intersection for each ray
    console.log("Intersections:", intersections);

    const group = this.createRenderingGroup(intersections)
    this.drawGroupToFormaScene(group)
  }

  sphereCaster(origin: THREE.Vector3) {
    // Example usage
    const samples = 960; // Number of points
    const points = fibonacciSphere(samples, false); // Set to true if you want randomization

    const raycaster = new THREE.Raycaster();
    const intersections = [];

    // Assuming `points` is the array generated by the Fibonacci sphere method or equivalent
    points.forEach((point) => {
      const direction = new THREE.Vector3(point[0], point[1], point[2]);
      raycaster.set(origin, direction.normalize());
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        const point = this.getFirstIntersection(origin, intersects)
        // Assuming we're interested in the closest intersection per ray
        if (point) intersections.push(point);
      }
    });

    const group = this.createRenderingGroup(intersections)
    this.drawGroupToFormaScene(group)
  }

}


const globalStoreContext = createContext(new GlobalStore());

export const GlobalStoreProvider = globalStoreContext.Provider;

export function useGlobalStore() {
  const store = useContext(globalStoreContext);
  if (!store) throw new Error("Global Store not initialised");
  return store;
}


function fibonacciSphere(samples = 1, randomize = true) {
  const rnd = randomize ? Math.random() * samples : 1;
  const points = [];
  const offset = 2 / samples;
  const increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < samples; i++) {
    const y = ((i * offset) - 1) + (offset / 2);
    const r = Math.sqrt(1 - y * y);

    const phi = ((i + rnd) % samples) * increment;

    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    points.push([x, y, z]);
  }

  return points;
}
