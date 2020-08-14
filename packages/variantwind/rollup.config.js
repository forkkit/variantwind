import typescript from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: 'src/plugin.ts',
    output: [
      {
        file: 'dist/browser.js',
        format: 'iife',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: 'src/purge.ts',
    output: [
      {
        file: 'dist/purge.js',
        format: 'cjs',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
]
