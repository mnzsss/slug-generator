import { Product } from "./core/interfaces/Product";

// TODO: Gravar no banco caso nao tenha o SITE_SLUG e se tiver remover antes de adicionar o novo
// TODO: Gerar string de categorias automático (e.g. Limpeza + Tratamento + Proteção)

/** @OnlyCurrentDoc */
const BLACK_WORDS = ["config", "beyoung", "v2", "spgroup"];

// function generateProductSlug(product: Product): Record<string, any> {
//   // Get the product name
//   const productName =
//     product?.attributes?.SITE_NAME?.value ||
//     product?.description ||
//     product.sku;

//   const cleanSlug = (slug: string) =>
//     slug.replace(/-|\+\s|\s\+|\+|\//g, "").replace(/\,|\s|\_/g, "-");

//   // Clean the product name, remove ['-', '+'] and replace whitespace and "," with '-'
//   let slug = cleanSlug(productName);

//   if (product.type === "BUNDLE") {
//     product.structure.slice(0, 3).forEach((item) => {
//       if (!item.gift) {
//         slug += `-${cleanSlug(item.description ?? item.sku ?? "")}`;
//       }
//     });
//   }

//   // Remove black words
//   if (BLACK_WORDS.length > 0) {
//     BLACK_WORDS.forEach((word) => {
//       const replacer = new RegExp(`(${word}[-])|(${word})|([-]${word})`, "gi");
//       slug = slug.replace(replacer, "");
//     });
//   }

//   // Remove - in the beginning and end of the string
//   slug = slug.replace(/([-]*)$/g, "").replace(/^([-]*)/g, "");

//   if (product.type !== "BUNDLE") {
//     if (product.categories) {
//       // Get the product categories if type is CATEGORY
//       const productCategories = product.categories
//         .filter((cat) => cat.type === "CATEGORY")
//         .map((cat) => cat.code);

//       // Concat the product categories with the product slug
//       if (productCategories.length > 0) {
//         slug.concat("-").concat(productCategories.join("-"));
//       }
//     }
//   }

//   return {
//     sku: product.sku,
//     slug: product.attributes?.SITE_SLUG?.value ?? "",
//     recommended_slug: `produtos/${slug.toLowerCase()}`,
//   };
// }

function generateProductSlugV2(product): Record<string, any> {
  if (!product)
    return {
      sku: "Erro",
      recommended_slug: "Erro com o produto",
    };

  const productName = (product?.attributes?.SITE_NAME?.value ?? "").replace(
    /<[^>]*>?/gm,
    ""
  );
  const productSubTitle = (
    product?.attributes?.SITE_SUBTITLE?.value ?? ""
  ).replace(/<[^>]*>?/gm, "");

  const productNameArr = [
    ...productName.split(" "),
    ...productSubTitle.split(" "),
  ].filter((word) => !["-", "+"].includes(word));

  const isBundle = product.type === "BUNDLE";

  const bundleCategory = (
    product.categories
      .find((category) => category.type === "BUNDLE")
      ?.description.split(" ") ?? ["kit", "beyoung"]
  )
    .join("-")
    .toLowerCase();
  const category = product.categories
    .find((category) => category.type === "CATEGORY")
    ?.description.split(" ")
    .join("-")
    .toLowerCase();
  const collectionCategory = product.categories
    .find((category) => category.type === "COLLECTION")
    ?.description.split(" ")
    .join("-")
    .toLowerCase();

  let slug = isBundle
    ? `/${bundleCategory}`
    : `/produtos/${collectionCategory}/${category}`;

  if (product.slug) {
    slug = slug.concat(`/${product.slug}`);
  }

  slug = slug.concat(
    `/${
      productNameArr.length > 1
        ? productNameArr
            .filter((word) => !!word)
            .map((word) =>
              word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            )
            .join("-")
        : productNameArr[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }`.toLowerCase()
  );

  return {
    sku: product.sku,
    slug: product.attributes?.SITE_SLUG?.value ?? "",
    recommended_slug: slug,
  };
}

function run() {
  try {
    // call the API
    var response = UrlFetchApp.fetch(
      "https://optimus.bbrands.com.br/api/campaign/find",
      {
        muteHttpExceptions: true,
        contentType: "application/json",
      }
    ).getContentText();

    var json = JSON.parse(response);

    // get data array
    const arrayData = [];

    for (const product of json.products) {
      if (product.type === "CONFIG") {
        for (const structure of product.structure) {
          arrayData.push(
            generateProductSlugV2({
              ...structure,
              categories: product.categories,
            })
          );
        }
      }

      arrayData.push(generateProductSlugV2(product));
    }

    // blank array to hold the data for Sheet
    const arrayProperties = [];

    // Add the arrayProperties to the array
    arrayData.forEach(function (el) {
      arrayProperties.push([el.sku, el.slug, el.recommended_slug]);
    });

    // select the output
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    // calculate the number of rows and columns needed
    const numRows = arrayProperties.length;
    const numCols = arrayProperties[0].length;

    // output the numbers to the sheet
    sheet.getRange(2, 1, numRows, numCols).setValues(arrayProperties.reverse());
  } catch (error) {
    // deal with any errors
    Logger.log(error);
  }
}
