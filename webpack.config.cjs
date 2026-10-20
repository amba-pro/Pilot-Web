const fs = require("node:fs");
const path = require("node:path");
const { container: { ModuleFederationPlugin } } = require("webpack");

class CopyManifest {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("CopyManifest", () => {
      fs.copyFileSync(
        path.resolve(__dirname, "src/extension/extensions.config.json"),
        path.resolve(__dirname, "dist/frontend/extensions.config.json")
      );
    });
  }
}

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist/frontend"),
    filename: "[name].js",
    publicPath: "auto",
    uniqueName: "balloon_pop_demo",
    clean: true
  },
  optimization: { runtimeChunk: false, splitChunks: false },
  plugins: [
    new ModuleFederationPlugin({
      name: "balloon_pop_demo",
      library: { type: "var", name: "balloon_pop_demo" },
      filename: "balloon-pop.js",
      exposes: {
        "IOpenspaceView<PageContext>": "./src/extension/BalloonGameView.js"
      }
    }),
    new CopyManifest()
  ]
};
