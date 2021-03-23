const { importPropsFrom } = require('./postcss.config');

module.exports = {
  "extends": "stylelint-config-standard",
  "plugins": [
    "stylelint-value-no-unknown-custom-properties",
    "./tasks/stylelint-safe-rule-order"
  ],
  "rules": {
    "indentation": null,
    "number-leading-zero": "never",
    "block-no-empty": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "comment-empty-line-before": null,
    "comment-whitespace-inside": null,
    "no-descending-specificity": null,
    "no-duplicate-selectors": null,
    "length-zero-no-unit": [true, {
      "ignore": ["custom-properties"]
    }],
    "csstools/value-no-unknown-custom-properties": [true, {
      "importFrom": importPropsFrom
    }],
    "vkui/modular-selectors": "error"
  }
};
