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

const lines = Object.keys(yamlMeasures).map(value => {
  const measureFamilyName = value;
  const labels = Object.keys(translations).reduce((result, locale) => {
    if (
      undefined === translations[locale] ||
      undefined === translations[locale].families ||
      undefined === translations[locale].families[measureFamilyName]
    )
      return result;

    return {
      ...result,
      [locale]: translations[locale].families[measureFamilyName]
    };
  }, {});
  const standardUnit = yamlMeasures[value].standard;
  const units = Object.keys(yamlMeasures[value].units).map(unitCode => ({
    code: unitCode,
    convert: yamlMeasures[value].units[unitCode].convert.map(convertObject => {
      const operator = Object.keys(convertObject)[0];

      return { operator, value: convertObject[operator] };
    }),
    symbol: yamlMeasures[value].units[unitCode].symbol
  }));

  return `('${measureFamilyName}', '${standardUnit}', '${JSON.stringify(
    labels
  )}', '${JSON.stringify(units)}')`;
});

console.log(`
INSERT INTO \`akeneo_measurement\` (\`code\`, \`standard_unit\`, \`labels\`, \`units\`)
VALUES
    ${lines.join(",\n    ")};
`);
