import type { App, ObjectDirective, DirectiveBinding } from 'vue'
import type { DirectiveOptions, VueConstructor } from 'vue2'
import type { DirectiveBinding as DirectiveBinding2 } from 'vue2/types/options'

const matchBlocks = (val: string) => val.match(/[\w+:]+\{(.*?)\}/g)

export const variantwind = (className: string) => {
  let plainClasses = className
    .replace(/\r?\n|\r/g, '')
    .replace(/\s/g, ' ')
    .trim()

  // Array of blocks, e.g. ["lg:{bg-red-500 hover:bg-red-900}"]
  const blocks = matchBlocks(plainClasses)

  if (!blocks)
    return plainClasses

  const processedClasses = blocks
    .map((block) => {
      plainClasses = plainClasses.replace(block, '').trim()
      const [variant, classes] = block.split(/{(.+)}/)

      const withVariants = classes.split(' ').map(val => variant + val)
      return withVariants.join(' ')
    })
    .join(' ')
  return `${plainClasses} ${processedClasses}`
}

const cache = new Map()

const process = (
  el: HTMLElement,
  binding: DirectiveBinding<string> | DirectiveBinding2,
) => {
  const cachedClasses = cache.get(el.className)
  const cachedBindClasses = cache.get(binding)
  const cachedBindOldClasses = cache.get(binding.oldValue)

  const modifiers = Object.keys(binding.modifiers)
  const processClasses = (val: string) =>
    variantwind(
      modifiers.length ? `${modifiers.join(':')}:{${val}}` : val,
    )

  if (cachedClasses) {
    el.className = cachedClasses
  }
  else {
    const classes = variantwind(el.className)
    cache.set(el.className, classes)
    el.className = classes
  }

  if (binding.value !== binding.oldValue) {
    if (cachedBindOldClasses) {
      el.classList.remove(...cachedBindOldClasses)
    }
    else {
      const bindOldClasses = processClasses(binding.oldValue || '')
        .split(' ')
        .filter((i: string) => !!i)
      cache.set(binding.oldValue, bindOldClasses)
      el.classList.remove(...bindOldClasses)
    }
  }

  if (cachedBindClasses) {
    el.classList.add(...cachedBindClasses)
  }
  else {
    const bindClasses = processClasses(binding.value || '')
      .split(' ')
      .filter((i: string) => !!i)
    cache.set(binding.value, bindClasses)
    el.classList.add(...bindClasses)
  }
}

export const directive: ObjectDirective = {
  beforeMount: process,
  updated: process,
}

export const directive2: DirectiveOptions = {
  bind: process,
  update: process,
}

export const extractor = (content: string) => {
  const match = variantwind(content)
  const extract = match !== content ? match.split(' ') : []

  const directivishClasses: string[] = []
  const matchEveryDirective
    = content.match(/(v-.+)=["'`](.+|[\s\S]+?)["'`]/g) || []
  matchEveryDirective.forEach((val) => {
    const splitDirectiveNameAndWords = val.match(
      /([^'"\s&=](\w|-)[^'"\s&=]*)/g,
    )
    if (splitDirectiveNameAndWords) {
      const [directive, ...classes] = splitDirectiveNameAndWords
      const dottyDirective = directive.match(/\..+/)
      if (dottyDirective) {
        const variant = dottyDirective[0]
          .substr(1)
          .split('.')
          .map(val => `${val}:`)
          .join('')
        classes.forEach((val) => {
          directivishClasses.push(variant + val)
        })
      }
    }
  })

  // Capture as liberally as possible, including things like `h-(screen-1.5)`
  const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []

  // Capture classes within other delimiters like .block(class="w-1/2") in Pug
  const innerMatches
    = content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || []

  return broadMatches.concat(innerMatches, extract, directivishClasses)
}

const isVue3 = (app: App | VueConstructor): app is App =>
  app.version[0] === '3'

export default (
  app: App | VueConstructor,
  directives: string | string[] = 'variantwind',
) => {
  if (isVue3(app)) {
    if (Array.isArray(directives)) {
      directives.forEach((name) => {
        app.directive(name, directive)
        app.config.globalProperties[`$${name}`] = variantwind
      })
    }
    else {
      app.directive(directives, directive)
      app.config.globalProperties[`$${directives}`] = variantwind
    }
  }
  else {
    if (Array.isArray(directives)) {
      directives.forEach((name) => {
        app.directive(name, directive2)
        app.prototype[`$${name}`] = variantwind
      })
    }
    else {
      app.directive(directives, directive2)
      app.prototype[`$${directives}`] = variantwind
    }
  }
}
