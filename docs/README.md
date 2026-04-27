# Work From Car — static site (GitHub Pages)

This folder hosts the **Privacy Policy** and **Terms of Service** for App Store Connect and Google OAuth verification.

## URLs (after Pages + DNS are configured)

- Privacy: `https://workfromcar.xyz/privacy.html`
- Terms: `https://workfromcar.xyz/terms.html`

## Enable GitHub Pages

1. Repository **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: your default branch, folder **`/docs`**
4. Save

## Custom domain

`CNAME` in this folder is set to **`workfromcar.xyz`**. In your DNS provider:

- Add the records GitHub shows for your apex domain (typically A/AAAA for GitHub Pages), or use a CNAME for `www` if you prefer.
- Keep **`api.workfromcar.xyz`** pointing at your EC2/Caddy backend; only the apex (or `www`) needs to point at GitHub Pages for this site.

After DNS propagates, enable **Enforce HTTPS** in GitHub Pages settings.
