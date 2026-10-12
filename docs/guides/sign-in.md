# Sign-in

Every Shades app signs people in the same way, with the `g-auth` classes in `components.css`. The
layout follows large account pages: one card, who you are and where you are going on the left, the
current step on the right, the one action at the bottom right. Nothing else on the page.

```html
<div class="g-auth">
  <main class="g-auth-card" aria-busy="false">
    <header class="g-auth-head">
      <svg>…the product's logo…</svg>
      <h1 class="g-auth-title">Sign in</h1>
      <p class="g-auth-lead">to continue to Shades CRM</p>
    </header>
    <form class="g-auth-body">
      <div class="g-field">…label, g-input, g-hint…</div>
      <div class="g-auth-actions">
        <button class="g-btn g-btn--primary">Next</button>
      </div>
    </form>
  </main>
  <footer class="g-auth-foot">
    <p>Built by Shades Media Group</p>
    <div class="g-segmented">…Light / Dark / System…</div>
  </footer>
</div>
```

## Steps

1. **Email**: the title is "Sign in", the lead names the product ("to continue to …"), the one
   field is the email, the action is "Next".
2. **Password**: the title is "Welcome". The lead becomes the account chip (`g-auth-who`: an
   initial in a `g-avatar` and the email); tapping it goes back to step 1. The password sits in
   `g-auth-reveal` with a `g-icon-btn` that shows or hides it (`visibility` / `visibilityOff`).
   Then "Keep me signed in" and "Sign in". Keep a hidden `autocomplete="username"` input with the
   email so password managers pair the two.
3. **Code** (apps that send one, such as SocialMonitor): the same chip, one field for the code,
   "Verify". A "Send a new code" ghost button may sit at the left of the actions.

Each step is one screen with one primary action. Errors are a `g-error` above the actions, and the
field gets `aria-invalid`.

## Rules

- **Working:** set `aria-busy="true"` on the card. A thin bar runs along its top edge; the button
  stays as it is (no spinner inside it). Reduced motion gets a still bar.
- **Phone (below 720 px):** the card dissolves into the page, the columns stack, and the footer
  stays at the bottom of the screen.
- **Footer:** the credit on the left; the theme choice (and a language choice, if the app has
  one) on the right. Help, privacy or terms links go there too, never inside the card.
- **No** marketing, illustrations or sign-up pitch on the page. Staff-only apps say so in a
  `g-hint` under the email ("Staff only. An admin creates your account.").
- Light by default; the theme switch changes it right there.
