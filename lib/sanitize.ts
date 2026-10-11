import sanitizeHtml from "sanitize-html"

export function sanitizeCmsContent(html: string, lang?: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "iframe",
    ],
    allowedAttributes: {
      "*": ["class", "dir", "style"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      iframe: ["src", "width", "height", "allowfullscreen", "title"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
    ],
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^[a-z]+$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^[a-z]+$/i],
        "font-size": [/^\d+(px|em|rem|%)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  })
  return lang === "ar"
    ? clean
        .replace(/dir="ltr"/gi, "")
        .replace(/text-align:\s*left/gi, "text-align:right")
    : clean
}
