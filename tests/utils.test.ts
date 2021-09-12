import { assertEquals as equals } from "../deps/assert.ts";
import { merge, searchByExtension } from "../core/utils.ts";

Deno.test("merge options", () => {
  interface Options {
    foo: string;
    foo2?: string;
  }

  const defaults: Options = {
    foo: "bar",
  };
  const user: Partial<Options> = {
    foo2: "bar2",
  };
  const expected: Options = {
    foo: "bar",
    foo2: "bar2",
  };

  equals(expected, merge(defaults, user));
});

Deno.test("merge inner options", () => {
  interface Options {
    foo: string;
    foo2: SubOptions;
  }

  interface SubOptions {
    bar1: string;
    bar2?: string;
    bar3?: string;
  }

  const defaults: Options = {
    foo: "bar",
    foo2: {
      bar1: "bar1",
      bar2: "bar2",
    },
  };
  const user: Partial<Options> = {
    foo: "new bar",
    foo2: {
      bar1: "new bar1",
      bar3: "bar3",
    },
  };
  const expected = {
    foo: "new bar",
    foo2: {
      bar1: "new bar1",
      bar2: "bar2",
      bar3: "bar3",
    },
  };

  equals(expected, merge(defaults, user));
});

Deno.test("search by extension", () => {
  const extensions = new Map([
    [".tmpl.ts", "ts template"],
    [".tmpl.js", "js template"],
    [".js", "js"],
    [".ts", "ts"],
  ]);

  equals(searchByExtension("file.tmpl.ts", extensions), [
    ".tmpl.ts",
    "ts template",
  ]);
  equals(searchByExtension("file.ts", extensions), [".ts", "ts"]);
  equals(searchByExtension(".ts", extensions), [".ts", "ts"]);
  equals(searchByExtension("foo", extensions), undefined);
});