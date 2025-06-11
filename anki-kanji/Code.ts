type HeadersInit = {
  deck: string;
  notetype: string;
  html: boolean;
};

export class Headers {
  readonly #init: HeadersInit;

  constructor(init: HeadersInit) {
    this.#init = init;
  }

  toString(): string {
    return Object.entries(this.#init)
      .map(([key, value]) => `#${key}:${value}`)
      .join("\n");
  }
}


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

    text = text.replace(/\n/g, "<br>");

    // colors and fonts are not supported for now
    html += text;
  }

  return html;
}


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
        .map((row) => row.map((cell) => stringify(cell)))
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
        .map((row) => row.map((cell) => stringify(cell)))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "漢字::漢検準一級::書き取り",
        notetype: "漢検準一級-書き取り",
        html: true,
      });

      return headers.toString() + "\n" + tsv;
    }

    case "読み": {
      // drop headers
      values.shift();

      const tsv = values
        .map((row) => row.map((cell) => stringify(cell)))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "漢字::漢検準一級::読み",
        notetype: "漢検準一級-読み",
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

function extractUnderlines(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getSelection().getActiveRange();

  if (!range) {
    SpreadsheetApp.getUi().alert("範囲を選択してください。");
    return;
  }

  const values = range.getRichTextValues();
  
  const underlines: string[] = [];

  for (const row of values) {
    for (const cell of row) {
      if (!cell) continue;

      const richTextValues = cell.getRuns();
      for (const richTextValue of richTextValues) {
        if (richTextValue.getTextStyle().isUnderline()) {
          underlines.push(richTextValue.getText());
        }
      }
    }
  }

  if (underlines.length === 0) {
    SpreadsheetApp.getUi().alert("下線部は見つかりませんでした。");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <textarea readonly style="width: 100%; height: 200px">${underlines.join("\n")}</textarea>
      </body>
    </html>	
  `;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html),
    "下線部の抽出"
  );
}

export function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Anki")
    .addItem("IDを生成", generateUUIDs.name)
    .addItem("TSVを生成", exportTSV.name)
    .addItem("下線部を抽出", extractUnderlines.name)
    .addToUi();
}
