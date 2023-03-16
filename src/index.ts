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

    const slugs = data
      .map((row) => ({
        sku: row[0],
        slug: row[3],
        ...(!!row[4] ? { description: row[4] } : {}),
      }))
      .shift();

    const response = request("/products-slug", "lucius", {
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
    ss.toast("Erro ao cadastrar slugs");

    // deal with any errors
    Logger.log(error);
  }
}

const SECRET_PRODUCTION = "1234";

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
    var ui = SpreadsheetApp.getUi(); // Same variations.

    var result = ui.prompt("Qual a senha de acesso: ");

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
