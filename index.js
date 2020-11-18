import { handleRequest } from "./src/app";

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
