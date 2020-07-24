import fs from 'fs'
import path from 'path'

export function toBooleanConfig (configValue: string | boolean | undefined): boolean | undefined {
  if (typeof configValue === 'string') {
    return (configValue === 'true')
  }
  return configValue
}

export function toArrayConfig (configValue: string | undefined, separator = ',', fallback = []): string[] {
  if (configValue) {
    return (configValue.split(separator).map(arrayItem => arrayItem.trim()))
  }
  return fallback
}

export function toIntegerConfig (configValue): number {
  if (configValue && typeof configValue === 'string') {
    return parseInt(configValue)
  }
  return configValue
}

export function getGitCommit (repodir): string {
  if (!fs.existsSync(repodir + '/.git/HEAD')) {
    return ''
  }
  let reference = fs.readFileSync(repodir + '/.git/HEAD', 'utf8')
  if (reference.startsWith('ref: ')) {
    reference = reference.substr(5).replace('\n', '')
    reference = fs.readFileSync(path.resolve(repodir + '/.git', reference), 'utf8')
  }
  reference = reference.replace('\n', '')
  return reference
}

export function getGitHubURL (repo, reference): string {
  // if it's not a github reference, we handle handle that anyway
  if (!repo.startsWith('https://github.com') && !repo.startsWith('git@github.com')) {
    return repo
  }
  if (repo.startsWith('git@github.com') || repo.startsWith('ssh://git@github.com')) {
    repo = repo.replace(/^(ssh:\/\/)?git@github.com:/, 'https://github.com/')
  }

  if (repo.endsWith('.git')) {
    repo = repo.replace(/\.git$/, '/')
  } else if (!repo.endsWith('/')) {
    repo = repo + '/'
  }
  return repo + 'tree/' + reference
}
