# Email

Every email a Shades product or project sends is built with `shades-gradient/email` (`renderEmail`
and `blocks`), never as plain text alone. It sends HTML that holds up in Outlook, Gmail and Apple
Mail, a plain-text twin, and the extras mail apps understand. The live examples are on
[gradient.shades.md/email](https://gradient.shades.md/email/).

## Required by kind

These are requirements, not suggestions. A product that sends one of these emails ships the
matching extras, and a test that checks them.

### One-time codes (sign-in, verification, password)

- **The code on the ink pass:** `code(label, code, valid, stub)`. The digits are plain text next to
  the word "code", unspaced and in one cell, so Gmail offers "Copy code" and Apple Mail offers
  AutoFill.
- **The subject leads with the code:** "418203 is your Shades sign-in code". Never "Your code:
  418203".
- **The preheader** starts with "Your <product> code is 418203" and says how long it works: "Your Shades ID code is 418203 · works for 10 minutes". It is also the first line of the plain text, the line mail apps read when they offer to copy the code.
- **The stub** says what to do if it wasn't you.
- **The sign-in field** that receives it has `autocomplete="one-time-code"` and
  `inputmode="numeric"`.

### Meetings, calls and anything with a date and time

- **An .ics invitation attached:** `icsFile(event, { organizer, attendee })` with
  `METHOD:REQUEST`, so Gmail and Outlook show the event card with Yes, No and Maybe and add it to
  the calendar.
- **"Add to Google Calendar" and "Add to Outlook" links** (`googleCalendarUrl`,
  `outlookCalendarUrl`) for apps that ignore the attachment.
- **The time is shown in the reader's time zone, with the zone named.** The .ics carries UTC.
- **Changes and cancellations** send the same event UID with a higher SEQUENCE (and
  `METHOD:CANCEL` to cancel), so the calendar updates the event instead of adding a second one.

### Bookings, tickets, orders and reservations

- **A pass** (`ticket(...)`) with the one fact that matters set large: the seat, the time, the
  number.
- **schema.org markup** (`schema`: `eventReservation()`, `viewAction()`) so Gmail can show its
  reservation card and the "View" button. Gmail only shows these for senders registered with
  Google ([Email Markup registration](https://developers.google.com/gmail/markup/registering-with-google));
  the markup ships anyway.

### Everything else

- One heading, one lead, at most one primary button, and the link written out under it.
- The product's own logo, plus `logoDark` for dark mail apps.
- The reader's language when the product knows it.

## Required of every sending domain

The extras above only show for senders mail apps trust. A domain that sends Shades mail has:

- **SPF:** `v=spf1 include:_spf.google.com ~all` (Google Workspace).
- **DKIM:** generated in Google Admin (Apps → Gmail → Authenticate email), published as
  `google._domainkey`, with authentication started.
- **DMARC:** `_dmarc` with `v=DMARC1; p=none; rua=mailto:…` at first, then `p=quarantine` once
  reports are clean.

Mail goes out over the shared `SMTP_*` keys from a no-reply alias (for example
`no-reply@shades.md`), never from a person's own address.

## Checking an email

1. Unit test: the subject, the code or the links, and the text twin.
2. Render the HTML and look at it in light and dark, at phone and desktop widths.
3. Send one real email to a Gmail inbox and to Apple Mail before calling it done. For codes,
   confirm "Copy code" or AutoFill appears; for meetings, that the event card appears.

## Campaign and update emails

For offers, launches and project news to clients, the kit adds a richer frame around the same blocks.

- **Top line** (`topline`): one short sentence in ink, 19px bold, on a square band of the brand colour the full width of the column, above everything (ink on the red is 3.8:1, so the text stays large and bold to pass): the offer, the deadline, the code.
- **Hero card** (`hero: { meta, button }`): the heading, lead, one line of facts and one button on a white card, between two bands of the brand's figures (`brand.hero.top` and `brand.hero.bottom`). Images and a flat ground only, so Outlook shows it the same.
- **Features** (`email.feature(image, title, body, link)`): a picture across the column, a title, a line or two and a link. Real photographs or renders, or generated images that pass the imagery rules.
- **Fine print** (`email.fine(text)`): terms, last before the footer.
- **Ink footer** (`inkFooter: true`): the page breaks into ink through layered waves with the brand's figures (`brand.edge`, transparent above the waves), then the links in two columns (Unsubscribe is replaced by `unsubscribe` when the message has its own), the AI notice in small print with room below it, the company name with the site, and the social icons.

Shades ships all of these in `SHADES`; a client brand passes its own `hero`, `edge`, `footerLinks`, `social`, `legal` and `aiNote`.

## Reports, news and account emails

Monthly reports, product news and account notices read like a short page: a large bold heading over a smaller grey line, a few tinted sections, a row of numbers, one pill, a sign-off and a quiet grey footer. All of it is tables and inline styles, with dark values for the mail apps that switch.

- **Headline** (`email.headline(title, body?, { tag?, tagTone?, size?, align?, onTint? })`): a section heading, 24px bold, over a 16px grey line. `tag` puts a small tag above it; set `onTint` when the headline sits inside `email.tint()`, so the tag turns white.
- **Links** are the brand's link blue, underlined (`brand.link`, `#5052E4` for Shades; lighter in dark mail apps). Put a link inside a sentence with `email.rich(['Read the ', { label: 'guide', href }, ' first.'])`; `paragraph` and `note` take the same parts. The plain text writes it as "guide (url)". `email.link`, `calendarLinks` and the feature link are blue too.
- **Tinted sections** (`email.tint(tone, ...blocks)`): any blocks on the 100 shade of a brand colour (green a step deeper, so every tone stands clear of the page), no edge, 24px corners. Tones are `red`, `violet`, `green`, `amber` and `blue`; red, the brand's own, comes first. One tone per section, never one inside another, and never for a warning or an error.
- **Tinted card** (`email.tintCard({ tone, title, body?, tag?, button?, align? })`): a title, a sentence or two and one pill on a tint. `align: 'center'` makes it the call to act that closes the email.
- **Stat tiles** (`email.stats(items, { tone? })`, items `{ label, value, delta?: { value, direction: 'up' | 'down' } }`): white tiles in a row, the number large, the change in a green or red pill with an arrow. Up to three share a row; four sit two by two. Write the sign into the change ("+12%"); the plain text says "up" or "down". Real figures only: samples and previews say they are examples.
- **Pill** (`email.pill(label, url, { variant?: 'filled' | 'outline', icon?: { src, alt? }, color?, align? })`): filled in the brand accent or outlined in a grey hairline, with one optional leading icon (a PNG at 36 × 36 for its 18px). Outlook on Windows draws the pill as VML, without the icon. `email.button` still works as before.
- **Tag** (`email.tag(label, tone = 'blue')`): a small "New" on its own line. On a tinted card it turns white so it stays visible.
- **Sign-off** (`email.signoff(lines)`): a short bar in the brand's colours (`brand.bar`; red, violet and amber for Shades), then the team's name in bold and any lines under it.
- **Grey footer** (`greyFooter: true | { reason?, linkLabel? }`): a light grey block with the grey logo (`brand.logoGrey`) at left, a vertical hairline, and the address lines (`brand.addressLines`) at right; under them the `footer` notes and one small line saying why the reader got the email, ending in the unsubscribe link in blue (`unsubscribe`, or the brand's own Unsubscribe link). It replaces the plain and the ink footer.

```ts
import { renderEmail, email } from 'shades-gradient/email'

renderEmail({
  lang: 'en',
  subject: 'Your November on shades.md',
  preheader: 'Visitors, enquiries and calls booked.',
  heading: 'Your November in numbers',
  lead: 'What changed on your site this month.',
  blocks: [
    email.stats([
      { label: 'Visitors', value: visitors, delta: { value: '+12%', direction: 'up' } },
      { label: 'Enquiries', value: enquiries, delta: { value: '−3%', direction: 'down' } },
    ]),
    email.tint('red', email.headline('One thing to try', 'Answer enquiries within the hour.')),
    email.tintCard({ title: 'Talk it through', body: 'Half an hour with your designer.', align: 'center',
      button: { label: 'Book a call', href: 'https://shades.md/call' } }),
    email.signoff('The Shades team'),
  ],
  greyFooter: { reason: 'You get this report because you have a Shades account.' },
  unsubscribe: 'https://shades.md/email-preferences',
})
```

A client brand passes its own `link`, `logoGrey`, `addressLines` and `bar`; without them links stay in ink, the footer uses the main logo and `legal`, and the bar is one segment of the accent.
