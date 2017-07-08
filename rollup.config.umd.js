import base from './rollup.config.base';

export default Object.assign(base, {
  format: 'umd',
  moduleName: 'slogged',
  dest: 'dist/slogged.umd.js'
});
