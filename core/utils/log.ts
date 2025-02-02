import * as logger from "../../deps/log.ts";
import { env } from "./env.ts";
import {
  bold,
  brightGreen,
  cyan,
  dim,
  red,
  strikethrough,
  yellow,
} from "../../deps/colors.ts";

import type { LevelName, LogRecord } from "../../deps/log.ts";

// Get the log level from the environment variable LUME_LOG
let level = env<LevelName>("LUME_LOG")?.toUpperCase() as
  | LevelName
  | undefined;

if (!level || level === "NOTSET") {
  level = "INFO";
}

/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */
class ConsoleHandler extends logger.handlers.BaseHandler {
  override format(logRecord: LogRecord): string {
    let { msg } = logRecord;

    switch (logRecord.level) {
      case logger.LogLevels.WARNING:
        msg = `<yellow>WARNING</yellow> ${msg}`;
        break;
      case logger.LogLevels.ERROR:
        msg = `<red>ERROR</red> ${msg}`;
        break;
      case logger.LogLevels.CRITICAL:
        msg = `<Red>CRITICAL</Red> ${msg}`;
        break;
    }

    return msg.replaceAll(
      /<(\w+)>([^<]+)<\/\1>/g,
      (_, name, content) => logFormats[name]!(content),
    );
  }

  override log(msg: string) {
    console.log(msg);
  }
}

logger.setup({
  handlers: {
    console: new ConsoleHandler("DEBUG"),
  },
  loggers: {
    lume: {
      level: level as LevelName,
      handlers: ["console"],
    },
  },
});

export const log = logger.getLogger("lume");

const logFormats: Record<string, (str: string) => string> = {
  cyan,
  Cyan: (str: string) => bold(cyan(str)),
  red,
  Red: (str: string) => bold(red(str)),
  dim,
  Dim: (str: string) => bold(dim(str)),
  green: brightGreen,
  Green: (str: string) => bold(brightGreen(str)),
  yellow: yellow,
  Yellow: (str: string) => bold(yellow(str)),
  del: (str: string) => strikethrough(dim(str)),
};
