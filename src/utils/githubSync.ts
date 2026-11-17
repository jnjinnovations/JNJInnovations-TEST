import { EbookItem } from '../types';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  catalogPath: string;
  autoCommit: boolean;
}

export type GitHubSyncConfig = GitHubConfig;

export interface CommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  actionsUrl?: string;
  message?: string;
  error?: string;
}

const GITHUB_CONFIG_KEY = 'jnj_github_sync_config_v1';

function detectGitHubPagesRepo(): { owner: string; repo: string } | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith('.github.io')) return null;

  const owner = host.replace(/\.github\.io$/, '');
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const repo = pathSegments.length > 0 ? pathSegments[0] : host;
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function normalizeGitHubConfig(cfg: Partial<GitHubConfig>): GitHubConfig {
  let owner = (cfg.owner || '').trim();
  let repo = (cfg.repo || '').trim();

  // Strip accidental full GitHub URLs if pasted into owner/repo
  const urlMatch = repo.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i) || owner.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (urlMatch) {
    owner = urlMatch[1];
    repo = urlMatch[2].replace(/\.git$/i, '');
  } else {
    if (repo.includes('/')) {
      const parts = repo.split('/').filter(Boolean);
      if (parts.length >= 2) {
        owner = owner || parts[0];
        repo = parts[parts.length - 1];
      }
    }
    owner = owner.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
    repo = repo.replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
  }

  return {
    owner: owner || 'jnj-innovations',
    repo: repo || 'remix-jnj-innovations',
    branch: (cfg.branch || 'main').trim() || 'main',
    token: (cfg.token || '').trim(),
    catalogPath: (cfg.catalogPath || 'public/catalog.json').trim().replace(/^\/+/, '') || 'public/catalog.json',
    autoCommit: Boolean(cfg.autoCommit)
  };
}

function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function encodeGitHubPath(filePath: string): string {
  return filePath
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export function getGitHubConfig(): GitHubConfig {
  const detected = detectGitHubPagesRepo();
  const baseDefaults: GitHubConfig = {
    owner: detected?.owner || 'jnj-innovations',
    repo: detected?.repo || 'remix-jnj-innovations',
    branch: 'main',
    token: '',
    catalogPath: 'public/catalog.json',
    autoCommit: false
  };

  if (typeof window === 'undefined') {
    return baseDefaults;
  }

  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = normalizeGitHubConfig({ ...baseDefaults, ...parsed });
      // If hosted on *.github.io and user hasn't customized away from old placeholder defaults without a token
      if (
        detected &&
        !merged.token &&
        parsed.owner === 'jnj-innovations' &&
        parsed.repo === 'remix-jnj-innovations'
      ) {
        merged.owner = detected.owner;
        merged.repo = detected.repo;
      }
      return merged;
    }
  } catch (err) {
    console.error('Failed to parse GitHub config:', err);
  }
  return baseDefaults;
}

