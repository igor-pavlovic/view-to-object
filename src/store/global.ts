import { useContext, createContext } from "react";
import * as THREE from "three";
import { Forma } from "forma-embedded-view-sdk/auto";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

class GlobalStore {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
  );
  raycaster = new THREE.Raycaster();
  selectedGeometry: THREE.Mesh[] = [];
  material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  originMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    opacity: 0.5,
    transparent: true,
  });
  hitMaterial = new THREE.MeshBasicMaterial({
    color: 0x32a852,
    opacity: 0.5,
    transparent: true,
  });
  hitLineMaterial = new THREE.MeshBasicMaterial({
    color: 0x32a852,
    opacity: 0.15,
    transparent: true,
  });
  missMaterial = new THREE.MeshBasicMaterial({
    color: 0xa30812,
    opacity: 0.5,
    transparent: true,
  });
  missLineMaterial = new THREE.MeshBasicMaterial({
    color: 0xa30812,
    opacity: 0.15,
    transparent: true,
  });

  createScene() {
    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.SpotLight(0xffffff, 1.0); // white, half intensity
    directionalLight.position.set(2000, 2000, 1000);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.decay = 0;
    this.scene.add(directionalLight);
  }

  createCamera() {
    this.camera.position.z = 1;
  }

  async getAllGeometry(scene = this.scene) {
    const triangles = await Forma.geometry.getTriangles();
    const vertices = new Float32Array(triangles);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
    console.log("Add all initial geometry");
  }

  async createSubscription() {
    const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
      this.clearSelection();

      paths.forEach(async (path) => {
        const triangles = await Forma.geometry.getTriangles({ path: path });
        const vertices = new Float32Array(triangles);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );

        const mesh = new THREE.Mesh(geometry, this.hitMaterial);

        this.scene.add(mesh);
        console.log("Adding new geometry");
        this.selectedGeometry.push(mesh);
      });
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
    this.clearScene();
    this.selectedGeometry = [];
  }

  clearScene() {
    this.selectedGeometry.forEach((geometry) => {
      this.scene.remove(geometry);
    });
  }

  raycastOnMesh(raycaster: THREE.Raycaster) {
    // Iterate over each mesh in the array
    this.selectedGeometry.forEach((mesh) => {
      // Perform raycasting on each mesh
      const intersects: THREE.Intersection[] = [];
      mesh.raycast(raycaster, intersects);
      console.log("Intersection array", intersects);
    });
  }

  getTargetIntersection(target, intersections): THREE.Vector3 | null {
    for (const intersection of intersections) {
      if (target.distanceTo(intersection.point) === 0) {
        console.log(
          "Get target intersection",
          target.distanceTo(intersection.point)
        );
        return intersection.point;
      }
      // if (target.distanceTo(intersection.point) <= 0.3) return intersection.point;
    }
    return null;
  }

  checkIntersection(origin: THREE.Vector3, target: THREE.Vector3) {
    const intersectionPoints = this.getRaycastingIntersections(origin, target);

    const point = this.getFirstIntersection(origin, intersectionPoints);
    const targetPoint = this.getTargetIntersection(target, intersectionPoints);
    const group = new THREE.Group();

    if (point && targetPoint) {
      group.add(...this.createPointMeshes([point]));
      group.add(...this.createPointMeshes([targetPoint], this.missMaterial));
      group.add(createLine([origin, targetPoint], this.missLineMaterial));
    }

    if (!point && targetPoint) {
      group.add(...this.createPointMeshes([targetPoint], this.hitMaterial));
      group.add(createLine([origin, targetPoint], this.missLineMaterial));
    }

    group.add(...this.createPointMeshes([origin], this.originMaterial));
    this.drawGroupToFormaScene(group);
  }

  getRaycastingIntersections(origin: THREE.Vector3, target: THREE.Vector3) {
    const direction = new THREE.Vector3()
      .subVectors(target, origin)
      .normalize();
    this.raycaster.set(origin, direction);
    return this.raycaster.intersectObjects(this.scene.children);
  }

  getFirstIntersection(origin, intersections): THREE.Vector3 | null {
    for (const intersection of intersections) {
      if (origin.distanceTo(intersection.point) > 0.1)
        return intersection.point;
    }
    return null;
  }

  createPointMeshes(points, material = this.hitMaterial): THREE.Mesh[] {
    console.log("Create Point Meshes: ", points);
    const meshes = [];
    const sphere = new THREE.SphereGeometry(1, 16, 16);

    points.forEach((point) => {
      if (point === null) return;
      const mesh = new THREE.Mesh(sphere, material);
      mesh.position.set(point.x, point.y, point.z);
      meshes.push(mesh);
    });

    return meshes;
  }

  async drawGroupToFormaScene(group: THREE.Group) {
    const exporter = new GLTFExporter();

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
    const points = [];

    for (let i = 0; i < numberOfPoints; i++) {
      const position = new THREE.Vector3();
      sampler.sample(position);
      points.push(position);
    }

    return points;
  }

  checkSelectionVisibility(origin: THREE.Vector3, sampleNumber: number) {
    // Sample meshes
    const visiblePoints: THREE.Vector3[] = [];
    const missedPoints: THREE.Vector3[] = [];

    console.log("Started finding interesctions on the selection.");

    for (const mesh of this.selectedGeometry) {
      const points = this.getRandomPointsOnMeshSurface(mesh, sampleNumber);

      for (const target of points) {
        const raycastings = this.getRaycastingIntersections(origin, target);

        if (raycastings.length > 0) {
          const point = this.getFirstIntersection(origin, raycastings);
          if (point) visiblePoints.push(point);

          const targetPoint = this.getTargetIntersection(target, raycastings);
          if (point !== null && targetPoint !== null)
            missedPoints.push(targetPoint);
          // if (!point && targetPoint) visiblePoints.push(targetPoint);
        }
      }
    }

    console.log("Finished finding interesctions on the selection. ");
    console.log("Visible points: ", visiblePoints);
    console.log("Missed points: ", missedPoints);

    const filteredMissedPoints = missedPoints.filter(
      (point) =>
        !visiblePoints.some((visiblePoint) => visiblePoint.equals(point))
    );

    const group = new THREE.Group();
    group.add(...this.createPointMeshes(visiblePoints, this.hitMaterial));
    group.add(
      ...this.createPointMeshes(filteredMissedPoints, this.missMaterial)
    );
    group.add(...this.createPointMeshes([origin], this.originMaterial));
    group.add(...createLines(origin, visiblePoints, this.hitLineMaterial));
    group.add(...createLines(origin, missedPoints, this.missLineMaterial));

    this.drawGroupToFormaScene(group);
  }

  sphereCaster(origin: THREE.Vector3, sphereSamplePoints: number) {
    const samples = sphereSamplePoints; // Number of raycasting directions
    const points = fibonacciSphere(samples, false); // Set to true if you want randomization

    const raycaster = new THREE.Raycaster();
    const intersectionPoints = [];

    points.forEach((point) => {
      const direction = new THREE.Vector3(point[0], point[1], point[2]);
      raycaster.set(origin, direction.normalize());
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        const point = this.getFirstIntersection(origin, intersects);
        if (point) intersectionPoints.push(point);
      }
    });

    const group = new THREE.Group();
    group.add(...this.createPointMeshes(intersectionPoints));
    group.add(...this.createPointMeshes([origin], this.originMaterial));
    group.add(...createLines(origin, intersectionPoints, this.hitLineMaterial));
    this.drawGroupToFormaScene(group);
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
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);

    const phi = ((i + rnd) % samples) * increment;

    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    points.push([x, y, z]);
  }

  return points;
}

function createLines(origin: THREE.Vector3, points: THREE.Vector3[], material) {
  return points.map((point) => createLine([origin, point], material));
}

function createLine(points: [THREE.Vector3, THREE.Vector3], material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}
