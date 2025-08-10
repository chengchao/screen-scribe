import { Hono } from "hono";
import { ScreenScribeWorkflow } from "./workflow";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export { ScreenScribeWorkflow };

export default app;
