const SCHEMA = {
  id: 0,
  word: 1,
  reading: 2,
  definition: 3,
  complementary: 4,
};

function stringifyRichTextValueIntoHTML(
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

function generateUUIDs(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange(2, SCHEMA.id + 1, sheet.getLastRow() - 1);

  const values = range.getValues();
  const newIds = values.map(
    ([existingId]) => existingId || Utilities.getUuid()
  );

  sheet.getRange(2, 1, newIds.length, 1).setValues(newIds.map((id) => [id]));
}

function createTsvFromActiveSpreadsheet(): string {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getRichTextValues();
  console.log(values);

  if (sheet.getName() === "四字熟語") {
    // drop headers
    values.shift();

    const tsv = values
      .map((row) => row.map((cell) => stringifyRichTextValueIntoHTML(cell)))
      .map((row) => row.join("\t"))
      .join("\n");

    const headers = Object.entries({
      deck: "漢字::漢検準一級::四字熟語",
      notetype: "漢検準一級-四字熟語",
      html: true,
    })
      .map(([key, value]) => `#${key}:${value}`)
      .join("\n");

    return headers + "\n" + tsv;
  } else {
    throw new Error("Unknown sheet name");
  }
}

function exportTSV() {
  const tsv = createTsvFromActiveSpreadsheet();
  const tsvUri = `data:text/tsv;charset=utf-8,${encodeURIComponent(tsv)}`;
  const datetime = Utilities.formatDate(new Date(), "JST", "yyyyMMdd_HHmmss");

  const html = `
		<!DOCTYPE html>
		<html>
			<body>
				<textarea readonly style="width: 100%; height: 200px">${tsv}</textarea>
				<a href="${tsvUri}" download="anki_${datetime}.tsv">ダウンロード</a>
			</body>
		</html>	
	`;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html),
    "TSVとしてエクスポート"
  );
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Anki")
    .addItem("IDを生成", "generateUUIDs")
    .addItem("TSVを生成", "exportTSV")
    .addToUi();
}
