#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const DEFAULT_TEMPLATE_REPO = 'https://github.com/eddremonts86/edd-app-template.git'
const DEFAULT_BRANCH = 'main'

function printHelp() {
  console.log(`create-edd-app

Usage:
  npx @edd_remonts/create-edd-app <project-name> [options]

Options:
  --template <repo-url>       Git repository to clone
  --branch <branch>           Git branch to clone (default: main)
  --package-manager <pm>      Package manager: pnpm | npm | yarn | bun
  --no-install                Skip dependency installation
  --help                      Show this help message
`)
}

function fail(message) {
  console.error(`Error: ${message}`)
  process.exit(1)
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  })

  if (result.error) {
    fail(`Failed to run command "${command}": ${result.error.message}`)
  }

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
  return result.status === 0
}

function detectPackageManager(explicitPackageManager) {
  if (explicitPackageManager) {
    return explicitPackageManager
  }

  const preferred = ['pnpm', 'npm', 'yarn', 'bun']
  const detected = preferred.find((pm) => commandExists(pm))

  if (!detected) {
    fail('No supported package manager found. Install pnpm, npm, yarn, or bun.')
  }

  return detected
}

function readOptionValue(args, index, optionName) {
  const value = args[index]
  if (!value || value.startsWith('--')) {
    fail(`Missing value for ${optionName}`)
  }
  return value
}

async function ensureTargetDirectory(targetDir) {
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true })
    return
  }

  const entries = await readdir(targetDir)
  if (entries.length > 0) {
    fail(`Target directory is not empty: ${targetDir}`)
  }
}

async function updatePackageName(targetDir, projectName) {
  const packageJsonPath = join(targetDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return
  }

  const raw = await readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(raw)
  pkg.name = projectName

  await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
}

function parseArgs(argv) {
  const options = {
    template: DEFAULT_TEMPLATE_REPO,
    branch: DEFAULT_BRANCH,
    packageManager: undefined,
    install: true,
    projectName: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    switch (token) {
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      case '--no-install':
        options.install = false
        break
      case '--template':
        index += 1
        options.template = readOptionValue(argv, index, '--template')
        break
      case '--branch':
        index += 1
        options.branch = readOptionValue(argv, index, '--branch')
        break
      case '--package-manager':
        index += 1
        options.packageManager = readOptionValue(argv, index, '--package-manager')
        break
      default:
        if (token.startsWith('--')) {
          fail(`Unknown option: ${token}`)
        }
        if (options.projectName) {
          fail(`Unexpected argument: ${token}`)
        }
        options.projectName = token
        break
    }
  }

  if (!options.projectName) {
    printHelp()
    fail('Project name is required.')
  }

  return options
}

function validateProjectName(projectName) {
  const validName = /^[a-z0-9][a-z0-9-_]*$/
  if (!validName.test(projectName)) {
    fail(
      'Project name must be lowercase and can include letters, numbers, hyphens, and underscores.',
    )
  }
}

function installDependencies(packageManager, targetDir) {
  const installArgsByPm = {
    pnpm: ['install'],
    npm: ['install'],
    yarn: ['install'],
    bun: ['install'],
  }

  const installArgs = installArgsByPm[packageManager]
  if (!installArgs) {
    fail(`Unsupported package manager: ${packageManager}`)
  }

  runCommand(packageManager, installArgs, { cwd: targetDir })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const projectName = options.projectName
  validateProjectName(projectName)

  const targetDir = resolve(process.cwd(), projectName)
  await ensureTargetDirectory(targetDir)

  console.log(`Creating app in ${targetDir}`)
  runCommand('git', [
    'clone',
    '--depth',
    '1',
    '--branch',
    options.branch,
    options.template,
    targetDir,
  ])

  const gitDir = join(targetDir, '.git')
  if (existsSync(gitDir)) {
    await rm(gitDir, { recursive: true, force: true })
  }

  await updatePackageName(targetDir, basename(targetDir))

  const packageManager = detectPackageManager(options.packageManager)
  if (options.install) {
    console.log(`Installing dependencies with ${packageManager}...`)
    installDependencies(packageManager, targetDir)
  }

  console.log('\nSuccess. Your app is ready.\n')
  console.log(`Next steps:\n  cd ${projectName}`)

  if (!options.install) {
    console.log(`  ${packageManager} install`)
  }

  console.log('  cp .env.example .env')
  console.log(
    '  pnpm dev    # bootstraps DB, runs migrations, seeds admin from .env, starts dev server\n',
  )
}

try {
  await main()
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
