import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BalloonGameView } from "../src/extension/BalloonGameView.js";
import { HEAD_SOURCES } from "../src/extension/HeadAssets.js";

test("Pilot-Web extension manifest maps to IOpenspaceView", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../src/extension/extensions.config.json", import.meta.url)));
  assert.equal(manifest.extension.name, "balloon_pop_demo");
  assert.equal(manifest.extension.entry, "balloon-pop.js");
  assert.equal(manifest.version, "1.4.0");
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

test("seven NEW transparent-background offline head targets", () => {
  assert.equal(HEAD_SOURCES.length, 7);
  for (const src of HEAD_SOURCES) {
    assert.ok(src.startsWith("data:image/webp;base64,"), "All images are embedded WebP");
    const data = Buffer.from(src.split(",")[1], "base64");
    assert.ok(data.length > 500, "Image must not be empty");
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WEBP");
  }
});

test("game creates particle explosions and does not import old image assets", () => {
  const js = fs.readFileSync(new URL("../src/extension/BalloonGameView.js", import.meta.url), "utf8");
  assert.match(js, /const explode = \(element\) =>/);
  assert.match(js, /explode\(b\.element\)/);
  assert.match(js, /className = "particle"/);
  assert.doesNotMatch(js, /FACE_SOURCES|FaceAssets/);
});
