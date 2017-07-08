import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'src/index.js',
  dest: 'dist/slogged.js',
  plugins: [
    babel({
      exclude: 'node_modules/**/*'
    }),
    resolve(),
    commonjs()
  ],
  format: 'es'
};
