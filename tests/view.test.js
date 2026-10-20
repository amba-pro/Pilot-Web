import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BalloonGameView } from "../src/extension/BalloonGameView.js";

test("Pilot-Web manifest maps to exported IOpenspaceView", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../src/extension/extensions.config.json", import.meta.url)));
  assert.equal(manifest.extension.name, "balloon_pop_demo");
  assert.equal(manifest.extension.entry, "balloon-pop.js");
  assert.deepEqual(manifest.extension.modules, [{
    ngModuleName: "BalloonGameView",
    exposedInterface: "IOpenspaceView<PageContext>"
  }]);
  const view = new BalloonGameView();
  assert.equal(view.getViewId(), "balloon-pop-demo-view");
  assert.equal(typeof view.getView, "function");
  assert.equal(typeof view.dispose, "function");
});
