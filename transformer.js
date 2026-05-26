const upstreamTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = function (props) {
  const { src, filename } = props;
  
  // Check if we are transforming supabase-js
  if (filename.includes('node_modules/@supabase/supabase-js')) {
    // Replace dynamic import with a safe alternative for Hermes
    // This handles the OpenTelemetry dynamic import that causes Hermes to fail
    const patchedSrc = src.replace(
      /import\s*\(\s*\/\*\s*webpackIgnore:\s*true\s*\*\/[\s\S]*?OTEL_PKG\s*\)/g,
      'Promise.resolve(null)'
    );
    return upstreamTransformer.transform({ ...props, src: patchedSrc });
  }

  return upstreamTransformer.transform(props);
};
