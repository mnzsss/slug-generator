/** @OnlyCurrentDoc */

type Slug = {
  sku: string;
  current?: string;
  recommended: string;
};

const enviroments = {
  Production: "",
  Staging: ".staging",
  Development: ".dev",
};

function getCampaignSuggestions() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Config Sheet
    const configSheet = ss.getSheetByName("Config");

    // Options
    const campaignId = configSheet.getRange("B2").getValue();
    const endpoint = getOptimusEndpoint();

    const response = UrlFetchApp.fetch(
      `${endpoint}/campaign/slug-suggestions`,
      {
        muteHttpExceptions: true,
        contentType: "application/json",
        method: "post",
        payload: {
          campaignId,
        },
      }
    ).getContentText();

    const slugs = (JSON.parse(response) as Slug[]).map((slug) => {
      const recommended = slug.recommended.startsWith("/produtos")
        ? slug.recommended
        : `/produtos${slug.recommended}`;

      return [slug.sku, slug.current, recommended, slug.current ?? recommended];
    });

    const numRows = slugs.length;
    const numCols = slugs[0].length;

    const suggestionsSheet = ss.getSheetByName("Sugestões");

    suggestionsSheet.getRange(2, 1, numRows, numCols).setValues(slugs);
  } catch (error) {
    // deal with any errors
    Logger.log(error);
  }
}

function saveSlugs() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const suggestionsSheet = ss.getSheetByName("Sugestões");

    const data = suggestionsSheet.getDataRange().getValues() as Array<string[]>;

    const values = data.map((row) => ({
      sku: row[0],
      slug: row[2],
    }));

    const endpoint = getOptimusEndpoint();

    UrlFetchApp.fetch(`${endpoint}/products-slug`, {
      muteHttpExceptions: true,
      contentType: "application/json",
      method: "post",
      payload: values,
    });

    ss.toast("Slugs Cadastrados!");
  } catch (error) {
    // deal with any errors
    Logger.log(error);
  }
}

function getOptimusEndpoint() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Config Sheet
  const configSheet = ss.getSheetByName("Config");

  // Options
  const configEnviroment = configSheet.getRange("B3").getValue();

  const urlPrefix = "https://optimus";
  const urlPrefixWithEnviroment = urlPrefix + enviroments[configEnviroment];
  const endpoint = urlPrefixWithEnviroment + ".bbrands.com.br";

  return `${endpoint}/api`;
}
