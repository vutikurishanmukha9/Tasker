import { describe, it, expect } from "vitest";
import { colorFor, initials } from "../lib/seed";

describe("seed utilities", () => {
  describe("colorFor", () => {
    it("returns a hex color string for a given name", () => {
      const color1 = colorFor("Alex Morgan");
      const color2 = colorFor("Priya Shah");
      
      expect(color1).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color2).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("returns the same color consistently for the same input", () => {
      expect(colorFor("Jordan Lee")).toBe(colorFor("Jordan Lee"));
    });
  });

  describe("initials", () => {
    it("returns up to two uppercase initials from a name", () => {
      expect(initials("Alex Morgan")).toBe("AM");
      expect(initials("John")).toBe("J");
      expect(initials("John Doe Smith")).toBe("JD");
      expect(initials("")).toBe("");
    });
  });
});
