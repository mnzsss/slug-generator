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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
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

    ss.toast("Sugestões Atualizadas!");
  } catch (error) {
    ss.toast("Erro ao atualizar sugestões.");
    // deal with any errors
    Logger.log(error);
  }
}

function saveSlugs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    const suggestionsSheet = ss.getSheetByName("Sugestões");

    const data = suggestionsSheet.getDataRange().getValues() as Array<string[]>;

    const slugs = data.map((row) => ({
      sku: row[0],
      slug: row[2],
    }));

    const endpoint = getOptimusEndpoint();

    const status = UrlFetchApp.fetch(`${endpoint}/products-slug`, {
      muteHttpExceptions: true,
      contentType: "application/json",
      method: "post",
      payload: {
        slugs,
      },
    }).getResponseCode();

    if (status !== 200) {
      throw new Error("Service error");
    }

    ss.toast("Slugs Cadastrados! " + status);
  } catch (error) {
    ss.toast("Erro ao cadastrar slugs");

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
