import { bundleAsync, transform } from "../deps/lightningcss.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import textLoader from "../core/loaders/text.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { posix } from "../deps/path.ts";

import type Site from "../core/site.ts";
import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformOptions,
} from "../deps/lightningcss.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string | false;

  /** Options passed to parcel_css */
  options?: Omit<BundleAsyncOptions<CustomAtRules>, "filename">;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
  includes: "",
  options: {
    minify: true,
    drafts: {
      customMedia: true,
    },
    targets: {
      android: version(98),
      chrome: version(98),
      edge: version(98),
      firefox: version(97),
      ios_saf: version(15),
      safari: version(15),
      opera: version(83),
      samsung: version(16),
    },
  },
};

/** A plugin to load all CSS files and process them using parcelCSS */
export default function (userOptions?: Options) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    site.loadAssets(options.extensions);

    if (options.includes) {
      site.process(options.extensions, lightningCSSBundler);
      site.ignore(options.includes);
    } else {
      site.process(
        options.extensions,
        (pages) => pages.forEach(lightningCSSTransformer),
      );
    }

    function lightningCSSTransformer(file: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );

      // Process the code with parcelCSS
      const code = new TextEncoder().encode(content);
      const transformOptions: TransformOptions<CustomAtRules> = {
        filename,
        code,
        sourceMap: enableSourceMap,
        inputSourceMap: JSON.stringify(sourceMap),
        ...options.options,
      };

      const result = transform(transformOptions);
      const decoder = new TextDecoder();

      saveAsset(
        site,
        file,
        decoder.decode(result.code),
        enableSourceMap ? decoder.decode(result.map!) : undefined,
      );
    }

    /**
     * Bundles all CSS files into a single file
     * This cannot be done in parallel because ligthningcss has a bug that mixes the imports of all files
     * Seems like executing the bundler in sequence fixes the issue
     */
    async function lightningCSSBundler(files: Page[]) {
      for (const file of files) {
        const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
          site,
          file,
        );

        const { includes } = site.options;

        // Process the code with lightningCSS
        const bundleOptions: BundleAsyncOptions<CustomAtRules> = {
          filename,
          sourceMap: enableSourceMap,
          inputSourceMap: JSON.stringify(sourceMap),
          ...options.options,
          resolver: {
            resolve(id: string, from: string) {
              return resolveInclude(id, includes, posix.dirname(from));
            },
            async read(file: string) {
              if (file === filename) {
                return content;
              }

              if (file.startsWith("http")) {
                return read(file, false, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
                  },
                });
              }

              return await site.getContent(file, textLoader) as string;
            },
          },
        };

        const result = await bundleAsync(bundleOptions);
        const decoder = new TextDecoder();

        saveAsset(
          site,
          file,
          decoder.decode(result.code),
          enableSourceMap ? decoder.decode(result.map!) : undefined,
        );
      }
    }
  };
}

/**
 * Convert a version number to a single 24-bit number
 */
export function version(major: number, minor = 0, patch = 0): number {
  return (major << 16) | (minor << 8) | patch;
}
