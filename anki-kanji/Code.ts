import { Headers } from "./anki-common/headers";
import { richText } from "./anki-common/rich_text";

const SCHEMA = {
  id: 0,
  word: 1,
  reading: 2,
  definition: 3,
  complementary: 4,
  reference: 5,
};

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

  switch (sheet.getName()) {
    case "四字熟語": {
      // drop headers
      values.shift();

      const tsv = values
        .map((row) => row.map((cell) => richText.stringify(cell)))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "漢字::漢検準一級::四字熟語",
        notetype: "漢検準一級-四字熟語",
        html: true,
      })

      return headers.toString() + "\n" + tsv;
    }

    case "書き取り": {
      // drop headers
      values.shift();

      const tsv = values
        .map((row) => row.map((cell) => richText.stringify(cell)))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "漢字::漢検準一級::書き取り",
        notetype: "漢検準一級-書き取り",
        html: true,
      });

      return headers.toString() + "\n" + tsv;
    }

    default: {
      throw new Error("Unknown sheet name");
    }
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

export function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Anki")
    .addItem("IDを生成", generateUUIDs.name)
    .addItem("TSVを生成", exportTSV.name)
    .addToUi();
}
