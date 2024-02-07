import {
  ResolvedConfig,
  type Plugin,
  ViteDevServer,
  normalizePath,
} from "vite";
import { join } from "node:path";
import { cssFileFilter, processFile, compile } from "@layer-cake/integration";

const virtualImportExtensionCss = ".layer-cake.css";
const virtualImportExtensionJs = ".layer-cake.js";

const styleUpdateEvent = (fileId: string) =>
  `layer-cake-style-update:${fileId}`;

export function layerCake(): Plugin {
  let config: ResolvedConfig;
  let server: ViteDevServer;

  const cssMap = new Map<string, string>();

  const getAbsoluteVirtualFileId = (source: string) =>
    normalizePath(join(config.root, source));

  return {
    name: "layer-cake",
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
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
      });

      return {
        code: output,
        map: { mappings: "" },
      };
    },
  };
}
