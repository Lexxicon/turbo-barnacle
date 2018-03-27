"use strict";

import clean from "rollup-plugin-clean";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

// let cfg;
// const i = process.argv.indexOf("--dest") + 1;
// if (i == 0) {
//   console.log("No destination specified - code will be compiled but not uploaded");
// } else if (i >= process.argv.length || (cfg = process.argv[i]) == null) {
//   throw new Error("Invalid upload destination");
// }

// console.log(cfg);

export default {
  input: "src/client/client.ts",
  output: {
    file: "dist/client/client.js",
    name: "blendIn",
    format: "umd",
    globals: {
      three: "THREE",
      "keycode-js": "KeyCode"
    },
    sourcemap: true
  },
  external: ["three", "keycode-js"],

  plugins: [
    clean(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" })
  ]
};
