import {
  ResolvedConfig,
  type Plugin,
  ViteDevServer,
  normalizePath,
} from "vite";
import { join } from "node:path";
import {
  cssFileFilter,
  processFile,
  compile,
  getPackageInfo,
} from "@layer-cake/integration";

const virtualImportExtensionCss = ".layer-cake.css";
const virtualImportExtensionJs = ".layer-cake.js";

const styleUpdateEvent = (fileId: string) =>
  `layer-cake-style-update:${fileId}`;

export function layerCake(): Plugin {
  let config: ResolvedConfig;
  let server: ViteDevServer;

  let packageName: string;

  const cssMap = new Map<string, string>();

  const getAbsoluteVirtualFileId = (source: string) =>
    normalizePath(join(config.root, source));

  return {
    name: "layer-cake",
    configureServer(_server) {
      server = _server;
    },
    config(_userConfig, env) {
      const include =
        env.command === "serve" ? ["@layer-cake/core/injectStyles"] : [];

      return {
        optimizeDeps: { include },
        ssr: {
          external: [
            "@layer-cake/core",
            "@layer-cake/core/fileScope",
            "@layer-cake/core/adapter",
          ],
        },
      };
    },
    async configResolved(resolvedConfig) {
      config = resolvedConfig;

      packageName = getPackageInfo(config.root).name;
    },
    resolveId(id) {
      const [validId, query] = id.split("?");

      if (
        !validId.endsWith(virtualImportExtensionCss) &&
        !validId.endsWith(virtualImportExtensionJs)
      ) {
        return null;
      }

      const absoluteId = id.startsWith(config.root)
        ? id
        : getAbsoluteVirtualFileId(validId);

      if (cssMap.has(absoluteId)) {
        // Keep the original query string for HMR.
        return `${absoluteId}${query ? `?${query}` : ""}`;
      }

      return null;
    },
    load(id) {
      const [validId] = id.split("?");

      if (!cssMap.has(validId)) {
        return null;
      }

      const css = cssMap.get(validId);

      if (typeof css !== "string") {
        return null;
      }

      if (validId.endsWith(virtualImportExtensionCss)) {
        return css;
      }

      return `
        import { injectStyles } from '@layer-cake/core/inject-styles';

        const inject = (css) => injectStyles({
          fileScope: ${JSON.stringify({ filePath: validId })},
          css
        });

        inject(${JSON.stringify(css)});

        if (import.meta.hot) {
          import.meta.hot.on('${styleUpdateEvent(validId)}', (css) => {
            inject(css);
          });
        }
      `;
    },
    async transform(code, id, { ssr: isSSR } = {}) {
      const [validId] = id.split("?");

      if (!cssFileFilter.test(validId)) {
        return null;
      }

      if (isSSR) {
        // TODO
      }

      const { source, watchFiles } = await compile({
        filePath: validId,
        cwd: config.root,
        // TODO esbuildOptions
        // esbuildOptions,
      });

      for (const file of watchFiles) {
        if (config.command === "build" || file !== validId) {
          this.addWatchFile(file);
        }
      }

      const output = await processFile({
        source,
        filePath: validId,
        serializeVirtualCssPath: ({ fileScope, source: cssSource }) => {
          const rootRelativeId = `${fileScope.filePath}${config.command === "build" ? virtualImportExtensionCss : virtualImportExtensionJs}`;
          const absoluteId = getAbsoluteVirtualFileId(rootRelativeId);

          if (
            server &&
            cssMap.has(absoluteId) &&
            cssMap.get(absoluteId) !== source
          ) {
            const { moduleGraph } = server;
            const [module] = [
              ...(moduleGraph.getModulesByFile(absoluteId) || []),
            ];

            if (module) {
              moduleGraph.invalidateModule(module);

              // Vite uses this timestamp to add `?t=` query string automatically for HMR.
              module.lastHMRTimestamp =
                (module as any).lastInvalidationTimestamp || Date.now();
            }

            server.ws.send({
              type: "custom",
              event: styleUpdateEvent(absoluteId),
              data: cssSource,
            });
          }

          cssMap.set(absoluteId, cssSource);

          return `import "${rootRelativeId}"`;
        },
      });

      return {
        // @ts-ignore
        code: output || code,
        map: { mappings: "" },
      };
    },
  };
}
