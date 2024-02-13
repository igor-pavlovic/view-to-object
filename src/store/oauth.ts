import { Forma } from "forma-embedded-view-sdk/auto";

export async function getFormaToken() {
  Forma.auth.configure({
    clientId: "I3rHqlqrUCTcrGLIQ3d3XWa9UfBEui7H",
    callbackUrl: "http://localhost:3000/url/callback",
    scopes: ["data:read", "data:write"],
  });

  const result = await Forma.auth.acquireTokenPopup();
  console.log(result.accessToken);
}
