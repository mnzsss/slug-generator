/** @OnlyCurrentDoc */

type Slug = {
  sku: string;
  current?: string;
  recommended: string;
};

function getCampaignSuggestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    // Config Sheet
    const configSheet = ss.getSheetByName("Config");

    // Options
    const campaignId = configSheet.getRange("B2").getValue();

    const response = request(`/campaign/slug-suggestions`, "stark", {
      payload: {
        campaignId,
      },
    }).getContentText();

    const responseParsed = Object.entries(JSON.parse(response)).reduce(
      (acc, slug) => {
        const [sku, { recommended, current }] = slug as [string, Slug];

        acc.push({
          sku,
          recommended,
          current,
        });

        return acc;
      },
      []
    ) as Slug[];

    const slugs = responseParsed.map((slug) => {
      const recommended = slug.recommended.startsWith("/produtos")
        ? slug.recommended
        : `/produtos${slug.recommended}`;

      return [
        slug.sku,
        slug.current
          ? `${getBeyoungUrl()}${slug.current.startsWith("/") ? "" : "/"}${
              slug.current
            }/${slug.sku}`
          : null,
        recommended,
        recommended,
      ];
    });

    const numRows = slugs.length;
    const numCols = slugs[0].length;

    const suggestionsSheet = ss.getSheetByName("Sugestões");

    clearSheet();

    suggestionsSheet.getRange(2, 1, numRows, numCols).setValues(slugs);

    highlightDuplicatedSlugs();

    ss.toast("Sugestões Atualizadas!");
  } catch (error) {
    ss.toast("Erro ao atualizar sugestões.");
    // deal with any errors
    Logger.log(error);
  }
}

/**
 * Clear suggestions values
 */
function clearSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sugestões");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var numRows = range.getNumRows();

  // Loop through each row in the sheet and clear values if not in the first row
  for (var i = 1; i < numRows; i++) {
    for (var j = 0; j < values[i].length; j++) {
      var cell = sheet.getRange(i + 1, j + 1);
      if (i > 0) {
        cell.clearContent();
        cell.setBackground(null);
      }
    }
  }
}

function getSlugsData(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const range = sheet.getRange("D2:D");
  const values = range.getValues();
  const numRows = range.getNumRows();
  const valueCounts: Record<string, { count: number; row: number }> = {};

  // Loop through each cell in the column and count the occurrences of each value
  for (let i = 0; i < numRows; i++) {
    const value = values[i][0];
    if (value !== "") {
      const key = value.toString().toLowerCase();
      if (!valueCounts.hasOwnProperty(key)) {
        valueCounts[key] = { count: 1, row: i + 2 };
      } else {
        valueCounts[key].count++;
      }
    }
  }

  return valueCounts;
}

/**
 * Function to highlight the duplicated slugs
 */
function highlightDuplicatedSlugs() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sugestões");

  const slugs = getSlugsData(sheet);

  // Loop through each value and highlight duplicates, reset non-duplicates
  for (const key in slugs) {
    const row = slugs[key].row;
    const cell = sheet.getRange(row, 4);

    if (slugs[key].count > 1) {
      cell.setBackground("#f4c842");
    } else {
      cell.setBackground(null);
    }
  }
}

function saveSlugs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    const suggestionsSheet = ss.getSheetByName("Sugestões");

    const data = suggestionsSheet.getDataRange().getValues() as Array<string[]>;

    validateIfHasDuplicatedSlugs(suggestionsSheet);

    const slugs = data.map((row) => ({
      sku: row[0],
      slug: row[3],
      ...(!!row[4] ? { description: row[4] } : {}),
    }));

    slugs.shift();

    const response = request("/product-slug/upsert-products", "lucius", {
      payload: {
        slugs,
      },
    });

    const statusCode = response.getResponseCode();
    const bodyResponse = response.getContentText();

    if (statusCode !== 200) {
      throw new Error(bodyResponse);
    }

    ss.toast("Slugs Cadastrados! " + bodyResponse);
  } catch (error) {
    if (error.message) {
      ss.toast(error.message);
    } else {
      ss.toast("Erro ao cadastrar slugs");
    }

    // deal with any errors
    Logger.log(error);
  }
}

function validateIfHasDuplicatedSlugs(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const slugs = getSlugsData(sheet);

  for (const key in slugs) {
    if (slugs[key].count > 1) {
      ss.toast("Existem slugs duplicados, verifique a planilha.");
      throw new Error(`Existem slugs duplicados, verifique a planilha.`);
    }
  }
}

const SECRET_PRODUCTION = "PARANAUEGUIDÃO";

const credentials = {
  username: "googlescripts@bbrands.com.br",
  password: "4X5GhNxHEF4JE6FG",
};

const environments = {
  Production: "",
  Staging: ".staging",
  Development: ".dev",
};

type Service = "stark" | "lucius" | "gandalf";

function getEndpoint(service: Service) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Config Sheet
  const configSheet = ss.getSheetByName("Config");

  // Options
  const configEnvironment = configSheet.getRange("B3").getValue();

  if (configEnvironment === "Production") {
    const ui = SpreadsheetApp.getUi(); // Same constiations.

    const result = ui.prompt("Qual a senha de acesso: ");

    // Process the user's response.
    if (result.getResponseText() !== SECRET_PRODUCTION) {
      ui.alert("Sem permissão de acesso.");
      throw new Error("Sem permissão de acesso.");
    }
  }

  const urlPrefix = `https://${service}`;
  const urlPrefixWithEnvironment = urlPrefix + environments[configEnvironment];
  const endpoint = urlPrefixWithEnvironment + ".bbrands.com.br";

  return endpoint;
}

export function request(
  endpoint: string,
  service: Service,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
) {
  const { payload, ...restOfOptions } = options;

  const response = UrlFetchApp.fetch(`${getEndpoint("gandalf")}/proxy`, {
    muteHttpExceptions: true,
    contentType: "application/json",
    method: "post",
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(
        `${credentials.username}:${credentials.password}`
      )}`,
      "x-proxy-url": `${getEndpoint(service)}${endpoint}`,
      ...restOfOptions.headers,
    },
    payload: JSON.stringify(payload ?? {}),
    ...restOfOptions,
  });

  return response;
}

const ByEnvironments = {
  Production: "",
  Staging: "staging",
  Development: "dev",
};

function getBeyoungUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Config Sheet
  const configSheet = ss.getSheetByName("Config");

  // Options
  const configEnvironment = configSheet.getRange("B3").getValue();

  const urlPrefix = `https://`;
  const urlPrefixWithEnvironment =
    urlPrefix + ByEnvironments[configEnvironment];
  const endpoint = urlPrefixWithEnvironment + ".beyoung.com.br";

  return endpoint;
}
