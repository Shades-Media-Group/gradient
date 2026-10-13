# Sign-in

Every Shades app signs people in the same way, with the `g-auth` classes in `shades-gradient/auth.css`
(opt-in: import it after `gradient.css`). A split
screen: the product's brand panel on the inverse ground (logo, one plain line, the Shades credit),
and the form in one centred column (a bold title, fields with labels inside, one full-width flat
button). It takes ideas from the big social and media sign-ins without copying any of them.

```html
<div class="g-auth">
  <aside class="g-auth-brand">
    <svg>…the product's logo…</svg>
    <p class="g-auth-statement">Every Shades client, in one place.</p>
    <p class="g-auth-credit"><svg>…the Shades mark…</svg>Built by Shades Media Group</p>
  </aside>
  <main class="g-auth-main" aria-busy="false">
    <form class="g-auth-form">
      <h1 class="g-auth-title">Sign in to Shades CRM</h1>
      <div class="g-auth-field">
        <input class="g-input" id="email" type="email" placeholder=" " />
        <label for="email">Work email</label>
      </div>
      <button class="g-btn g-btn--primary">Next</button>
      <p class="g-hint">Staff only. An admin creates your account.</p>
    </form>
    <footer class="g-auth-foot"><div class="g-segmented">…Light / Dark / System…</div></footer>
  </main>
</div>
```

## Two flows

- **Together** (SocialMonitor and most apps): "Email or username" and the password on one screen,
  then "Keep me signed in" and Sign in. The fastest; use it unless there is a reason not to.
- **Stepped** (Shades CRM): the email first, then the password under the account chip, as below.

## Stepped

1. **Email**: the title is "Sign in to <product>", the one field is the email, the action is
   "Next".
2. **Password**: the title is "Enter your password", over the account chip (`g-auth-who`: an
   initial in a `g-avatar` and the email); tapping it goes back to step 1. The password field
   holds a `g-icon-btn` after its label that shows or hides it (`visibility` / `visibilityOff`).
   Then "Keep me signed in" and "Sign in". Keep a hidden `autocomplete="username"` input with the
   email so password managers pair the two.
3. **Code** (apps that send one, such as SocialMonitor): the same chip, one field for the code,
   "Verify". A "Send a new code" ghost button may sit at the left of the actions.

Each step is one screen with one primary action. Errors are a `g-error` above the actions, and the
field gets `aria-invalid`.

## Rules

- **Type and colour:** the page sets its text in the system face (`--g-font-system`) with
  regular-weight titles and near-black text, the way large account pages do. Only the logo keeps
  the brand face.
- **Fields:** `g-auth-field` puts the label inside the box (the input needs `placeholder=" "`);
  it moves up on focus or when filled. Focus is a dark outline, never red.
- **Buttons:** full width, 48 px, flat, no glow and no border.
- **Returning people:** remember the last email that signed in on this browser and start at the
  password step, with the chip to change it.
- **Caps Lock:** while it is on in the password field, a `g-hint` says so.
- **Working:** set `aria-busy="true"` on `g-auth-main`. The Shades spectrum runs along its top edge; the button
  stays as it is (no spinner inside it). Reduced motion gets a still bar.
- **Phone (below 820 px):** the brand panel becomes a strip at the top with the logo and the
  credit; the form follows, and the theme choice stays at the bottom of the screen.
- **Credit:** the Shades mark and "Built by Shades Media Group" close the brand panel.
- **Footer:** under the card, the theme choice (and a language choice, if the app has one). Help, privacy or terms links go there too, never inside the card.
- **No** marketing, illustrations or sign-up pitch on the page. Staff-only apps say so in a
  `g-hint` under the email ("Staff only. An admin creates your account.").
- Light by default; the theme switch changes it right there.
