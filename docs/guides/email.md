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
- **The preheader** says how long the code works.
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
