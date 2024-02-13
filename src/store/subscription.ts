import { Forma } from "forma-embedded-view-sdk/auto";

export async function createSubscription() {
  const { unsubscribe } = await Forma.selection.subscribe(({ paths }) => {
    console.log("subscription callback", paths);
    paths.forEach(async (path) => {
      const triangles = await Forma.geometry.getTriangles({ path: path });
      console.log("triangles", triangles);
    });
  });
  return unsubscribe;
}