export function saveGitHubConfig(cfg: GitHubConfig): GitHubConfig {
  const normalized = normalizeGitHubConfig(cfg);
  if (typeof window !== 'undefined') {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

function buildGitHubHeaders(token: string, withJsonBody = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  };
  if (withJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function diagnoseGitHubFailure(
  owner: string,
  repo: string,
  branch: string,
  token: string,
  status: number,
  apiMessage?: string
): Promise<string> {
  if (status === 401) {
    return 'Invalid or expired GitHub token (HTTP 401: Bad credentials). Make sure you copied the full token without extra spaces and that it has not expired.';
  }

  let userLogin: string | null = null;
  let oauthScopes: string | null = null;

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: buildGitHubHeaders(token),
      cache: 'no-store'
    });
    oauthScopes = userRes.headers.get('X-OAuth-Scopes');
    if (userRes.ok) {
      const userData = await userRes.json();
      userLogin = userData.login || null;
    }
  } catch {
    // Ignore secondary lookup network failure
  }

  const scopeNote = oauthScopes !== null ? ` Token scopes detected: "${oauthScopes || 'none'}".` : '';

  if (status === 403) {
    return `Permission denied on '${owner}/${repo}' (HTTP 403: ${apiMessage || 'Forbidden'}).${scopeNote} Classic tokens require the 'repo' scope; fine-grained tokens require 'Contents: Read and write' access on '${owner}/${repo}'.`;
  }

  if (status === 404) {
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
        headers: buildGitHubHeaders(token),
        cache: 'no-store'
      });
      if (!repoRes.ok) {
        const who = userLogin ? ` for GitHub account '@${userLogin}'` : '';
        return `Repository '${owner}/${repo}' was not found${who} (HTTP 404).${scopeNote} Double-check the GitHub Owner and Repository Name in Settings, and ensure your token grants 'repo' access to this repository.`;
      }
      const repoData = await repoRes.json();
      if (repoData.permissions && repoData.permissions.push === false) {
        return `Your token can read '${owner}/${repo}' but does not have push/write permission.${scopeNote} Grant 'repo' scope (classic) or 'Contents: Read and write' (fine-grained).`;
      }
      const branchRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,
        { headers: buildGitHubHeaders(token), cache: 'no-store' }
      );
      if (!branchRes.ok) {
        return `Branch '${branch}' does not exist in '${owner}/${repo}' (default branch is '${repoData.default_branch || 'main'}'). Update Target Branch in Repo Settings.`;
      }
    } catch {
      // Fall through to generic 404 hint
    }
  }

  return `${apiMessage || `HTTP ${status}: Failed to commit changes`}${scopeNote}`;
}

