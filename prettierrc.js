module.exports = {
  semi: true,
  trailingComma: "es5",
  singleQuote: true,
  doubleQuote: false,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "avoid",
  quoteProps: "as-needed",
  endOfLine: "lf",
  embeddedLanguageFormatting: "auto",
  htmlWhitespaceSensitivity: "css",
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: "*.json",
      options: {
        printWidth: 80,
      },
    },
    {
      files: "*.md",
      options: {
        printWidth: 80,
        proseWrap: "always",
      },
    },
    {
      files: "*.yml",
      options: {
        tabWidth: 2,
      },
    },
  ],
};
