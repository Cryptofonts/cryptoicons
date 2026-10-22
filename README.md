# Cryptoicons

Cryptoicons is a collection of cryptocurrency and token icons in SVG format that has been maintained since 2018 when I started the [cryptofonts.com](https://www.cryptofonts.com) project.

Each icons is also available in PNG format @ 16px, 32px, 64px and 128px.

If you're looking for an icons Webfont, checkout my other project [Cryptofonts](https://github.com/monzanifabio/cryptofont) on GitHub or the [official API](https://cryptofonts.com/api.html) for developers that are looking to integrate token icons into their projects.

The icons are free to use for personal and commercial projects under the GNU License.

## Contributing to Cryptoicons

We want to make contributing to this project as easy and transparent as possible, whether it's:

- Submitting a fix
- Proposing new features
- Becoming a maintainer

### We Use Github Flow, So All Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `master`.
1. All icons should be 500px x 500px.
1. The file should only contain vectors (no png, jpg etc.).
1. All layers should be under a unique group.
1. The main layer group need to be named as the icon.
1. Add your SVG to the `assets` folder.
1. Issue that pull request!

## JavaScript packages

The repository is a pnpm workspace. Run `pnpm install`, then `pnpm generate`
and `pnpm build` to generate the icon metadata and React components and build
the `@cryptofonts/core` and `@cryptofonts/react` packages. Deprecated icons in
`assets/_deprecated` are retained as source files but are not included in
generated packages.

React consumers can import a single icon, a naming alias, or the dynamic
wrapper:

```tsx
import { BtcIcon, CryptoIcon, IconBtc } from '@cryptofonts/react';

function Example() {
  return (
    <>
      <IconBtc size={24} aria-label="Bitcoin" />
      <BtcIcon size={24} />
      <CryptoIcon name="btc" size={24} fallback={<span>BTC</span>} />
    </>
  );
}
```

`@cryptofonts/core` exports the `manifest`, `getIconUrlBySymbol`, and
`getIconUrlByContract` helpers. The contract helper accepts a caller-provided
chain/address-to-symbol map because contract addresses are not part of this
icon-only repository.

Package publishing uses npm Trusted Publishing from the GitHub Actions
`release.yml` workflow. Configure a GitHub Actions trusted publisher for each
package (`@cryptofonts/core` and `@cryptofonts/react`) on npm with owner
`monzanifabio`, repository `cryptoicons`, and workflow filename `release.yml`.
The workflow runs on pushes to `master`; no `NPM_TOKEN` secret is required.

### License

By contributing, you agree that your contributions will be licensed under its GNU License.
