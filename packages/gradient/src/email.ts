/**
 * Transactional email in the Shades system: HTML that holds up in Outlook on
 * Windows as well as Gmail, Apple Mail and Outlook.com, with a plain-text
 * twin, and the extras mail clients understand:
 *
 * - one-time codes set so Gmail and Apple Mail offer to copy or autofill them
 * - calendar invites (an .ics attachment, plus Google and Outlook links) that
 *   Gmail and Outlook turn into an "Add to calendar" card
 * - schema.org markup (JSON-LD) for Gmail's actions and reservation cards
 *
 * The rules that keep it working everywhere:
 * - tables and inline styles only
 * - a 520 px column, the width of a pass on a phone
 * - buttons drawn twice: VML for Outlook's Word engine, a styled link for
 *   everyone else
 * - web fonts only where the client loads them, with Arial in Outlook
 * - logos as PNG, because Gmail shows no SVG
 * - every value escaped, and only http(s) links
 *
 * It runs anywhere JavaScript runs (Node, Workers, the browser), with no
 * dependencies. Client brands pass their own colours, logo and font in
 * `brand`.
 *
 * Every message is built around one object, the pass: a coloured field with
 * the Shades mark in its corner like an issuer on a boarding pass, the one
 * fact that matters set large, label-over-value fields, and a perforated stub
 * for what comes after. Ink holds codes, soft red holds bookings, paper holds
 * everything else.
 *
 *   import { renderEmail, email, SHADES } from 'shades-gradient/email'
 */

export interface EmailBrand {
  name: string
  /** A PNG at twice the display size. */
  logo: { src: string; width: number; height: number }
  /** The same logo with light text, shown by mail apps in dark mode (Apple Mail, Outlook). */
  logoDark?: string
  home: string
  /** Lines in the ink footer above the home link: the legal name. */
  address: string
  accent: string
  onAccent: string
  ink: string
  muted: string
  line: string
  page: string
  panel: string
  /** Web font first, then the fallbacks. Outlook on Windows always uses Arial. */
  font: string
  /** Optional font stylesheet, loaded only by clients that load web fonts. */
  fontCss?: string
  /** The square mark as a PNG at twice its size, for the corner of a pass. */
  mark?: string
  /** Two PNG bands (1040 × 240 and 1040 × 220) above and below the hero card. */
  hero?: { top: string; bottom: string; ground: string }
  /** A transparent PNG (1040 × 320) where the page breaks into the ink footer. */
  edge?: string
  /** Links for the ink footer, set in two columns, first column first. */
  footerLinks?: { label: string; href: string }[]
  /** Social profiles for the ink footer, each with a white transparent PNG icon at 2×. */
  social?: { label: string; href: string; icon: string }[]
  /** The ink footer's closing lines: the company, the town, then the site. */
  legal?: string[]
  /** A notice about generated content, shown in the ink footer. */
  aiNote?: string
}

export type PassTone = 'ink' | 'red' | 'paper'

/** A pass's field, its text, its deep tone (labels, from the same hue) and its perforation. */
const TONES: Record<PassTone, { field: string; text: string; deep: string; perf: string }> = {
  ink: { field: '#1C1C20', text: '#FFFFFF', deep: '#BDBDC3', perf: '#3A3A40' },
  red: { field: '#FFF0F2', text: '#1C1C20', deep: '#AB000D', perf: '#FFC4CF' },
  paper: { field: '#EFEEEA', text: '#1C1C20', deep: '#56565E', perf: '#D5D3CE' },
}

