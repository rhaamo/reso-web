import olicalColor from 'olical-color'

const HubOnlineStatus = Object.freeze({
  0: { name: 'Offline', hex: '#4f4f4f' },
  1: { name: 'Invisible', hex: '#4f4f4f' },
  2: { name: 'Away', hex: '#0fe1ff000' },
  3: { name: 'Busy', hex: '#ff0022' },
  4: { name: 'Online', hex: '#2fff00' },
  5: { name: 'Sociable', hex: '#0033ff' }
})

const HubUserSessionType = Object.freeze({
  0: { name: 'Unknown' },
  1: { name: 'Graphical Client' },
  2: { name: 'Chat Client' },
  3: { name: 'Headless' },
  4: { name: 'Bot' }
})

function parseResoniteText(input) {
  // Color mapping
  const colorMap = {
    'neutrals.dark': '#11151D',
    'neutrals.mid': '#86888B',
    'neutrals.light': '#E1E1E0',

    'hero.yellow': '#F8F770',
    'hero.green': '#59EB5C',
    'hero.red': '#FF7676',
    'hero.purple': '#BA64F2',
    'hero.cyan': '#61D1FA',
    'hero.orange': '#E69E50',

    'sub.yellow': '#484A2C',
    'sub.green': '#24512C',
    'sub.red': '#5D323A',
    'sub.purple': '#492F64',
    'sub.cyan': '#284C5D',
    'sub.orange': '#48392A',

    'dark.yellow': '#2B2E26',
    'dark.green': '#192D24',
    'dark.red': '#1A1318',
    'dark.purple': '#241E35',
    'dark.cyan': '#1A2A36',
    'dark.orange': '#292423'
  }

  // Stack to keep track of active transformations
  const transformStack = []

  // Process opening tags
  let output = input.replace(
    /<(\/?)([a-zA-Z]+)(?:=([^>]+))?>/g,
    (match, isClosing, tagName, attribute) => {
      if (isClosing) {
        // Handle closing tags
        const lastTransform = transformStack.pop()
        if (lastTransform?.tag === tagName) {
          return lastTransform.closeTag
        }
        return match // Return original if no matching open tag
      }

      // Handle opening tags
      switch (tagName.toLowerCase()) {
        case 'color':
          const color = attribute?.toLowerCase()
          const hexColor = colorMap[color] || olicalColor.toHex(color)
          transformStack.push({
            tag: tagName,
            closeTag: '</span>'
          })
          return `<span style="color: ${hexColor}">`

        case 'lowercase':
          transformStack.push({
            tag: tagName,
            closeTag: '</span>',
            transform: (text) => text.toLowerCase()
          })
          return '<span class="text-lowercase">'

        case 'uppercase':
          transformStack.push({
            tag: tagName,
            closeTag: '</span>',
            transform: (text) => text.toUpperCase()
          })
          return '<span class="text-uppercase">'

        case 'size':
          transformStack.push({
            tag: tagName,
            closeTag: '</span>',
            transform: (text) => text
          })
          return '<span class="size">'

        case 's':
          transformStack.push({
            tag: tagName,
            closeTag: '</span>'
          })
          return '<span style="text-decoration: line-through">'

        case 'u':
          transformStack.push({
            tag: tagName,
            closeTag: '</span>'
          })
          return '<span style="text-decoration: underline">'

        // Other tags already handled
        // b, br, i
        // To ignore
        // align, alpha, cspace, font, indent, line-height, line-indent, link, smallcaps, margin
        // mspace, noparse, nobr, page, pos, space, sprite, style, sub, sup, voffset, width
        // To handle https://github.com/Nutcake/ReCon/blob/main/lib/string_formatter.dart#L190
        // mark, size

        default:
          transformStack.push({
            tag: tagName,
            closeTag: '</span>'
          })
          return `<span class="${tagName}">`
        //return match // Return original if not a recognized tag
      }
    }
  )

  // Apply text transformations
  for (const transform of transformStack.filter((t) => t.transform)) {
    const regex = new RegExp(
      `<span class="text-${transform.tag.toLowerCase()}">([\\s\\S]*?)</span>`,
      'g'
    )
    output = output.replace(regex, (match, content) => {
      return `<span class="text-${transform.tag.toLowerCase()}">${transform.transform(content)}</span>`
    })
  }

  return output
}

export { HubOnlineStatus, HubUserSessionType, parseResoniteText }
