import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BalloonGameView } from "../src/extension/BalloonGameView.js";

test("Pilot-Web manifest maps to exported IOpenspaceView", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../src/extension/extensions.config.json", import.meta.url)));
  assert.equal(manifest.extension.name, "balloon_pop_demo");
  assert.equal(manifest.extension.entry, "balloon-pop.js");
  assert.equal(manifest.version, "1.3.0");
  assert.deepEqual(manifest.extension.modules, [{
    ngModuleName: "BalloonGameView",
    exposedInterface: "IOpenspaceView<PageContext>"
  }]);
  const view = new BalloonGameView();
  assert.equal(view.getViewId(), "balloon-pop-demo-view");
  assert.equal(typeof view.getView, "function");
  assert.equal(typeof view.dispose, "function");
  view.dispose();
});


test("the game has exactly four embedded offline face targets", async () => {
  const { FACE_SOURCES } = await import("../src/extension/FaceAssets.js");
  assert.equal(FACE_SOURCES.length, 4);
  for (const src of FACE_SOURCES) {
    assert.ok(src.startsWith("data:image/jpeg;base64,"));
    assert.ok(Buffer.from(src.split(",")[1], "base64").length > 500);
  }
});