/** Shades Media Group. Logo: the lockup PNG on gradient.shades.md. */
export const SHADES: EmailBrand = {
  name: 'Shades Media Group',
  logo: { src: 'https://gradient.shades.md/email/shades-lockup.png', width: 142, height: 32 },
  logoDark: 'https://gradient.shades.md/email/shades-lockup-dark.png',
  mark: 'https://gradient.shades.md/shades-mark.png',
  home: 'https://shades.md',
  address: 'Shades Media Group · Chișinău, Moldova',
  accent: '#E40523',
  onAccent: '#FFFFFF',
  ink: '#1C1C20',
  muted: '#56565E',
  line: '#E3E1DC',
  page: '#F7F6F3',
  panel: '#EFEEEA',
  font: "'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  fontCss: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap',
  hero: {
    top: 'https://gradient.shades.md/email/shades-hero-top.png',
    bottom: 'https://gradient.shades.md/email/shades-hero-bottom.png',
    ground: '#FFF0F2',
  },
  edge: 'https://gradient.shades.md/email/shades-edge.png',
  footerLinks: [
    { label: 'Help Center', href: 'https://shades.md/contact' },
    { label: 'Terms', href: 'https://shades.md/terms' },
    { label: 'Unsubscribe', href: 'https://shades.md/email-preferences' },
    { label: 'Privacy', href: 'https://shades.md/privacy' },
    { label: 'Email preferences', href: 'https://shades.md/email-preferences' },
  ],
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/shades.media.group/', icon: 'https://gradient.shades.md/email/social-instagram.png' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@shades.media.group', icon: 'https://gradient.shades.md/email/social-tiktok.png' },
  ],
  legal: ['Shades Media Group'],
  aiNote: 'Images or text may have been created or edited with AI.',
}

export interface Block {
  html: string
  text: string
}

export interface Attachment {
  filename: string
  content: string
  contentType: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  attachments: Attachment[]
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Only absolute http(s) links reach an email. */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

const NONE: Block = { html: '', text: '' }
const MSO_FONT = 'Arial,sans-serif'

/** The building blocks. Each returns HTML and its plain-text twin. */
export function blocks(brand: EmailBrand = SHADES) {
  const p = (value: string, size = 16, color = brand.ink, cls = 'g-e-text'): Block => ({
    html: `<p class="${cls}" style="margin:0 0 16px;font-size:${size}px;line-height:1.55;color:${color};mso-line-height-rule:exactly">${escapeHtml(value)}</p>`,
    text: value,
  })

  type Field = { label: string; value: string | null | undefined }

  /** Label-over-value pairs, two to a row, in a pass's own colours. */
  const fieldRows = (
    items: Field[],
    text: string,
    deep: string,
    cls = 'g-e-text',
    deepCls = 'g-e-muted',
  ) => {
    const present = items.filter((f): f is { label: string; value: string } => Boolean(f.value))
    if (!present.length) return NONE
    const cell = (f: { label: string; value: string }) =>
      `<td valign="top" width="50%" style="padding:0 12px 14px 0"><p class="${deepCls}" style="margin:0 0 2px;font-size:12px;line-height:1.4;color:${deep}">${escapeHtml(f.label)}</p><p class="${cls}" style="margin:0;font-size:15px;line-height:1.4;font-weight:700;color:${text}">${escapeHtml(f.value)}</p></td>`
    const rows: string[] = []
    for (let i = 0; i < present.length; i += 2)
      rows.push(
        `<tr>${cell(present[i]!)}${present[i + 1] ? cell(present[i + 1]!) : '<td></td>'}</tr>`,
      )
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed">${rows.join('')}</table>`,
      text: present.map((f) => `${f.label}: ${f.value}`).join('\n'),
    }
  }

  /** The ticket cut between a pass and its stub: two notches in the page colour and a dashed line. */
  const perforation = (tone: PassTone) => {
    const notch = (left: boolean) =>
      `<td width="12" class="g-e-page" style="width:12px;height:24px;background:${brand.page};border-radius:${left ? '0 12px 12px 0' : '12px 0 0 12px'};font-size:0;line-height:0">&nbsp;</td>`
    return `<tr><td style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${notch(true)}<td style="vertical-align:middle;padding:0 6px"><div class="g-e-perf-${tone}" style="border-top:2px dashed ${TONES[tone].perf};height:0;font-size:0;line-height:0">&nbsp;</div></td>${notch(false)}</tr></table></td></tr>`
  }

