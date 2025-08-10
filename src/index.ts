import { Hono } from "hono";
import { ScreenScribeWorkflow } from "./workflow";
import { Container } from "@cloudflare/containers";

export class MyContainer extends Container<CloudflareBindings> {}

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export { ScreenScribeWorkflow };

export default app;
