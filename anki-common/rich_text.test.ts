import { describe, it, expect } from "vitest";
import { richText } from "./rich_text";

describe("richText.stringify", () => {
  it("should return an empty string for null input", () => {
    expect(richText.stringify(null)).toBe("");
  });

  it("should return plain text for a RichTextValue with no styles", () => {
    const mockRichTextValue = {
      getRuns: () => [
        {
          getText: () => "Hello",
          getTextStyle: () => ({
            isBold: () => false,
            isItalic: () => false,
            isStrikethrough: () => false,
            isUnderline: () => false,
          }),
        },
      ],
    } as GoogleAppsScript.Spreadsheet.RichTextValue;

    expect(richText.stringify(mockRichTextValue)).toBe("Hello");
  });

  it("should apply bold style correctly", () => {
    const mockRichTextValue = {
      getRuns: () => [
        {
          getText: () => "Bold",
          getTextStyle: () => ({
            isBold: () => true,
            isItalic: () => false,
            isStrikethrough: () => false,
            isUnderline: () => false,
          }),
        },
      ],
    } as GoogleAppsScript.Spreadsheet.RichTextValue;

    expect(richText.stringify(mockRichTextValue)).toBe("<b>Bold</b>");
  });

  it("should apply multiple styles correctly", () => {
    const mockRichTextValue = {
      getRuns: () => [
        {
          getText: () => "Styled",
          getTextStyle: () => ({
            isBold: () => true,
            isItalic: () => true,
            isStrikethrough: () => true,
            isUnderline: () => true,
          }),
        },
      ],
    } as GoogleAppsScript.Spreadsheet.RichTextValue;

    expect(richText.stringify(mockRichTextValue)).toBe(
      "<u><del><em><b>Styled</b></em></del></u>"
    );
  });

  it("should concatenate multiple runs correctly", () => {
    const mockRichTextValue = {
      getRuns: () => [
        {
          getText: () => "Hello",
          getTextStyle: () => ({
            isBold: () => true,
            isItalic: () => false,
            isStrikethrough: () => false,
            isUnderline: () => false,
          }),
        },
        {
          getText: () => " World",
          getTextStyle: () => ({
            isBold: () => false,
            isItalic: () => true,
            isStrikethrough: () => false,
            isUnderline: () => false,
          }),
        },
      ],
    } as GoogleAppsScript.Spreadsheet.RichTextValue;

    expect(richText.stringify(mockRichTextValue)).toBe(
      "<b>Hello</b><em> World</em>"
    );
  });
});
