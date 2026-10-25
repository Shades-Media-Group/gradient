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

