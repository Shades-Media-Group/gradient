import { describe, expect, it } from 'vitest'
import {
  email,
  escapeHtml,
  eventReservation,
  googleCalendarUrl,
  icsFile,
  renderEmail,
  safeUrl,
  viewAction,
} from './email'

const event = {
  uid: 'booking-42@shades.md',
  title: 'Brand workshop, Shades; room 2',
  start: new Date('2027-03-04T09:00:00Z'),
  end: new Date('2027-03-04T10:30:00Z'),
  location: 'str. Ismail 88, Chișinău',
  description: 'Bring the brief.\nCoffee is on us.',
  organizer: { name: 'Shades Media Group', email: 'hello@shades.md' },
  attendee: { name: 'Ana Popescu', email: 'ana@company.md' },
}

describe('renderEmail', () => {
  const message = renderEmail({
    lang: 'en',
    subject: 'Your Shades code: 418203',
    preheader: 'It works for 10 minutes.',
    heading: 'Confirm your email <now>',
    blocks: [
      email.code('Your code', '418203', 'Valid for 10 minutes'),
      email.button('Open the brief', 'https://shades.md/brief'),
      email.button('Bad link', 'javascript:alert(1)'),
    ],
    schema: viewAction('Open the brief', 'https://shades.md/brief'),
  })

  it('closes every table it opens', () => {
    const count = (tag: string) => message.html.split(tag).length - 1
    expect(count('<table')).toBe(count('</table>'))
  })

  it('escapes what it is given', () => {
    expect(message.html).toContain('Confirm your email &lt;now&gt;')
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;')
  })

  it('draws buttons for Outlook and for everyone else', () => {
    expect(message.html).toContain('<v:roundrect')
    expect(message.html).toContain('<!--[if !mso]><!-->')
    expect(message.html).toContain('<!--[if mso]><table role="presentation" width="520"')
  })

  it('drops links that are not http(s)', () => {
    expect(message.html).not.toContain('javascript:')
    expect(safeUrl('mailto:a@b.c')).toBeNull()
  })

  it('keeps the code next to the word "code" in the plain text', () => {
    expect(message.text).toContain('Your code: 418203')
  })

  it('opens the plain text with the preheader, not the brand', () => {
    expect(message.text.split('\n')[0]).toBe('It works for 10 minutes.')
    expect(message.text).toContain('--\nShades Media Group')
  })

  it('carries Gmail markup that cannot break out of its script', () => {
    const html = renderEmail({
      lang: 'en',
      subject: 's',
      preheader: 'p',
      heading: 'h',
      blocks: [],
      schema: viewAction('</script><b>', 'https://shades.md'),
    }).html
    expect(html).toContain('"@type":"ViewAction"')
    expect(html).not.toContain('</script><b>')
  })
})

describe('calendar', () => {
  it('writes an invitation that RFC 5545 readers accept', () => {
    const ics = icsFile(event)
    expect(ics.contentType).toBe('text/calendar; charset=utf-8; method=REQUEST')
    expect(ics.content).toContain('DTSTART:20270304T090000Z')
    expect(ics.content).toContain('SUMMARY:Brand workshop\\, Shades\\; room 2')
    expect(ics.content).toContain('DESCRIPTION:Bring the brief.\\nCoffee is on us.')
    expect(
      ics.content.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true)
    expect(ics.content.endsWith('\r\n')).toBe(true)
  })

  it('cancels with the same uid', () => {
    const ics = icsFile({ ...event, status: 'CANCELLED', sequence: 1 })
    expect(ics.content).toContain('METHOD:CANCEL')
    expect(ics.content).toContain('UID:booking-42@shades.md')
  })

  it('links to Google Calendar with UTC times', () => {
    expect(googleCalendarUrl(event)).toContain('dates=20270304T090000Z%2F20270304T103000Z')
  })

  it('describes the booking for Gmail', () => {
    const data = eventReservation({
      reservationId: '42',
      name: event.title,
      start: event.start,
      end: event.end,
      location: { name: 'Shades studio', address: event.location },
      person: 'Ana Popescu',
      organizer: 'Shades Media Group',
    })
    expect(data['@type']).toBe('EventReservation')
    expect(data.reservationFor.startDate).toBe('2027-03-04T09:00:00.000Z')
  })
})

describe('campaign and update emails', () => {
  const message = renderEmail({
    lang: 'en',
    subject: 'Workshops are open',
    preheader: 'Two days with our designers.',
    topline: 'Workshops are open for November',
    heading: 'A brand your whole team can use.',
    lead: 'Logo, colour and type as one system.',
    hero: { meta: 'Starts in November', button: { label: 'Book a workshop', href: 'https://shades.md/workshops' } },
    blocks: [
      email.feature({ src: 'https://shades.md/kit.png', width: 1600, height: 1000, alt: 'A brand kit' }, 'One kit', 'Cards and files.', { label: 'See it', href: 'https://shades.md/kit' }),
      email.fine('Places are confirmed in order.'),
    ],
    inkFooter: true,
  })

  it('puts the heading on the hero card, between the two bands', () => {
    const top = message.html.indexOf('shades-hero-top.png')
    const heading = message.html.indexOf('A brand your whole team can use.')
    const bottom = message.html.indexOf('shades-hero-bottom.png')
    expect(top).toBeGreaterThan(-1)
    expect(top).toBeLessThan(heading)
    expect(heading).toBeLessThan(bottom)
  })

  it('shows the top line, the feature and the ink footer links', () => {
    expect(message.html).toContain('Workshops are open for November')
    expect(message.html).toContain('shades-edge.png')
    expect(message.html).toContain('Email preferences')
    expect(message.text).toContain('One kit')
  })

  it('closes every table it opens', () => {
    const count = (tag: string) => message.html.split(tag).length - 1
    expect(count('<table')).toBe(count('</table>'))
  })
})

