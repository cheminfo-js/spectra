import json from 'rollup-plugin-json';

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'lib/index.js',
  },

  plugins: [
    json({
      exclude: 'node_modules',
      include: '*.json',
      preferConst: true,
      indent: '  ',
      compact: true,
      namedExports: true,
    }),
  ],
};
