import { Headers } from "./headers";
import { describe, expect, it } from "vitest";

describe("Headers", () => {
  it("should correctly convert headers to string", () => {
    const headers = new Headers({
      deck: "Default",
      notetype: "Basic",
      html: true,
    });

    const result = headers.toString();

    expect(result).toBe("#deck:Default\n#notetype:Basic\n#html:true");
  });

  it("should handle empty headers", () => {
    const headers = new Headers({
      deck: "",
      notetype: "",
      html: false,
    });

    const result = headers.toString();

    expect(result).toBe("#deck:\n#notetype:\n#html:false");
  });

  it("should handle special characters in header values", () => {
    const headers = new Headers({
      deck: "Deck#1",
      notetype: "Note:Type",
      html: true,
    });

    const result = headers.toString();

    expect(result).toBe("#deck:Deck#1\n#notetype:Note:Type\n#html:true");
  });
});
