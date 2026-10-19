import js from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";

export default [
  { ignores: ["dist/**", "dev-dist/**"] },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: "readonly" },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
    },
  },
  { files: ["*.config.js"], languageOptions: { globals: globals.node } },
];
