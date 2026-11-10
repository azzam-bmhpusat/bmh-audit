import { describe, it, expect } from "vitest";
import { safeHref } from "./safe-link";

describe("lib/safe-link", () => {
  it("menerima URL http dan https yang valid", () => {
    expect(safeHref("https://drive.google.com/drive/folders/xyz")).toBe(
      "https://drive.google.com/drive/folders/xyz"
    );
    expect(safeHref("http://example.com/file.pdf")).toBe(
      "http://example.com/file.pdf"
    );
  });

  it("menolak URL berbahaya (XSS payload)", () => {
    expect(safeHref("javascript:alert(document.cookie)")).toBe(null);
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBe(null);
    expect(safeHref("vbscript:msgbox(1)")).toBe(null);
  });

  it("menolak URL lokal atau relatif", () => {
    expect(safeHref("/local/path")).toBe(null);
    expect(safeHref("file:///C:/secret.txt")).toBe(null);
    expect(safeHref("relative-url")).toBe(null);
  });

  it("menangani null, undefined, dan string kosong", () => {
    expect(safeHref(null)).toBe(null);
    expect(safeHref(undefined)).toBe(null);
    expect(safeHref("")).toBe(null);
    expect(safeHref("   ")).toBe(null);
  });
});
