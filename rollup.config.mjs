import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
    input: 'src/index.js',

    output: {
        file: 'dist/ororo.js',
        generatedCode: 'es5',
        format: 'iife',
    },
    plugins: [resolve(), babel({ babelHelpers: 'bundled' })],
};
