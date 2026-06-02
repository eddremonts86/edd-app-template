# create-edd-app

Bootstrap a new project from `edd-app-template`.

## Usage

```bash
npx @edd_remonts/create-edd-app my-product
```

This command clones the starter, removes git history, renames `package.json` to your app name, and installs dependencies.

## Options

```bash
npx @edd_remonts/create-edd-app my-product --no-install
npx @edd_remonts/create-edd-app my-product --branch main
npx @edd_remonts/create-edd-app my-product --template https://github.com/eddremonts86/edd-app-template.git
npx @edd_remonts/create-edd-app my-product --package-manager pnpm
```

## Local test

```bash
node ./bin/create-edd-app.mjs demo-app --no-install
```

## Publish

```bash
cd tools/create-edd-app
npm publish --access public
```

After publish, users can run:

```bash
npx @edd_remonts/create-edd-app my-product
```

## Release Best Practices (Tags + GitHub Release)

The project workflow publishes automatically from this repository when a release tag is pushed.

1. Bump version in `tools/create-edd-app/package.json`.
1. Commit changes to `main`.
1. Create and push a tag using this exact format:

```bash
git tag create-edd-app-v0.1.2
git push origin create-edd-app-v0.1.2
```

1. (Recommended) Create a GitHub Release using the same tag.

Validation rules in CI:

- Tag must match package version exactly: `create-edd-app-v<package.json version>`.
- Publish is skipped if that version already exists on npm.
- Publish runs with npm provenance enabled.
