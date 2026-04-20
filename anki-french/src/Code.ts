import { Headers } from "../../anki-common/headers.js";
import { richText } from "../../anki-common/rich_text.js";

const WORD_SCHEMA = {
  ID: 0,
  POS: 1,
  WORD: 2,
  DEF: 3,
  NOTES: 4,
  EX_ID: 5,
  EX_SENTENCE: 6,
  EX_TRANSLATION: 7,
  SYNONYM: 8,
};

const SHEETS = new Map([
  ["words", "単語"],
  ["examples", "例文"],
  ["questions", "問題"],
]);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function createTsvFromActiveSpreadsheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getRichTextValues();

  if (sheet.getName() === SHEETS.get("words")) {
    // drop headers
    values.shift();

    // drop EX_ID column
    for (const row of values) {
      row.splice(WORD_SCHEMA.EX_ID, 1);
    }

    const tsv = values
      .map((row) => row.map((cell) => richText.stringify(cell)))
      .map((row) => row.join("\t"))
      .join("\n");

    const headers = new Headers({
      deck: "フランス語::単語",
      notetype: "フランス語",
      html: true,
    })

    return headers.toString() + "\n" + tsv;
  }

  if (sheet.getName() === SHEETS.get("questions")) {
    values.shift();

    const tsv = values
      .map((row) => row.join("\t"))
      .join("\n");

    const headers = {
      deck: "フランス語::問題",
      notetype: "フランス語-問題",
      html: true,
    };

    const headersStr = Object.entries(headers)
      .map(([key, value]) => `#${key}:${value}`)
      .join("\n");

    return headersStr + "\n" + tsv;
  }

  throw new Error("Unknown sheet name");
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function setIds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange(2, WORD_SCHEMA.ID + 1, sheet.getLastRow() - 1);
  const values = range.getValues();

  const ids = values.map((row) => row[0] || Utilities.getUuid());
  const idRange = sheet.getRange(2, 1, ids.length, 1);
  idRange.setValues(ids.map((id) => [id]));
}

function exportTsv() {
  const tsv = createTsvFromActiveSpreadsheet();
  const tsvUri = `data:text/tsv;charset=utf-8,${encodeURIComponent(tsv)}`;
  const datetime = Utilities.formatDate(new Date(), "JST", "yyyyMMdd_HHmmss");

  const html = `
		<!DOCTYPE html>
		<html>
			<body>
				<textarea readonly style="width: 100%; height: 200px">${tsv}</textarea>
				<a href="${tsvUri}" download="anki_仏語_${datetime}.tsv">ダウンロード</a>
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
    .addItem("IDを生成", setIds.name)
    .addItem("TSVとしてエクスポート", exportTsv.name)
    .addToUi();
}
