import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  csvRow,
  documentPath,
  isRedirectLoop,
  parseArgs,
} from "../scripts/audit-clanek-urls.mjs";

describe("audit URL rewriting", () => {
  it("rewrites the host of absolute URLs onto --base", () => {
    expect(
      absoluteUrl(
        "https://vidik.si/slovenija/clanek/cene-goriv-2026-10-17-16-13-1",
        "https://preview.example",
      ),
    ).toBe(
      "https://preview.example/slovenija/clanek/cene-goriv-2026-10-17-16-13-1",
    );
    expect(absoluteUrl("/zgodba/91", "https://preview.example")).toBe(
      "https://preview.example/zgodba/91",
    );
  });

  it("defaults concurrency to 2", () => {
    const options = parseArgs([
      "urls.csv",
      "--base",
      "https://preview.example/",
    ]);
    expect(options.concurrency).toBe(2);
    expect(options.base).toBe("https://preview.example");
    expect(parseArgs(["urls.csv", "--concurrency", "4"]).concurrency).toBe(4);
  });
});

describe("audit redirect chains", () => {
  it("flags /clanek/ hops and /zgodba self-loops", () => {
    expect(
      isRedirectLoop(
        "https://vidik.si/slovenija/clanek/naslov-1",
        "https://vidik.si/svet/clanek/naslov-1",
      ),
    ).toBe(true);
    expect(
      isRedirectLoop(
        "https://vidik.si/zgodba/7279",
        "https://vidik.si/zgodba/7279",
      ),
    ).toBe(true);
    expect(
      isRedirectLoop("https://vidik.si/zgodba/7279.data", "/zgodba/7279"),
    ).toBe(true);
    expect(
      isRedirectLoop(
        "https://vidik.si/slovenija/clanek/naslov-1",
        "https://vidik.si/zgodba/91",
      ),
    ).toBe(false);
    expect(documentPath("https://vidik.si/zgodba/7279/_.data")).toBe(
      "/zgodba/7279",
    );
  });

  it("writes a CSV row with status, location, and final status", () => {
    expect(
      csvRow([
        "https://vidik.si/zgodba/1",
        301,
        "https://vidik.si/zgodba/1",
        200,
      ]),
    ).toBe("https://vidik.si/zgodba/1,301,https://vidik.si/zgodba/1,200");
  });
});
