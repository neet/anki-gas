function generateUUIDs(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1);

  const values = range.getValues();
  const newIds = values.map(
    ([existingId]) => existingId || Utilities.getUuid()
  );

  sheet.getRange(2, 1, newIds.length, 1).setValues(newIds.map((id) => [id]));
}


type HeadersInit = {
  deck: string;
  notetype?: string;
  "notetype column"?: number;
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

function createCloze(text: GoogleAppsScript.Spreadsheet.RichTextValue | null, condition?: 'isBold'): string {
  if (!text) {
    return "";
  }

  const richTextValues = text.getRuns();
  let html = "";
  let counter = 1;

  for (const richTextValue of richTextValues) {
    let text = richTextValue.getText();
    const style = richTextValue.getTextStyle();

    if (condition === 'isBold' && style.isBold()) {
      text = `{{c${counter}::${text}}}`;
      counter++;
    }

    html += text;
  }

  html = html.split('\n').map((line) => `<p>${line}</p>`).join('');

  return html;
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

const IMAGE_PREVIEW_COL = 3;

function createTsvFromActiveSpreadsheet(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = spreadsheet.getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getRichTextValues();

  switch (sheet.getName()) {
    case "道路標識": {
      // drop headers
      values.shift();

      for (const row of values) {
        row.splice(IMAGE_PREVIEW_COL, 1);
      }

      const tsv = values
        .map((row) => row.map((cell) => stringify(cell)))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "自動車教習::道路標識",
        notetype: "自動車教習-道路標識",
        html: true,
      })

      return headers.toString() + "\n" + tsv;
    }

    default: {
      throw new Error("Unknown sheet name");
    }

    case "学科教習-第一段階": {
      // drop headers
      values.shift();

      const tsv = values
        .map((row) => row.map((cell, cellIndex) => {
          if (cellIndex === 5) {
            return createCloze(cell, "isBold");
          } else {
            return stringify(cell);
          }
        }))
        .map((row) => row.join("\t"))
        .join("\n");

      const headers = new Headers({
        deck: "自動車教習::学科教習-第一段階",
        "notetype column": 4,
        html: true,
      });

      return headers.toString() + "\n" + tsv;
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
