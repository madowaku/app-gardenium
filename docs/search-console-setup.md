# App Gardenium Search Console Setup

Use this after the production domain points to the current deployment.

## Property

- URL prefix property for current Cloud Run deployment: `https://app-gardenium-21754549540.asia-east1.run.app/`
- If you later attach a custom domain, add that as a separate property too.
- Current verification support in the app:
  - meta tag: `<meta name="google-site-verification" content="Pe0HtGid_raRXnkwe2uECjy_vVRsCsLEgOIb5aot76w" />`
  - HTML file: `/google9af57b99126510ca.html`
- Sitemap URL:
  - Cloud Run: `https://app-gardenium-21754549540.asia-east1.run.app/sitemap.xml`
  - Custom domain after mapping: `https://app-gardenium.com/sitemap.xml`
- Robots URL:
  - Cloud Run: `https://app-gardenium-21754549540.asia-east1.run.app/robots.txt`
  - Custom domain after mapping: `https://app-gardenium.com/robots.txt`

## Submit

1. Open Google Search Console.
2. Add `https://app-gardenium-21754549540.asia-east1.run.app/` as a URL prefix property.
3. Verify ownership with the meta tag or HTML file.
4. Submit `https://app-gardenium-21754549540.asia-east1.run.app/sitemap.xml` from Sitemaps.
5. Inspect these URLs first:
   - `https://app-gardenium-21754549540.asia-east1.run.app/en`
   - `https://app-gardenium-21754549540.asia-east1.run.app/ja`
   - `https://app-gardenium-21754549540.asia-east1.run.app/en/ideas`
   - `https://app-gardenium-21754549540.asia-east1.run.app/ja/ideas`
6. After new public ideas are posted, inspect one `/en/ideas/{id}` and one `/ja/ideas/{id}` URL.

## Important

- Sitemap, canonical URLs, `hreflang`, and OGP URLs now follow the current request host. A `run.app` request returns `run.app` URLs, and a custom-domain request returns custom-domain URLs.
- After deploying this change, resubmit the sitemap in Search Console so the previous host-mismatch error can be reprocessed.

## Expected Indexing Rules

- Public marketing and idea pages: `index, follow`
- Login, my page, membership, posting, admin, billing, and commerce pages: `noindex, nofollow`
- Public idea detail pages appear in the dynamic sitemap when `visibility == "public"`.

## Launch Check

- Confirm the sitemap includes recent public ideas.
- Confirm each sitemap URL has matching `hreflang` alternates.
- Confirm social previews use the generated `/api/og/ideas/{id}.svg` image for idea detail pages.
- Keep user reports reviewed before sharing broadly on X, Reddit, Product Hunt, or Indie Hackers.

## References

- Google Search Central: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Search Console API sitemap submit: https://developers.google.com/webmaster-tools/v1/sitemaps/submit
