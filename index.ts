import type { App, ObjectDirective, Plugin } from "vue";
import type { DirectiveOptions } from "vue2";
import mem from "mem";

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T;

function isTruthy<T>(value: T): value is Truthy<T> {
  return !!value;
}

export const variantwind = mem((className: string) => {
  let plainClasses = className;

  // Array of blocks, e.g. ["lg:{bg-red-500 hover:bg-red-900}"]
  const blocks = className.match(/\w*:\{(.*?)\}/g);

  if (!blocks) {
    return plainClasses;
  }

  const processedClasses = blocks
    .map((block) => {
      plainClasses = plainClasses.replace(block, "").trim();
      const [variant, classes] = block.split(/:(.+)/);

      const withVariants = classes
        .replace(/\{|\}/g, "")
        .replace(" ", " " + variant + ":");

      return withVariants.startsWith(variant)
        ? withVariants
        : variant + ":" + withVariants;
    })
    .join(" ");

  return plainClasses + " " + processedClasses;
});

//@ts-ignore
const process = (el) => {
  el.className = variantwind(el.className);
};

export const directive: ObjectDirective = {
  beforeMount: process,
  updated: process,
};

export const directive2: DirectiveOptions = {
  bind: process,
  update: process,
};

export const extractor = (content: string) => {
  let extract: string[] = [];
  const match = content.match(/[^<]*[^>]/g);

  if (match) {
    extract = match
      .map((item) => item.match(/\w*:\{(.*?)\}/g))
      .filter(isTruthy)
      .flatMap((classes) => variantwind(classes.join(" ")).trim().split(" "));
  }

  // Capture as liberally as possible, including things like `h-(screen-1.5)`
  const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

  // Capture classes within other delimiters like .block(class="w-1/2") in Pug
  const innerMatches =
    content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || [];

  return broadMatches.concat(innerMatches, extract);
};

//@ts-ignore
export default (app, directiveName = "variantwind") => {
  app.directive(directiveName, app.version[0] === "3" ? directive : directive2);
};
