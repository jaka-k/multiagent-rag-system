module.exports = {
  singleQuote: true,
  trailingComma: 'none',
  arrowParens: 'always',
  semi: false,
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      options: {
        // Matching the object-curly-newline option to align with ESLint
        objectCurlyNewline: 'always'
      }
    }
  ]
}
