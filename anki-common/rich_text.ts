function stringify(
  richTextValue: GoogleAppsScript.Spreadsheet.RichTextValue | null
): string {
  if (!richTextValue) {
    return "";
  }

  const richTextValues = richTextValue.getRuns();
  let html = "";

  for (const richTextValue of richTextValues) {
    let text = richTextValue.getText();
    const style = richTextValue.getTextStyle();

    if (style.isBold()) {
      text = `<b>${text}</b>`;
    }
    if (style.isItalic()) {
      text = `<em>${text}</em>`;
    }
    if (style.isStrikethrough()) {
      text = `<del>${text}</del>`;
    }
    if (style.isUnderline()) {
      text = `<u>${text}</u>`;
    }

    // colors and fonts are not supported for now
    html += text;
  }

  return html;
}

export const richText = {
  stringify,
};
