import fetch from "node-fetch";

import {
  createGlossary,
  deleteGlossary,
  login,
  listGlossaries,
  updateGlossariesInCustomTranslation,
  uploadGlossaryItems,
} from "../libs/translator.mjs";

// skip on local env
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "preview") {
  throw new Error("Skipping updating MinHon glossaries");
}

/**
 * Convert JSON to CSV or TSV
 *
 * @param {string} format - target format. "csv" or "tsv".
 * @param {object} objs - object to convert to CSV or TSV
 * @param {object} options - options
 * @param {boolean} options.header - add header or not
 * @param {boolean} options.quotes - if false, do not enclose values with doublequotes. default is true.
 * @returns {string} CSV or TSV string
 */
function jsonTo(format, objs, options = { header: true, quotes: true }) {
  if (!Array.isArray(objs)) {
    throw new Error("Given JSON must be an array.");
  }

  if (format !== "csv" && format !== "tsv") {
    throw new Error(`Invalid format ${format}; Only "csv" and "tsv" are supported.`);
  }

  // List all of the keys
  const keys = [];
  for (const obj of objs) {
    for (const key of Object.keys(obj)) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  }

  // Convert object to lines of CSV
  const lines = objs.map(obj =>
    keys.map(key => {
      let val = obj[key]?.replaceAll("\"", "\"\"");

      if (typeof val === "undefined") {
        val = "";
      } else {
        // wrap with quotes if needed
        if (options.quotes === true) {
          val = `"${val}"`;
        }
      }

      return val;
    }).join(format === "csv" ? "," : "\t")
  ).join("\r\n");

  const headerLine = keys.map(key => `"${key}"`).join(format === "csv" ? "," : "\t");

  return (options.header ? headerLine + "\r\n" : "") + lines;
}

//
// Register Glossaries
//
const targetEnJaGlossaryName = `genshin-en-ja-${process.env.NODE_ENV}`;
const targetJaEnGlossaryName = `genshin-ja-en-${process.env.NODE_ENV}`;

const res = await fetch("https://genshin-dictionary.com/dataset/words.json");
const words = await res.json();

const accessToken = await login();
const glossaries = await listGlossaries({ accessToken });

// en -> ja
const enJaTSV = jsonTo("tsv", words.map(word => ({
  en: word.en,
  ja: word.ja,
})), { header: false, quotes: false });
const enJaGlossary = glossaries.find(glossary => glossary.name === targetEnJaGlossaryName);
if (enJaGlossary) {
  await deleteGlossary(enJaGlossary.id, { accessToken });
}
const newEnToJaGlossaryID = await createGlossary("en", "ja", { accessToken });
await uploadGlossaryItems(enJaTSV, newEnToJaGlossaryID, { accessToken });

// ja -> en
const jaEnTSV = jsonTo("tsv", words.map(word => ({
  ja: word.ja,
  en: word.en,
})), { header: false, quotes: false });
const jaEnGlossary = glossaries.find(glossary => glossary.name === targetJaEnGlossaryName);
if (jaEnGlossary) {
  await deleteGlossary(jaEnGlossary.id, { accessToken });
}
const newJaToEnGlossaryID = await createGlossary("ja", "en", { accessToken });
await uploadGlossaryItems(jaEnTSV, newJaToEnGlossaryID, { accessToken });

//
// Register Custom Translation
//
await updateGlossariesInCustomTranslation({
  id: process.env.NODE_ENV === "production" ? 1689 : 1687,
  srcLang: "en",
  destLang: "ja",
  glossaryID: newEnToJaGlossaryID,
  reverseGlossaryID: newJaToEnGlossaryID,
  accessToken,
});

await updateGlossariesInCustomTranslation({
  id: process.env.NODE_ENV === "production" ? 1688 : 1685,
  srcLang: "ja",
  destLang: "en",
  glossaryID: newJaToEnGlossaryID,
  reverseGlossaryID: newEnToJaGlossaryID,
  accessToken,
});
