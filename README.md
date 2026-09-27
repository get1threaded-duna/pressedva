# pressedva.com

Static one-page site for PRESSED — Rappahannock Dreamer's Bar. No build step.

```
index.html          the site (3D hero uses Three.js r128 from cdnjs)
design/tokens.css   every color, size, space and motion value — edit here, not in index.html
```

## Deploy to Vercel

1. Put this folder in a new GitHub repo (use the account that owns the Vercel project).
2. In Vercel: **Add New → Project**, import the repo. Framework preset: **Other**. No build command, output directory `.`
3. In the project: **Settings → Domains → Add** `pressedva.com` and `www.pressedva.com`.
4. In Porkbun DNS, add the A and CNAME records Vercel shows you. **Leave the Zoho MX, SPF and DKIM records alone** or email stops working.

## Before launch — fill these in

- Package prices: search `$[price]` in `index.html` (two places).
- Pop-up dates: search `[Date]`, `[Event name]`, `[Place]`.
- Social handle: search `[@handle]`.
- The "12 pieces" crew minimum, the 90-minute and 2-hour party lengths, and "reply within one day": confirm or change.

## Make the forms send email

The forms work on screen but send nothing until `FORM_ENDPOINT` (top of the main `<script>` in `index.html`) is set.

Option: create a form at a form-handling service such as Formspree, set it to deliver to hello@pressedva.com, and paste its endpoint URL:

```js
var FORM_ENDPOINT = "https://formspree.io/f/your-form-id";
```

The script POSTs the form as `FormData` with `Accept: application/json`. Confirm the service's current free-plan limits and that it accepts file uploads (the crew form has a logo field) before relying on it.

## Deposits

The booking form promises "a secure deposit link." Create a Square or Stripe payment link per package and send it in your reply. No payment code lives on the site.
