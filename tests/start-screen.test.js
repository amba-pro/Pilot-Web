import test from "node:test";
import assert from "node:assert/strict";
import { findMainToolsContainer } from "../src/extension/StartScreenTile.js";

function element(parent = null) {
  const el = {
    parentElement: parent,
    contains(other) {
      for (let current = other; current; current = current.parentElement) {
        if (current === this) return true;
      }
      return false;
    }
  };
  return el;
}
test("home card insertion stays inside main tools, before BIM heading", () => {
  const body = element();
  const page = element(body);
  const heading = element(page);
  const cards = element(page);
  const reports = element(element(cards));
  const messages = element(element(cards));
  const bim = element(page);
  assert.equal(findMainToolsContainer(heading, reports, messages, bim), cards);
});
test("ambiguous page layout does not insert into the whole application", () => {
  const body = element();
  const page = element(body);
  const reports = element(page);
  const messages = element(page);
  const heading = element(page);
  const bim = element(page);
  assert.equal(findMainToolsContainer(heading, reports, messages, bim), null);
  assert.equal(findMainToolsContainer(heading, reports, null, bim), null);
});
