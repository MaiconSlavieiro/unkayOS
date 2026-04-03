import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Plugin that serves app CSS and HTML as raw text instead of
 * letting Vite transform them into JS modules. The unkayOS runtime
 * loads these via fetch() and expects plain CSS/HTML.
 */
function serveAppsRawPlugin() {
  return {
    name: 'unkayos-serve-apps-raw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only intercept requests for app CSS and HTML files
        if (req.url && req.url.startsWith('/apps/') &&
            (req.url.endsWith('.css') || req.url.endsWith('.html'))) {
          const filePath = resolve(__dirname, req.url.slice(1))
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8')
            const contentType = req.url.endsWith('.css') ? 'text/css' : 'text/html'
            res.setHeader('Content-Type', `${contentType}; charset=utf-8`)
            res.end(content)
            return
          }
        }
        next()
      })
    }
  }
}

/**
 * Dynamically detects all apps that have an index.html.
 * New apps are automatically included in the build.
 */
function getAppEntries() {
  const appsDir = resolve(__dirname, 'apps')
  const entries = {}

  if (!existsSync(appsDir)) return entries

  const appDirs = readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())

  for (const dirent of appDirs) {
    const indexPath = resolve(appsDir, dirent.name, 'index.html')
    if (existsSync(indexPath)) {
      entries[`apps/${dirent.name}/index`] = indexPath
    }
  }

  return entries
}

export default {
  root: '.',
  plugins: [serveAppsRawPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...getAppEntries()
      }
    }
  },
  appType: 'mpa',
  server: {
    // HMR is enabled by default in Vite
  }
}
