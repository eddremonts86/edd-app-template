import { fileURLToPath, URL } from 'node:url'
// import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST
const isViteDevtoolsDisabled = process.env.DISABLE_TANSTACK_VITE_DEVTOOLS === 'true'

const config = defineConfig((configEnv) => {
  // Vite only exposes VITE_-prefixed vars, and only to import.meta.env. Server
  // code reads process.env (AI provider keys, DATABASE_URL, auth secrets), which
  // `vite dev` never populates — so every server-side secret resolved empty and
  // the AI providers all reported AUTH_REQUIRED with a key sitting in .env.
  // Load the full env and merge it in, without clobbering anything the shell
  // already set (CI and Docker pass real values that must win).
  // Not under test: the suite asserts the built-in defaults, and leaking a
  // developer's .env into it makes the results depend on whose machine it runs on.
  if (!isTest && configEnv.mode !== 'test') {
    const fileEnv = loadEnv(configEnv.mode, process.cwd(), '')
    for (const [key, value] of Object.entries(fileEnv)) {
      if (process.env[key] === undefined) process.env[key] = value
    }
  }

  // NOTE: TanStack Start's Vite plugin does not set isSsrBuild=true for its
  // server bundle (it uses the Environment API internally). This alias therefore
  // applies to the CLIENT bundle only — server-only code must import via the
  // explicit subpath '@/shared/lib/db/index' to bypass this alias.
  const shouldStubDbForClientBuild = configEnv.command === 'build' && !configEnv.isSsrBuild
  const streamWebShim = fileURLToPath(
    new URL('./src/shared/lib/node/stream-web.ts', import.meta.url),
  )

  return {
    server: {
      port: 2999,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      include: [
        'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      deps: {
        optimizer: {
          web: {
            include: ['react', 'react-dom'],
          },
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
      alias: [
        ...(shouldStubDbForClientBuild
          ? [
              {
                find: /^@\/shared\/lib\/db$/,
                replacement: fileURLToPath(
                  new URL('./src/shared/lib/db/browser.ts', import.meta.url),
                ),
              },
            ]
          : []),
        ...(configEnv.isSsrBuild
          ? [
              {
                find: /^stream\/web$/,
                replacement: streamWebShim,
              },
              {
                find: /^stream-browserify\/web$/,
                replacement: streamWebShim,
              },
            ]
          : []),
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: 'use-sync-external-store/shim/with-selector.js',
          replacement: fileURLToPath(
            new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
          ),
        },
        {
          find: 'use-sync-external-store/shim/with-selector',
          replacement: fileURLToPath(
            new URL('./src/shared/lib/shim-with-selector.ts', import.meta.url),
          ),
        },
        {
          find: 'use-sync-external-store/shim/index.js',
          replacement: fileURLToPath(new URL('./src/shared/lib/shim.ts', import.meta.url)),
        },
        {
          find: 'use-sync-external-store/shim',
          replacement: fileURLToPath(new URL('./src/shared/lib/shim.ts', import.meta.url)),
        },
      ],
    },
    ssr: {
      external: ['xlsx', 'pdf-parse'],
    },
    plugins: [
      !isViteDevtoolsDisabled &&
        devtools({
          // The console-piping SSE (/__tsd/console-pipe/sse) was crashing the
          // renderer with ERR_INCOMPLETE_CHUNKED_ENCODING during client-side
          // navigation, killing the page on transitions between admin routes.
          consolePiping: { enabled: false },
        }),
      tailwindcss(),
      !isTest &&
        tanstackStart({
          srcDirectory: './src',
          router: {
            routeToken: 'route',
          },
        }),
      viteReact(),
      // netlify(),
    ].filter(Boolean),
  }
})

export default config
