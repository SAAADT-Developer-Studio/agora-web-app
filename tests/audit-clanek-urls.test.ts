import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  absoluteUrl,
  csvRow,
  documentPath,
  isRedirectLoop,
  parseArgs,
} from "../scripts/audit-clanek-urls.mjs";

describe("audit URL rewriting", () => {
  it("rewrites the host of absolute URLs onto --base", () => {
    assert.equal(
      absoluteUrl(
        "https://vidik.si/slovenija/clanek/cene-goriv-2026-10-17-16-13-1",
        "https://preview.example",
      ),
      "https://preview.example/slovenija/clanek/cene-goriv-2026-10-17-16-13-1",
    );
    assert.equal(
      absoluteUrl("/zgodba/91", "https://preview.example"),
      "https://preview.example/zgodba/91",
    );
  });

  it("defaults concurrency to 2", () => {
    const options = parseArgs(["urls.csv", "--base", "https://preview.example/"]);
    assert.equal(options.concurrency, 2);
    assert.equal(options.base, "https://preview.example");
    assert.equal(
      parseArgs(["urls.csv", "--concurrency", "4"]).concurrency,
      4,
    );
  });
});

describe("audit redirect chains", () => {
  it("flags /clanek/ hops and /zgodba self-loops", () => {
    assert.equal(
      isRedirectLoop(
        "https://vidik.si/slovenija/clanek/naslov-1",
        "https://vidik.si/svet/clanek/naslov-1",
      ),
      true,
    );
    assert.equal(
      isRedirectLoop(
        "https://vidik.si/zgodba/7279",
        "https://vidik.si/zgodba/7279",
      ),
      true,
    );
    assert.equal(
      isRedirectLoop(
        "https://vidik.si/zgodba/7279.data",
        "/zgodba/7279",
      ),
      true,
    );
    assert.equal(
      isRedirectLoop(
        "https://vidik.si/slovenija/clanek/naslov-1",
        "https://vidik.si/zgodba/91",
      ),
      false,
    );
    assert.equal(documentPath("https://vidik.si/zgodba/7279/_.data"), "/zgodba/7279");
  });

  it("writes a CSV row with status, location, and final status", () => {
    assert.equal(
      csvRow([
        "https://vidik.si/zgodba/1",
        301,
        "https://vidik.si/zgodba/1",
        200,
      ]),
      "https://vidik.si/zgodba/1,301,https://vidik.si/zgodba/1,200",
    );
  });
});
