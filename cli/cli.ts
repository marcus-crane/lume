import { Command, CompletionsCommand } from "../deps/cliffy.ts";
import { getCurrentVersion, pluginNames, printError } from "./utils.ts";
import initCommand from "./init.ts";
import upgradeCommand from "./upgrade.ts";
import runCommand from "./run.ts";
import buildCommand from "./build.ts";

const init = new Command()
  .description("Create a config file for a new site.")
  .example("lume init", "Creates a _config.js file in the current directory.")
  .example(
    "lume init --config=_config.custom.ts",
    "Changes the config file path.",
  )
  .complete("plugin", () => pluginNames)
  .option(
    "--config <file>",
    "The config file path.",
    { default: "_config.js" },
  )
  .option(
    "--no-import-map",
    "Use full URLs instead of a import map.",
  )
  .option(
    "--plugins <plugins:string[]:plugin",
    "A comma-separated list of plugins to use.",
    { default: [] },
  )
  .action(initCommand);

const upgrade = new Command()
  .description("Upgrade your Lume executable to the latest version.")
  .example("lume upgrade", "Upgrades to the latest stable version.")
  .example("lume upgrade --dev", "Upgrades to the latest development version.")
  .option(
    "-d, --dev [dev:boolean]",
    "Install the latest development version (last Git commit).",
  )
  .action(upgradeCommand);

const run = new Command()
  .description("Run one or more scripts from the config file.")
  .example(
    "lume run deploy",
    "Runs the `deploy` script.",
  )
  .example(
    "lume run deploy --config=_config.ts",
    "Runs the `deploy` script from the _config.ts file.",
  )
  .example(
    "lume run build deploy",
    "Runs the `build` and `deploy` scripts.",
  )
  .option(
    "--root <root>",
    "The directory where Lume should work.",
    { default: "./" },
  )
  .option(
    "--config <config>",
    "The config file path.",
  )
  .option(
    "--src <src>",
    "The source directory for your site.",
    { default: "./" },
  )
  .option(
    "--dest <dest>",
    "The build destination.",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The URL location of the site.",
    { default: "http://localhost" },
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info).",
  )
  .action(runCommand);

const lume = new Command()
  .name("🔥lume")
  .version(getCurrentVersion)
  .description(
    "A static site generator for Deno. \nDocs: https://lumeland.github.io/",
  )
  .example("lume", "Builds the site.")
  .example("lume --serve", "Serves the site in localhost.")
  .example("lume upgrade", "Upgrades Lume to the latest version.")
  .example("lume run <script>", "Runs a custom script.")
  .example("lume [COMMAND] --help", "Shows the help for a command.")
  .option(
    "--root <root>",
    "The directory where Lume should work.",
    { default: "./" },
  )
  .option(
    "--config <config>",
    "The config file path.",
  )
  .option(
    "--src <src>",
    "The source directory for your site.",
    { default: "./" },
  )
  .option(
    "--dest <dest>",
    "The build destination.",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The URL location of the site.",
    { default: "http://localhost" },
  )
  .option(
    "--metrics [metrics]",
    "Show performance metrics or save them in a file.",
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info).",
  )
  .option(
    "-d, --dev [dev:boolean]",
    "Enable development mode (view draft pages).",
  )
  .option(
    "-s, --serve [serve:boolean]",
    "Start a live-reloading web server and watch changes.",
  )
  .option(
    "-p, --port <port:number>",
    "The port where the server runs.",
    { default: 3000, depends: ["serve"] },
  )
  .option(
    "-o, --open [open:boolean]",
    "Open the site in a browser.",
    { depends: ["serve"] },
  )
  .option(
    "-w, --watch [watch:boolean]",
    "Build and watch changes.",
  )
  .action(buildCommand)
  .command("init", init)
  .command("upgrade", upgrade)
  .command("run <script...>", run)
  .command("completions", new CompletionsCommand());

try {
  await lume.parse(Deno.args);
} catch (error) {
  printError(error);
  Deno.exit(1);
}