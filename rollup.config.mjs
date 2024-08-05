import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        generatedCode: 'es5',
        format: 'iife',
    },
    plugins: [resolve(), babel({ babelHelpers: 'bundled' }), postcss({
        modules: true,
    })],
};
