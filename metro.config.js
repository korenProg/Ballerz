// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// zustand's ESM build uses `import.meta.env` in the devtools middleware. On web
// Metro resolves zustand through the "import" condition and emits that into a
// classic script, so the whole bundle dies with
// "SyntaxError: Cannot use 'import.meta' outside a module" and nothing mounts.
// Pin zustand to its CJS build, which is free of import.meta.
const zustandRoot = path.join(__dirname, "node_modules", "zustand");
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "zustand" || moduleName.startsWith("zustand/")) {
    const sub = moduleName === "zustand" ? "index" : moduleName.slice("zustand/".length);
    const filePath = path.join(zustandRoot, `${sub}.js`);
    if (require("fs").existsSync(filePath)) {
      return { type: "sourceFile", filePath };
    }
  }
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform
  );
};

module.exports = config;
