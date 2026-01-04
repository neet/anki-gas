import esbuild from "rollup-plugin-esbuild";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: 'src/Code.ts',
  output: {
    file: 'Code.gs',
    format: 'cjs',
    exports: 'none'
  },
  treeshake: false,
  plugins: [
    resolve({
      extensions: ['.ts', '.js']
    }),
    esbuild({
      target: 'es2020',
      tsconfig: './tsconfig.json'
    })
  ]
};