export async function testGitHubAccess(
  cfg: GitHubSyncConfig
): Promise<{ success: boolean; message: string; repoDetails?: { defaultBranch?: string } }> {
  const clean = normalizeGitHubConfig(cfg);
  if (!clean.token) {
    return { success: false, message: 'Missing GitHub Personal Access Token.' };
  }
  if (!clean.owner || !clean.repo) {
    return { success: false, message: 'GitHub Owner and Repository name are required.' };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(clean.owner)}/${encodeURIComponent(clean.repo)}`,
      {
        headers: buildGitHubHeaders(clean.token),
        cache: 'no-store'
      }
    );

    if (res.ok) {
      const data = await res.json();
      const scopes = res.headers.get('X-OAuth-Scopes');
      const canPush = data.permissions?.push !== false;

      if (!canPush) {
        return {
          success: false,
          message: `Connected to ${data.full_name}, but this token lacks write (push) permission. Grant 'repo' scope (classic) or 'Contents: Read and write' (fine-grained).`,
          repoDetails: { defaultBranch: data.default_branch }
        };
      }

      if (scopes !== null && !scopes.split(',').map(s => s.trim()).some(s => s === 'repo' || (!data.private && s === 'public_repo'))) {
        return {
          success: false,
          message: `Token authenticated for ${data.full_name}, but its OAuth scopes ("${scopes || 'none'}") do not include 'repo'. Committing will fail until you generate a token with 'repo' scope.`,
          repoDetails: { defaultBranch: data.default_branch }
        };
      }

      return {
        success: true,
        message: `Connected with write access to ${data.full_name} (${data.private ? 'Private' : 'Public'}, default branch: ${data.default_branch})`,
        repoDetails: { defaultBranch: data.default_branch }
      };
    }

    const errData = await res.json().catch(() => ({}));
    const detailedMessage = await diagnoseGitHubFailure(
      clean.owner,
      clean.repo,
      clean.branch,
      clean.token,
      res.status,
      errData.message
    );
    return {
      success: false,
      message: detailedMessage
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error attempting to reach GitHub API.'
    };
  }
}

export function generateDefaultEbooksCode(catalog: EbookItem[]): string {
  return `import { EbookItem } from '../types';

export const DEFAULT_EBOOKS: EbookItem[] = ${JSON.stringify(catalog, null, 2)};
`;
}

export async function commitCatalogToGitHub(
  cfg: GitHubConfig,
  catalog: EbookItem[],
  commitMessage: string
): Promise<CommitResult> {
  const clean = normalizeGitHubConfig(cfg);
  if (!clean.token) {
    return { success: false, error: 'GitHub Personal Access Token is required.', message: 'GitHub Personal Access Token is required.' };
  }

  const { owner, repo, branch, catalogPath, token } = clean;
  const encodedPath = encodeGitHubPath(catalogPath);
  const isTypeScript = catalogPath.endsWith('.ts') || catalogPath.endsWith('.tsx');
  const contentStr = isTypeScript ? generateDefaultEbooksCode(catalog) : JSON.stringify(catalog, null, 2);
  const contentBase64 = encodeUtf8Base64(contentStr);

  const fetchCurrentFileSha = async (): Promise<{ sha?: string; errorResult?: CommitResult }> => {
    const getRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
      {
        headers: buildGitHubHeaders(token),
        cache: 'no-store'
      }
    );

    if (getRes.ok) {
      const data = await getRes.json();
      return { sha: data.sha };
    }

    if (getRes.status === 404) {
      // Distinguish "file doesn't exist yet on this branch" from "repo/branch/token access error"
      const repoRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        {
          headers: buildGitHubHeaders(token),
          cache: 'no-store'
        }
      );
      if (!repoRes.ok) {
        const repoErr = await repoRes.json().catch(() => ({}));
        const msg = await diagnoseGitHubFailure(owner, repo, branch, token, repoRes.status, repoErr.message);
        return { errorResult: { success: false, error: msg, message: msg } };
      }

      const branchRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,
        {
          headers: buildGitHubHeaders(token),
          cache: 'no-store'
        }
      );
      if (!branchRes.ok) {
        const msg = await diagnoseGitHubFailure(owner, repo, branch, token, 404);
        return { errorResult: { success: false, error: msg, message: msg } };
      }

      // Repo & branch both exist; file simply needs to be created
      return { sha: undefined };
    }

    const errData = await getRes.json().catch(() => ({}));
    const msg = await diagnoseGitHubFailure(owner, repo, branch, token, getRes.status, errData.message);
    return { errorResult: { success: false, error: msg, message: msg } };
  };

  try {
    const firstLookup = await fetchCurrentFileSha();
    if (firstLookup.errorResult) {
      return firstLookup.errorResult;
    }

    let currentSha = firstLookup.sha;
    let putRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
      {
        method: 'PUT',
        headers: buildGitHubHeaders(token, true),
        cache: 'no-store',
        body: JSON.stringify({
          message: commitMessage || `Update catalog (${new Date().toISOString()})`,
          content: contentBase64,
          branch,
          ...(currentSha ? { sha: currentSha } : {})
        })
      }
    );

    // Retry once on 409 SHA conflict with freshly fetched SHA
    if (putRes.status === 409) {
      const retryLookup = await fetchCurrentFileSha();
      if (!retryLookup.errorResult && retryLookup.sha) {
        currentSha = retryLookup.sha;
        putRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
          {
            method: 'PUT',
            headers: buildGitHubHeaders(token, true),
            cache: 'no-store',
            body: JSON.stringify({
              message: commitMessage || `Update catalog (${new Date().toISOString()})`,
              content: contentBase64,
              branch,
              sha: currentSha
            })
          }
        );
      }
    }

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      const msg = await diagnoseGitHubFailure(owner, repo, branch, token, putRes.status, errData.message);
      return {
        success: false,
        error: msg,
        message: msg
      };
    }

    const putData = await putRes.json();
    const sha = putData.commit?.sha?.slice(0, 7) || 'latest';
    return {
      success: true,
      commitSha: sha,
      commitUrl: putData.commit?.html_url || `https://github.com/${owner}/${repo}/commit/${putData.commit?.sha || ''}`,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      message: `Changes committed to ${owner}/${repo} (${branch}) as commit ${sha}.`
    };
  } catch (err: any) {
    const msg = err?.message || 'Network error while contacting GitHub API.';
    return { success: false, error: msg, message: msg };
  }
}

