import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import {
  createGenerator,
  MagicString,
  presetUno,
  resetUrl,
  transformerDirectives,
  transformerVariantGroup,
} from "../deps/unocss.ts";

import type Site from "../core/site.ts";
import type {
  SourceCodeTransformer,
  UnocssPluginContext,
  UserConfig,
} from "../deps/unocss.ts";

export interface Options {
  /**
   * Configurations for UnoCSS.
   * @see {@link https://unocss.dev/guide/config-file}
   */
  config: UserConfig;
  /**
   * Set the css filename for all generated styles,
   * Set to `false` to insert a <style> tag per page.
   * @defaultValue `false`
   */
  cssFile?: false | string;
  /** The list of extensions this plugin applies to */
  cssFileExtensions: string[];
  /**
   * Process CSS files using UnoCSS transformers.
   * @defaultValue `[transformerVariantGroup(), transformerDirectives()]`
   */
  cssFileTransformers: SourceCodeTransformer[];
  /**
   * Supported CSS reset options.
   * @see {@link https://github.com/unocss/unocss/tree/main/packages/reset}
   * @defaultValue `tailwind`
   */
  reset?: false | "tailwind" | "tailwind-compat" | "eric-meyer";
}

export const defaults: Options = {
  config: {
    presets: [presetUno()],
  },
  cssFile: false,
  cssFileExtensions: [".css"],
  cssFileTransformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  reset: "tailwind",
};

export default function (userOptions?: Partial<Options>) {
  const options: Options = merge(defaults, userOptions);

  return (site: Site) => {
    const uno = createGenerator(options.config);

    if (options.cssFileTransformers!.length > 0) {
      site.loadAssets(options.cssFileExtensions);
      site.process(options.cssFileExtensions, async (files) => {
        for (const file of files) {
          if (file.content) {
            const code = new MagicString(file.content.toString());
            for await (const { transform } of options.cssFileTransformers!) {
              await transform(
                code,
                file.src.path,
                { uno } as unknown as UnocssPluginContext,
              );
            }
            file.content = code.toString();
          }
        }
      });
    }

    if (options.cssFile === false) {
      // Insert a <style> tag for each page
      site.process([".html"], async (pages) => {
        const reset = await getResetCss(options);

        Promise.all(pages.map(async (page) => {
          const document = page.document!;
          const result = await uno.generate(
            document.documentElement?.innerHTML ?? "",
          );
          const css = reset ? `${reset}\n${result.css}` : result.css;

          if (css) {
            const style = document.createElement("style");
            style.innerText = css;
            page.document?.head?.appendChild(style);
          }
        }));
      });
      return;
    }

    // Generate the stylesheets for all pages
    site.process([".html"], async (pages) => {
      const classes = new Set<string>();

      await Promise.all(
        pages.map(async (page) =>
          await uno.generate(
            page.document?.documentElement?.innerHTML ?? "",
          )
            .then((res) => res.matched)
            .then((matched) => matched.forEach((match) => classes.add(match)))
        ),
      );

      // Create & merge stylesheets for all pages
      const reset = await getResetCss(options);
      const result = await uno.generate(classes);
      const css = reset ? `${reset}\n${result.css}` : result.css;

      // Output the CSS file
      const output = await site.getOrCreatePage(options.cssFile as string);
      if (output.content) {
        output.content += `\n${css}`;
      } else {
        output.content = css;
      }
    });
  };
}

/**
 * TODO: Replace with CSS Modules Import
 * @remarks Deno does not currently support CSS Modules.
 * @see {@link https://github.com/denoland/deno/issues/11961}
 */
async function getResetCss(options: Options) {
  return options.reset === false
    ? ""
    : await read(`${resetUrl}/${options.reset}.css`, false);
}
