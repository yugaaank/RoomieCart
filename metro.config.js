const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('./transformer.js');

module.exports = config;
