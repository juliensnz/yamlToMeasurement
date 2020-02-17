const YAML = require('yaml')
const fs = require('fs');

const yamlFileLocation = process.argv[2];

const file = fs.readFileSync(yamlFileLocation, 'utf8')
const yamlMeasures = YAML.parse(file).measures_config;

const lines = Object.keys(yamlMeasures).map(value => {
  const measureFamilyName = value;
  const standardUnit = yamlMeasures[value].standard;
  const units = Object.keys(yamlMeasures[value].units).map(unitCode => ({
    code: unitCode,
    convert: yamlMeasures[value].units[unitCode].convert.map((value, operator) => ({operator,value})),
    symbol: yamlMeasures[value].units[unitCode].symbol
  }))

  return `('${measureFamilyName}', '${standardUnit}', '${(JSON.stringify(units))}')`;
})

console.log(`
INSERT INTO \`akeneo_measurement\` (\`code\`, \`standard_unit\`, \`units\`)
VALUES
    ${lines.join(',\n    ')};
`);