describe('report emails', () => {
  const message = renderEmail({
    lang: 'en',
    subject: 'Your month on shades.md',
    preheader: 'Example figures.',
    heading: 'Your month in numbers',
    lead: 'Example figures, for the layout only.',
    blocks: [
      email.tag('New'),
      email.headline('Visitors', ['Read the ', { label: 'guide', href: 'https://shades.md/guide' }, '.']),
      email.stats([
        { label: 'Visitors', value: '1,000', delta: { value: '+10%', direction: 'up' } },
        { label: 'Enquiries', value: '20', delta: { value: '−5%', direction: 'down' } },
        { label: 'Calls booked', value: '3' },
      ]),
      email.tint('green', email.paragraph('Inside a tint.')),
      email.tintCard({
        tone: 'red',
        title: 'Book a review',
        body: 'Half an hour with a designer.',
        tag: 'New',
        align: 'center',
        button: {
          label: 'Book',
          href: 'https://shades.md/call',
          icon: { src: 'https://shades.md/icon.png' },
        },
      }),
      email.pill('Open the report', 'https://shades.md/report', { variant: 'outline' }),
      email.pill('Bad', 'javascript:alert(1)'),
      email.signoff(['The Shades team', 'Chișinău']),
    ],
    greyFooter: { reason: 'You get this because you have a Shades account.' },
    unsubscribe: 'https://shades.md/unsubscribe?u=1',
  })

  it('closes every table it opens', () => {
    const count = (tag: string) => message.html.split(tag).length - 1
    expect(count('<table')).toBe(count('</table>'))
  })

  it('sets links in the brand blue, underlined, and writes them out in the text', () => {
    expect(message.html).toContain(
      'href="https://shades.md/guide" style="color:#5052E4;text-decoration:underline"',
    )
    expect(message.text).toContain('Read the guide (https://shades.md/guide).')
  })

  it('draws the stat tiles in one row, with the change in words in the text', () => {
    expect(message.html.split('class="g-e-stat"').length - 1).toBe(3)
    expect(message.html).toContain('&#8593;&nbsp;+10%')
    expect(message.html).toContain('class="g-e-down"')
    expect(message.text).toContain('Visitors: 1,000 (up +10%)')
    expect(message.text).toContain('Calls booked: 3')
  })

  it('puts four stats two by two', () => {
    const four = email.stats(
      ['A', 'B', 'C', 'D'].map((label) => ({ label, value: '1' })),
    ).html
    expect(four.split('<tr>').length - 1).toBe(3)
  })

  it('tints sections in the 50 shades, with dark values for dark mail apps', () => {
    expect(message.html).toContain('class="g-e-tint-green" style="margin:0 0 24px;background:#C5F4E3')
    expect(message.html).toContain('class="g-e-tint-red"')
    expect(message.html).toContain('.g-e-tint-red{background:#2D1217 !important}')
  })

  it('draws pills for Outlook and everyone else, the icon only outside Outlook', () => {
    expect(message.html).toContain('filled="f"')
    expect(message.html).toContain('<img src="https://shades.md/icon.png" width="18" height="18"')
    expect(message.html).not.toContain('javascript:')
  })

  it('marks new things with a tag', () => {
    expect(message.html).toContain('g-e-tag-blue')
    expect(message.html).toContain('g-e-tag-red g-e-tag-on')
    expect(message.text).toContain('[New]')
  })

  it('signs off under a bar in the brand colours', () => {
    const bar = message.html.indexOf('bgcolor="#E40523" style="width:20px')
    expect(bar).toBeGreaterThan(-1)
    expect(message.html).toContain('bgcolor="#D212D6"')
    expect(message.html).toContain('bgcolor="#FF9A00"')
    expect(message.html.indexOf('The Shades team')).toBeGreaterThan(bar)
  })

  it('ends on the grey footer: grey logo, hairline, address, reason and unsubscribe', () => {
    expect(message.html).toContain('shades-lockup-grey.png')
    expect(message.html).toContain('class="g-e-foot-rule"')
    expect(message.html).toContain('Chișinău, Moldova')
    expect(message.html).toMatch(
      /You get this because you have a Shades account\. <a class="g-e-link" href="https:\/\/shades\.md\/unsubscribe\?u=1"/,
    )
    expect(message.html).not.toContain('shades-edge.png')
    expect(message.text).toContain('Unsubscribe: https://shades.md/unsubscribe?u=1')
  })
})

describe('footer site line', () => {
  it('ends the plain footer and the plain text with the product site', () => {
    const m = renderEmail({ lang: 'en', subject: 'S', preheader: 'P', heading: 'H', blocks: [] })
    expect(m.html).toMatch(/border-top:1px solid[\s\S]*href="https:\/\/shades\.md\/"[^>]*>shades\.md<\/a>/)
    expect(m.text.trim().split('\n').at(-1)).toBe('https://shades.md/')
  })
})
