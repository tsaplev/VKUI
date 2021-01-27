const path = require('path');
const cssCustomProperties = require('postcss-custom-properties');
const cssImport = require('postcss-import');
const autoprefixer = require('autoprefixer');
const selectorPrefixer = require('postcss-prefixer');
const csso = require('postcss-csso');

const importPropsFrom = [
  path.join(__dirname, 'src/styles/bright_light.css'),
  path.join(__dirname, 'src/styles/constants.css'),
  path.join(__dirname, 'src/styles/animations.css'),
];
let plugins = [
  cssImport(),
  cssCustomProperties({
    importFrom: importPropsFrom,
    preserve: true
  }),
  autoprefixer(),
  selectorPrefixer({
    prefix: 'vkui',
    ignore: [/^\.vkui/, '#mount']
  })
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(csso({ restructure: false }));
}

module.exports = { plugins, importPropsFrom };
