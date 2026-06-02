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

## Releasing a new version

Use the automated release script from the **project root**:

```bash
pnpm release
```

The script will:

1. Check your working tree is clean.
2. Prompt for bump type (`patch` / `minor` / `major`) or an explicit version.
3. Bump the version in `tools/create-edd-app/package.json`.
4. Create a commit: `chore(create-edd-app): bump version to X.Y.Z`.
5. Create an annotated tag: `create-edd-app-vX.Y.Z`.
6. Push the branch and tag to `origin`.
7. Optionally create a GitHub Release (requires the `gh` CLI).

GitHub Actions then publishes `@edd_remonts/create-edd-app` to npm automatically.

You can also pass the bump type directly to skip the interactive prompt:

```bash
pnpm release patch     # 0.1.1 → 0.1.2
pnpm release minor     # 0.1.1 → 0.2.0
pnpm release major     # 0.1.1 → 1.0.0
pnpm release 1.0.0-rc.1  # explicit pre-release
```

Monitor the publish run:
<https://github.com/eddremonts86/edd-app-template/actions>

### CI validation rules

- Tag must match `package.json` version exactly: `create-edd-app-v<version>`.
- Publish is silently skipped if that version already exists on npm.
- All publishes use npm provenance (`--provenance`).

### Manual publish (emergency only)

```bash
cd tools/create-edd-app
npm publish --access public --provenance
```
