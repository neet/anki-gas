import { Headers } from "../../anki-common/headers.js";


const COL_ID = 1;
const COL_EX_ID = 3;

function generateUUIDs(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange(2, COL_ID, sheet.getLastRow() - 1);

  const values = range.getValues();
  const newIds = values.map(
    ([existingId]) => existingId || Utilities.getUuid()
  );

  sheet.getRange(2, 1, newIds.length, 1).setValues(newIds.map((id) => [id]));
}

function createTsvFromActiveSpreadsheet(): string {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();

  switch (sheet.getName()) {
    case "単語": {
      // drop headers
      values.shift();

      // drop exampleId
      for (const row of values) {
        row.splice(COL_EX_ID, 1);
      }

      const tsv = values
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "インドネシア語::単語",
        notetype: "インドネシア語",
        html: true,
      })

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
				<a href="${tsvUri}" download="anki_indonesia_${datetime}.tsv">ダウンロード</a>
			</body>
		</html>	
	`;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html),
    "TSVとしてエクスポート"
  );
}

function onOpen(): void {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Anki")
    .addItem("IDを生成", generateUUIDs.name)
    .addItem("TSVを生成", exportTSV.name)
    .addToUi();
}