  /**
   * The pass: a label and the mark on its first line, the main fact, fields under
   * it and, after the perforation, the stub. Colour only, 16 px corners, no
   * border, no shadow: what happened is the headline's job, the pass holds the facts.
   */
  const pass = (opts: {
    tone?: PassTone
    label: string
    main: Block
    fields?: Field[]
    stub?: Block[]
  }): Block => {
    const tone = opts.tone ?? 'paper'
    const t = TONES[tone]
    const textCls = tone === 'ink' ? 'g-e-on-ink' : 'g-e-text'
    const deepCls = `g-e-deep-${tone}`
    const mark = brand.mark
      ? `<td align="right" width="22" style="width:22px"><img src="${escapeHtml(brand.mark)}" width="22" height="22" alt="" style="display:block;border:0;width:22px;height:22px"></td>`
      : ''
    const head = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr><td class="${deepCls}" style="font-size:12px;line-height:1.4;font-weight:600;color:${t.deep}">${escapeHtml(opts.label)}</td>${mark}</tr></table>`
    const fields = opts.fields ? fieldRows(opts.fields, t.text, t.deep, textCls, deepCls) : NONE
    const stub = (opts.stub ?? []).filter((x) => x.html)
    return {
      html:
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="g-e-pass-${tone}" style="margin:0 0 24px;background:${t.field};border-radius:16px;border-collapse:separate">` +
        `<tr><td style="padding:18px 20px ${fields.html || stub.length ? '6px' : '20px'}">${head}${opts.main.html}</td></tr>` +
        (fields.html
          ? `<tr><td style="padding:10px 20px ${stub.length ? '2px' : '6px'}">${fields.html}</td></tr>`
          : '') +
        (stub.length
          ? perforation(tone) +
            `<tr><td style="padding:12px 20px 16px">${stub.map((x) => x.html.replace(/margin:0 0 16px/g, 'margin:0')).join('')}</td></tr>`
          : '') +
        `</table>`,
      text: [opts.label, opts.main.text, fields.text, ...stub.map((x) => x.text)]
        .filter(Boolean)
        .join('\n'),
    }
  }

  return {
    paragraph: (value: string) => p(value),

    pass,

    /**
     * A booking or an event on a pass: the time large, the day under it, the
     * details as fields and, in the stub, the calendar links.
     */
    ticket(opts: {
      tone?: PassTone
      label: string
      time: string
      day: string
      fields?: Field[]
      stub?: Block[]
    }): Block {
      const tone = opts.tone ?? 'red'
      const t = TONES[tone]
      const cls = tone === 'ink' ? 'g-e-on-ink' : 'g-e-text'
      return pass({
        tone,
        label: opts.label,
        main: {
          html:
            `<p class="${cls}" style="margin:0;font-size:44px;line-height:1.05;font-weight:700;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;color:${t.text};mso-line-height-rule:exactly">${escapeHtml(opts.time)}</p>` +
            `<p class="${cls}" style="margin:6px 0 0;font-size:20px;line-height:1.3;font-weight:600;color:${t.text}">${escapeHtml(opts.day)}</p>`,
          text: `${opts.time}, ${opts.day}`,
        },
        fields: opts.fields,
        stub: opts.stub,
      })
    },
    /** Smaller, quieter text: a reason, a reassurance, a legal line. */
    note: (value: string) => p(value, 13, brand.muted, 'g-e-muted'),

    heading: (value: string): Block => ({
      html: `<h2 class="g-e-text" style="margin:24px 0 8px;font-size:18px;line-height:1.3;font-weight:700;color:${brand.ink}">${escapeHtml(value)}</h2>`,
      text: `\n${value}`,
    }),

    /**
     * A pill button that Outlook draws as VML, so it keeps its shape and colour in
     * Word's renderer. Width is estimated from the label so the VML fits.
     */
    button(label: string, url: string, primary = true): Block {
      const href = safeUrl(url)
      if (!href) return NONE
      const bg = primary ? brand.accent : brand.page
      const fg = primary ? brand.onAccent : brand.ink
      const border = primary ? brand.accent : brand.line
      const width = Math.max(160, Math.round(label.length * 9.2 + 56))
      const safe = escapeHtml(href)
      return {
        html:
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px"><tr><td>` +
          `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safe}" style="height:48px;v-text-anchor:middle;width:${width}px" arcsize="50%" strokecolor="${border}" fillcolor="${bg}"><w:anchorlock/><center style="color:${fg};font-family:${MSO_FONT};font-size:16px;font-weight:bold">${escapeHtml(label)}</center></v:roundrect><![endif]-->` +
          `<!--[if !mso]><!--><a class="${primary ? 'g-e-btn' : 'g-e-btn-alt'}" href="${safe}" style="display:inline-block;background:${bg};color:${fg};border:1px solid ${border};border-radius:999px;padding:13px 26px;font-family:${brand.font};font-size:16px;font-weight:600;line-height:20px;text-decoration:none;white-space:nowrap">${escapeHtml(label)}</a><!--<![endif]-->` +
          `</td></tr></table>`,
        text: `${label}: ${href}`,
      }
    },

    /** A quiet link on its own line. */
    link(label: string, url: string): Block {
      const href = safeUrl(url)
      if (!href) return NONE
      return {
        html: `<p style="margin:0 0 12px;font-size:14px;line-height:1.5"><a class="g-e-text" href="${escapeHtml(href)}" style="color:${brand.ink};text-decoration:underline">${escapeHtml(label)}</a></p>`,
        text: `${label}: ${href}`,
      }
    },

    /** A paper field holding other blocks, for a client brand's own content. */
    panel(...inner: Block[]): Block {
      const body = inner.filter((b) => b.html)
      return {
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="g-e-pass-paper" style="margin:0 0 24px;background:${brand.panel};border-radius:16px;border-collapse:separate"><tr><td style="padding:20px 20px 6px">${body.map((b) => b.html).join('')}</td></tr></table>`,
        text: body.map((b) => b.text).join('\n'),
      }
    },

    /** Label-over-value pairs, two to a row. */
    fields: (items: Field[]): Block => fieldRows(items, brand.ink, brand.muted),

    /**
     * A one-time code. Gmail offers "Copy" and Apple Mail offers AutoFill when the
     * digits sit next to the word "code" as plain text, so the label is real text
     * and the digits are not split into separate cells. Lead the subject with the
     * code, unspaced, the way the large account senders do: "418203 is your Shades
     * sign-in code", and start the preheader with "Your Shades code is 418203" (it is
     * also the plain text's first line). Gmail's "Copy code" card is its own decision, and it favours
     * senders with SPF, DKIM and DMARC all passing.
     */
    code(label: string, code: string, valid: string, stub?: string): Block {
      return pass({
        tone: 'ink',
        label,
        main: {
          html:
            `<p class="g-e-on-ink" style="margin:0;font-size:44px;line-height:1.05;font-weight:700;letter-spacing:0.12em;color:#FFFFFF;font-variant-numeric:tabular-nums;mso-line-height-rule:exactly">${escapeHtml(code)}</p>` +
            `<p class="g-e-deep-ink" style="margin:8px 0 0;font-size:14px;line-height:1.4;color:${TONES.ink.deep}">${escapeHtml(valid)}</p>`,
          text: `${label}: ${code}\n${valid}`,
        },
        stub: stub ? [p(stub, 13, TONES.ink.deep, 'g-e-deep-ink')] : undefined,
      })
    },

    /**
     * A feature: a picture across the column, then a title, a line or two and an
     * optional link. For updates and campaigns; real photographs or renders only.
     */
    feature(
      image: { src: string; width: number; height: number; alt: string },
      title: string,
      body: string,
      link?: { label: string; href: string },
    ): Block {
      const src = safeUrl(image.src)
      const href = link && safeUrl(link.href)
      const w = 472
      const h = Math.round((w * image.height) / image.width)
      return {
        html:
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px"><tr><td>` +
          (src ? `<img src="${escapeHtml(src)}" width="${w}" height="${h}" alt="${escapeHtml(image.alt)}" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;border-radius:16px;margin:0 0 16px">` : '') +
          `<h2 class="g-e-text" style="margin:0 0 6px;font-size:20px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:${brand.ink}">${escapeHtml(title)}</h2>` +
          `<p class="g-e-muted" style="margin:0 0 10px;font-size:16px;line-height:1.55;color:${brand.muted}">${escapeHtml(body)}</p>` +
          (href ? `<a class="g-e-text" href="${escapeHtml(href)}" style="font-size:15px;font-weight:600;color:${brand.ink};text-decoration:underline">${escapeHtml(link!.label)} →</a>` : '') +
          `</td></tr></table>`,
        text: [title, body, href ? `${link!.label}: ${href}` : ''].filter(Boolean).join('\n'),
      }
    },

    /** Terms and conditions: small, quiet, last before the footer. */
    fine: (value: string) => p(value, 12, brand.muted, 'g-e-muted'),

    divider(): Block {
      return {
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="g-e-rule" style="padding:8px 0 16px;border-top:1px solid ${brand.line};font-size:0;line-height:0">&nbsp;</td></tr></table>`,
        text: '',
      }
    },
  }
}

/** The default set, in Shades colours. */
export const email = blocks(SHADES)

export interface RenderOptions {
  lang: string
  subject: string
  /** The grey line clients show after the subject. */
  preheader: string
  heading: string
  lead?: string
  blocks: Block[]
  footer?: Block[]
  brand?: EmailBrand
  /** One short line on the brand colour above everything: the code, the deadline, the offer. */
  topline?: string
  /**
   * Campaign and update emails: the heading, lead and button sit on a white card
   * over the brand's hero pattern, with one short line (a date, a deadline) under the lead.
   */
  hero?: { meta?: string; button?: { label: string; href: string } }
  /** Ends the email on the ink footer: the curved edge, the brand's links and the address. */
  inkFooter?: boolean
  /** This message's own unsubscribe link; replaces the brand's Unsubscribe link. */
  unsubscribe?: string
  /** schema.org JSON-LD for Gmail: see viewAction() and eventReservation(). */
  schema?: object | object[]
  attachments?: Attachment[]
}

/** The whole message: HTML for every client, and its plain-text twin. */
export function renderEmail(opts: RenderOptions): RenderedEmail {
  const brand = opts.brand ?? SHADES
  const b = blocks(brand)
  const lead = opts.lead
    ? {
        html: `<p class="g-e-muted" style="margin:0 0 24px;font-size:17px;line-height:1.5;color:${brand.muted}">${escapeHtml(opts.lead)}</p>`,
        text: opts.lead,
      }
    : NONE
  const hero = opts.hero && brand.hero ? opts.hero : undefined
  const body = [hero ? NONE : lead, ...opts.blocks].filter((x) => x.html)
  const footer = [...(opts.footer ?? []), b.note(brand.address)].filter((x) => x.html)
  const schema = opts.schema
    ? `<script type="application/ld+json">${JSON.stringify(opts.schema).replace(/</g, '\\u003c')}</script>`
    : ''
  const home = safeUrl(brand.home) ?? ''
  // Dark mail apps swap in the light-text logo; everywhere else it stays hidden.
  const darkLogo = brand.logoDark
    ? `<!--[if !mso]><!--><img class="g-e-logo-dark" src="${escapeHtml(brand.logoDark)}" width="${brand.logo.width}" height="${brand.logo.height}" alt="${escapeHtml(brand.name)}" style="display:none;max-height:0;overflow:hidden;border:0;outline:none;width:${brand.logo.width}px;height:auto"><!--<![endif]-->`
    : ''

  const headingHtml = `<h1 class="g-e-text" style="margin:0 0 10px;font-size:30px;line-height:1.12;font-weight:700;letter-spacing:-0.025em;color:${brand.ink};mso-line-height-rule:exactly">${escapeHtml(opts.heading)}</h1>`
  const topline = opts.topline
    ? `<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:${brand.accent};padding:10px 16px;font-family:${brand.font};font-size:14px;line-height:1.4;font-weight:600;color:${brand.onAccent}">${escapeHtml(opts.topline)}</td></tr></table></td></tr>`
    : ''
  // The hero: a band of the brand's figures, the white card, a second band. Images and a
  // flat ground only, so every client (Outlook included) shows it the same.
  const art = brand.hero
  const heroButton = hero?.button ? b.button(hero.button.label, hero.button.href).html.replace('style="margin:0 0 12px"', 'align="center" style="margin:8px auto 0"') : ''
  const heroRow = hero && art
    ? `<tr><td bgcolor="${art.ground}" style="background:${art.ground};border-radius:20px;padding:0">
<img src="${escapeHtml(art.top)}" width="520" height="120" alt="" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:20px 20px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 28px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;border-collapse:separate"><tr><td align="center" style="padding:36px 28px 32px;font-family:${brand.font};text-align:center">
<h1 style="margin:0 0 12px;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-0.025em;color:#1C1C20;text-wrap:balance;mso-line-height-rule:exactly">${escapeHtml(opts.heading)}</h1>
${opts.lead ? `<p style="margin:0 0 12px;font-size:17px;line-height:1.5;color:#56565E">${escapeHtml(opts.lead)}</p>` : ''}
${hero.meta ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.4;font-weight:600;color:#1C1C20">${escapeHtml(hero.meta)}</p>` : ''}
${heroButton}
</td></tr></table>
</td></tr></table>
<img src="${escapeHtml(art.bottom)}" width="520" height="110" alt="" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:0 0 20px 20px">
</td></tr>
<tr><td style="height:28px;line-height:28px;font-size:0">&nbsp;</td></tr>`
    : ''
  const plainFooter = `<tr><td class="g-e-col" style="padding:8px 24px 0;font-family:${brand.font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="g-e-rule" style="padding:20px 0 0;border-top:1px solid ${brand.line}">
${footer.map((x) => x.html.replace('margin:0 0 16px', 'margin:0 0 6px')).join('\n')}
</td></tr></table>
</td></tr>`
  // The ink footer: the page breaks into ink, then the links in two columns, the notes,
  // the company lines with the site, and the social icons.
  const links = (brand.footerLinks ?? [])
    .map((l) => (l.label === 'Unsubscribe' && opts.unsubscribe ? { ...l, href: opts.unsubscribe } : l))
    .filter((l) => safeUrl(l.href))
  const half = Math.ceil(links.length / 2)
  const column = (items: typeof links) =>
    items
      .map((l) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.4"><a href="${escapeHtml(safeUrl(l.href)!)}" style="color:#ECECEA;text-decoration:none">${escapeHtml(l.label)}</a></p>`)
      .join('')
  const small = (value: string) => `<p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#9A9AA2">${escapeHtml(value)}</p>`
  const socials = (brand.social ?? [])
    .filter((x) => safeUrl(x.href))
    .map((x) => `<a href="${escapeHtml(safeUrl(x.href)!)}" style="display:inline-block;margin-left:14px;text-decoration:none"><img src="${escapeHtml(x.icon)}" width="22" height="22" alt="${escapeHtml(x.label)}" style="display:block;border:0"></a>`)
    .join('')
  const homeLabel = home.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const inkFooter = `<tr><td style="padding:24px 0 0;line-height:0">${brand.edge ? `<img src="${escapeHtml(brand.edge)}" width="520" height="160" alt="" style="display:block;width:100%;max-width:520px;height:auto;border:0">` : ''}</td></tr>
<tr><td bgcolor="#141416" style="background:#141416;border-radius:0 0 20px 20px;padding:8px 24px 32px;font-family:${brand.font}">
${links.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td width="50%" valign="top">${column(links.slice(0, half))}</td><td width="50%" valign="top">${column(links.slice(half))}</td></tr></table>` : ''}
${footer.filter((x) => x.text !== brand.address).map((x) => x.html.replace(/color:#[0-9A-Fa-f]{6}/, 'color:#9A9AA2').replace('margin:0 0 16px', 'margin:0 0 6px')).join('\n')}
${brand.aiNote ? `<p style="margin:0 0 42px;font-size:10px;line-height:1.5;color:#9A9AA2">${escapeHtml(brand.aiNote)}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="bottom">${(brand.legal ?? [brand.address]).map(small).join('')}${home ? `<p style="margin:0;font-size:12px;line-height:1.5"><a href="${escapeHtml(home)}" style="color:#ECECEA;text-decoration:none">${escapeHtml(homeLabel)}</a></p>` : ''}</td>
<td valign="bottom" align="right" style="white-space:nowrap">${socials}</td>
</tr></table>
</td></tr>`

  const html = `<!doctype html>
<html lang="${escapeHtml(opts.lang)}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<title>${escapeHtml(opts.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>table,td,p,a,h1,h2{font-family:${MSO_FONT} !important}</style><![endif]-->
${brand.fontCss ? `<!--[if !mso]><!--><link href="${escapeHtml(brand.fontCss)}" rel="stylesheet"><!--<![endif]-->` : ''}
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}
#MessageViewBody a{color:inherit;text-decoration:none}
@media (max-width:600px){.g-e-col{padding-left:20px !important;padding-right:20px !important}}
@media (prefers-color-scheme:dark){
.g-e-page{background:#141416 !important}
.g-e-logo-dark{display:block !important;max-height:none !important}.g-e-logo:not(:only-child){display:none !important}
.g-e-text,.g-e-on-ink{color:#ECECEA !important}
.g-e-muted,.g-e-deep-paper{color:#BDBDC3 !important}
.g-e-rule{border-color:#2A2A31 !important}
.g-e-btn-alt{background:transparent !important;color:#ECECEA !important;border-color:#3A3A40 !important}
.g-e-pass-ink{background:#26262E !important}.g-e-perf-ink{border-color:#45454E !important}
.g-e-pass-red{background:#3A1015 !important}.g-e-deep-red{color:#FF9AAA !important}.g-e-perf-red{border-color:#6A2530 !important}
.g-e-pass-paper{background:#1E1E22 !important}.g-e-perf-paper{border-color:#3A3A40 !important}
}
[data-ogsc] .g-e-text{color:#ECECEA !important}
[data-ogsc] .g-e-logo-dark{display:block !important;max-height:none !important}[data-ogsc] .g-e-logo:not(:only-child){display:none !important}
[data-ogsc] .g-e-muted{color:#BDBDC3 !important}
[data-ogsb] .g-e-pass-paper{background:#1E1E22 !important}
</style>
</head>
<body class="g-e-page" style="margin:0;padding:0;background:${brand.page};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
${schema}
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(opts.preheader)}${'&#8199;&#847;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="g-e-page" style="background:${brand.page}">
<tr><td align="center" style="padding:32px 12px 40px">
<!--[if mso]><table role="presentation" width="520" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:${brand.font}">
${topline}
<tr><td class="g-e-col" style="padding:0 24px 28px"><a href="${escapeHtml(home)}" style="text-decoration:none"><img class="g-e-logo" src="${escapeHtml(brand.logo.src)}" width="${brand.logo.width}" height="${brand.logo.height}" alt="${escapeHtml(brand.name)}" style="display:block;border:0;outline:none;width:${brand.logo.width}px;height:auto;font-family:${MSO_FONT};font-size:18px;font-weight:bold;color:${brand.accent}">${darkLogo}</a></td></tr>
${heroRow}
<tr><td class="g-e-col" style="padding:0 24px;font-family:${brand.font};color:${brand.ink}">
${hero ? '' : headingHtml}
${body.map((x) => x.html).join('\n')}
</td></tr>
${opts.inkFooter ? inkFooter : plainFooter}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`

  // The preheader leads the plain text too: for a code email it is "Your <product> code is
  // 418203", the line mail apps read when they offer to copy or fill the code.
  const text = [
    opts.preheader,
    '',
    opts.heading,
    ...(opts.lead ? ['', opts.lead] : []),
    '',
    ...opts.blocks.filter((x) => x.text).flatMap((x) => [x.text, '']),
    '--',
    brand.name,
    ...footer.map((x) => x.text),
    '',
  ].join('\n')

  return { subject: opts.subject, html, text, attachments: opts.attachments ?? [] }
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  /** Stable across updates, so a changed time replaces the old entry. */
  uid: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  url?: string
  organizer?: { name: string; email: string }
  attendee?: { name?: string; email: string }
  /** Raise it with every change to the same event. */
  sequence?: number
  /** CANCEL removes it from the reader's calendar. */
  status?: 'CONFIRMED' | 'CANCELLED'
}

const icsDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
const icsText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')

/** Folds a content line at 75 octets, as RFC 5545 asks. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let current = ''
  let size = 0
  for (const char of line) {
    const width = new TextEncoder().encode(char).length
    if (size + width > (out.length ? 74 : 75)) {
      out.push(current)
      current = ''
      size = 0
    }
    current += char
    size += width
  }
  out.push(current)
  return out.join('\r\n ')
}

/**
 * An .ics file. With an organizer and an attendee it is an invitation
 * (METHOD:REQUEST): Gmail and Outlook show it as an event card with Yes, No
 * and Maybe. Without them it is a plain calendar file the reader can add.
 */
export function icsFile(
  event: CalendarEvent,
  prodId = '-//Shades Media Group//Gradient//EN',
): Attachment {
  const invite = Boolean(event.organizer && event.attendee)
  const cancelled = event.status === 'CANCELLED'
  const method = cancelled ? 'CANCEL' : invite ? 'REQUEST' : 'PUBLISH'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${icsText(event.uid)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(event.end)}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    `STATUS:${event.status ?? 'CONFIRMED'}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${icsText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(safeUrl(event.url) ? [`URL:${safeUrl(event.url)}`] : []),
    ...(event.organizer
      ? [`ORGANIZER;CN=${icsText(event.organizer.name)}:mailto:${event.organizer.email}`]
      : []),
    ...(event.attendee
      ? [
          `ATTENDEE;CN=${icsText(event.attendee.name ?? event.attendee.email)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendee.email}`,
        ]
      : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(event.title)}`,
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return {
    filename: cancelled ? 'cancel.ics' : 'invite.ics',
    content: lines.map(fold).join('\r\n') + '\r\n',
    contentType: `text/calendar; charset=utf-8; method=${method}`,
  }
}

/** "Add to Google Calendar": opens the event, filled in, in the reader's calendar. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(event.start)}/${icsDate(event.end)}`,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** "Add to Outlook": the same event in Outlook on the web. */
export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    ...(event.description ? { body: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`
}

/** The calendar links as a block, under the booking. */
export function calendarLinks(
  event: CalendarEvent,
  labels: { google: string; outlook: string },
  brand: EmailBrand = SHADES,
): Block {
  const links = [
    [labels.google, googleCalendarUrl(event)],
    [labels.outlook, outlookCalendarUrl(event)],
  ]
  return {
    html: `<p style="margin:0 0 16px;font-size:14px;line-height:1.6">${links
      .map(
        ([label, url]) =>
          `<a class="g-e-text" href="${escapeHtml(url!)}" style="color:${brand.ink};text-decoration:underline;margin-right:16px">${escapeHtml(label!)}</a>`,
      )
      .join('')}</p>`,
    text: links.map(([label, url]) => `${label}: ${url}`).join('\n'),
  }
}

// ── Gmail markup ──────────────────────────────────────────────────────────────

/**
 * A one-click action button beside the subject in Gmail's inbox. Gmail shows
 * it only for senders registered with Google
 * (developers.google.com/gmail/markup/registering-with-google) that pass SPF
 * and DKIM; elsewhere it is ignored, so it is always safe to include.
 */
export function viewAction(name: string, url: string, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EmailMessage',
    ...(description ? { description } : {}),
    potentialAction: { '@type': 'ViewAction', name, url, target: url },
  }
}

/** A booking card in Gmail, with the time, place and "Add to calendar". Same registration rule. */
export function eventReservation(opts: {
  reservationId: string
  name: string
  start: Date
  end: Date
  location: { name: string; address: string }
  person: string
  organizer: string
  url?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EventReservation',
    reservationNumber: opts.reservationId,
    reservationStatus: 'https://schema.org/ReservationConfirmed',
    underName: { '@type': 'Person', name: opts.person },
    reservationFor: {
      '@type': 'Event',
      name: opts.name,
      startDate: opts.start.toISOString(),
      endDate: opts.end.toISOString(),
      organizer: { '@type': 'Organization', name: opts.organizer },
      location: {
        '@type': 'Place',
        name: opts.location.name,
        address: opts.location.address,
      },
    },
    ...(opts.url ? { modifyReservationUrl: opts.url } : {}),
  }
}
