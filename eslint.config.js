// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Text and TextInput come from components/ui/Text, which applies the app
    // font (Helvetica); react-native's own would silently use the system font.
    ignores: ['components/ui/Text.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message: 'Import Text/TextInput from components/ui/Text so they use the app font.',
            },
          ],
        },
      ],
    },
  },
]);
