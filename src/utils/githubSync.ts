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

export function getGitHubConfig(): GitHubConfig {
  if (typeof window === 'undefined') {
    return {
      owner: 'jnj-innovations',
      repo: 'remix-jnj-innovations',
      branch: 'main',
      token: '',
      catalogPath: 'public/catalog.json',
      autoCommit: false
    };
  }
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse GitHub config:', err);
  }
  return {
    owner: 'jnj-innovations',
    repo: 'remix-jnj-innovations',
    branch: 'main',
    token: '',
    catalogPath: 'public/catalog.json',
    autoCommit: false
  };
}

export function saveGitHubConfig(cfg: GitHubConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg));
}

export async function testGitHubAccess(
  cfg: GitHubSyncConfig
): Promise<{ success: boolean; message: string; repoDetails?: { defaultBranch?: string } }> {
  if (!cfg.token) {
    return { success: false, message: 'Missing GitHub Personal Access Token.' };
  }
  if (!cfg.owner || !cfg.repo) {
    return { success: false, message: 'GitHub Owner and Repository name are required.' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Successfully connected to repository ${data.full_name} (${data.private ? 'Private' : 'Public'})`,
        repoDetails: { defaultBranch: data.default_branch }
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.message || `HTTP ${res.status}: Repository access check failed.`
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
  if (!cfg.token) {
    return { success: false, error: 'GitHub Personal Access Token is required.' };
  }

  const { owner, repo, branch, catalogPath, token } = cfg;
  const isTypeScript = catalogPath.endsWith('.ts') || catalogPath.endsWith('.tsx');
  const contentStr = isTypeScript ? generateDefaultEbooksCode(catalog) : JSON.stringify(catalog, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

  try {
    let currentSha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${catalogPath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (getRes.ok) {
      const data = await getRes.json();
      currentSha = data.sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${catalogPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage || `Update catalog (${new Date().toISOString()})`,
          content: contentBase64,
          branch,
          ...(currentSha ? { sha: currentSha } : {})
        })
      }
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      const errMsg = errData.message || `HTTP ${putRes.status}: Failed to commit changes`;
      return {
        success: false,
        error: errMsg,
        message: errMsg
      };
    }

    const putData = await putRes.json();
    const sha = putData.commit?.sha?.slice(0, 7) || 'latest';
    return {
      success: true,
      commitSha: sha,
      commitUrl: putData.commit?.html_url || `https://github.com/${owner}/${repo}/commit/${putData.commit?.sha || ''}`,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      message: `Changes committed to branch '${branch}' as commit ${sha}.`
    };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

