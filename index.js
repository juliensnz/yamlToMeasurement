const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const yamlFileLocation = process.argv[2];
const translationsFolder = process.argv[3];

const file = fs.readFileSync(yamlFileLocation, "utf8");
const yamlMeasures = YAML.parse(file).measures_config;

const translations = fs
  .readdirSync(translationsFolder)
  .reduce((result, translationFilePath) => {
    const translationFile = fs.readFileSync(
      translationsFolder + translationFilePath,
      "utf8"
    );
    const yamlTranslations = YAML.parse(translationFile).pim_measure;
    const locale = path
      .basename(translationFilePath, ".yml")
      .replace("jsmessages.", "");

    if (0 !== translationFilePath.indexOf("jsmessages")) return result;

    return { ...result, [locale]: yamlTranslations };
  }, {});

const getLabels = (translations, type, key) =>
  Object.keys(translations).reduce((result, locale) => {
    if (
      undefined === translations[locale] ||
      undefined === translations[locale][type] ||
      undefined === translations[locale][type][key]
    )
      return result;

    return {
      ...result,
      [locale]: translations[locale][type][key]
    };
  }, {});

const lines = Object.keys(yamlMeasures).map(measureFamilyName => {
  const labels = getLabels(translations, "families", measureFamilyName);
  const standardUnit = yamlMeasures[measureFamilyName].standard;
  const units = Object.keys(yamlMeasures[measureFamilyName].units).map(unitCode => ({
    code: unitCode,
    labels: getLabels(translations, "units", unitCode),
    convert: yamlMeasures[measureFamilyName].units[unitCode].convert.map(convertObject => {
      const operator = Object.keys(convertObject)[0];

      return { operator, value: convertObject[operator] };
    }),
    symbol: yamlMeasures[measureFamilyName].units[unitCode].symbol
  }));

  return `('${measureFamilyName}', '${JSON.stringify(
    labels
  )}', '${standardUnit}', '${JSON.stringify(units)}')`;
});

console.log(`
INSERT INTO \`akeneo_measurement\` (\`code\`, \`labels\`, \`standard_unit\`, \`units\`)
VALUES
    ${lines.join(",\n    ")};
`);
