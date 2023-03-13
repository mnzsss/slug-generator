/** @OnlyCurrentDoc */

const enviroments = {
  Production: "",
  Staging: ".staging",
  Development: ".dev",
};

function run() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Config Sheet
    var configSheet = ss.getSheetByName("Config");

    // Options
    const campaignId = configSheet.getRange("B2").getValue();
    const configEnviroment = configSheet.getRange("B3").getValue();

    const urlPrefix = "https://optimus";
    const urlPrefixWithEnviroment = urlPrefix + enviroments[configEnviroment];
    const endpoint = urlPrefixWithEnviroment + ".bbrands.com.br";

    var response = UrlFetchApp.fetch(
      `${endpoint}/api/campaign/slug-suggestions`,
      {
        muteHttpExceptions: true,
        contentType: "application/json",
        method: "post",
        payload: {
          campaignId,
        },
      }
    ).getContentText();

    var slugs = JSON.parse(response).map((slug) => [
      slug.sku,
      slug.current,
      slug.recommended,
      slug.current,
    ]);

    var numRows = slugs.length;
    var numCols = slugs[0].length;

    var suggestionsSheet = ss.getSheetByName("Sugestões");

    suggestionsSheet.getRange(2, 1, numRows, numCols).setValues(slugs);
  } catch (error) {
    // deal with any errors
    Logger.log(error);
  }
}
