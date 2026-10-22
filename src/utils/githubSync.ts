import { EbookItem } from '../types';

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  autoCommit: boolean;
}

const GITHUB_CONFIG_KEY = 'jnj_github_sync_config_v1';
const LAST_COMMITTED_KEY = 'jnj_last_committed_catalog_v1';

export const DEFAULT_GITHUB_CONFIG: GitHubSyncConfig = {
  owner: 'jnj-innovations',
  repo: 'remix-jnj-innovations',
  branch: 'main',
  token: '',
  autoCommit: false
};

export function getGitHubConfig(): GitHubSyncConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_GITHUB_CONFIG;
  }
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owner: parsed.owner || DEFAULT_GITHUB_CONFIG.owner,
        repo: parsed.repo || DEFAULT_GITHUB_CONFIG.repo,
        branch: parsed.branch || DEFAULT_GITHUB_CONFIG.branch,
        token: parsed.token || '',
        autoCommit: typeof parsed.autoCommit === 'boolean' ? parsed.autoCommit : false
      };
    }
  } catch (e) {
    console.error('Failed to parse GitHub config:', e);
  }
  return DEFAULT_GITHUB_CONFIG;
}

export function saveGitHubConfig(config: GitHubSyncConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save GitHub config:', e);
  }
}

export function getLastCommittedCatalogHash(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LAST_COMMITTED_KEY) || '';
}

export function setLastCommittedCatalogHash(hash: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_COMMITTED_KEY, hash);
}

/**
 * Format the Ebook items array into a clean TypeScript file string for src/data/defaultEbooks.ts
 */
export function generateDefaultEbooksCode(books: EbookItem[]): string {
  const jsonString = JSON.stringify(books, null, 2);
  return `import { EbookItem } from '../types';

export const DEFAULT_EBOOKS: EbookItem[] = ${jsonString};
`;
}

/**
 * Safe Base64 encoder that handles UTF-8 characters properly
 */
export function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

/**
 * Safe Base64 decoder for UTF-8
 */
export function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}

/**
 * Test credentials and access to the GitHub repository
 */
export async function testGitHubAccess(config: GitHubSyncConfig): Promise<{
  success: boolean;
  message: string;
  repoDetails?: { fullName: string; defaultBranch: string; isPrivate: boolean };
}> {
  if (!config.owner.trim() || !config.repo.trim()) {
    return { success: false, message: 'Please specify both Repository Owner and Repository Name.' };
  }
  if (!config.token.trim()) {
    return { success: false, message: 'Please provide a GitHub Personal Access Token (PAT).' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner.trim()}/${config.repo.trim()}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${config.token.trim()}`
      }
    });

    if (res.status === 401) {
      return { success: false, message: 'Bad credentials: The GitHub token is invalid or expired.' };
    }
    if (res.status === 404) {
      return {
        success: false,
        message: `Repository "${config.owner}/${config.repo}" not found or token lacks 'repo' scope access.`
      };
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, message: errData.message || `GitHub error (Status ${res.status})` };
    }

    const data = await res.json();
    return {
      success: true,
      message: `Connected successfully to ${data.full_name}!`,
      repoDetails: {
        fullName: data.full_name,
        defaultBranch: data.default_branch || 'main',
        isPrivate: data.private
      }
    };
  } catch (err: any) {
    return { success: false, message: `Network error connecting to GitHub API: ${err.message}` };
  }
}

export interface CommitResult {
  success: boolean;
  message: string;
  commitSha?: string;
  commitUrl?: string;
  actionsUrl?: string;
}

/**
 * Commits the current catalog directly to src/data/defaultEbooks.ts on GitHub
 */
export async function commitCatalogToGitHub(
  config: GitHubSyncConfig,
  books: EbookItem[],
  customCommitMessage?: string
): Promise<CommitResult> {
  const targetOwner = config.owner.trim();
  const targetRepo = config.repo.trim();
  const targetBranch = config.branch.trim() || 'main';
  const targetPath = 'src/data/defaultEbooks.ts';

  if (!targetOwner || !targetRepo || !config.token.trim()) {
    return {
      success: false,
      message: 'GitHub repository or access token is not configured. Please open GitHub Settings.'
    };
  }

  try {
    const fileApiUrl = `https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}?ref=${targetBranch}`;
    
    // 1. Fetch current file to retrieve its SHA (required by GitHub API to update an existing file)
    let fileSha: string | undefined;
    const getRes = await fetch(fileApiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${config.token.trim()}`
      }
    });

    if (getRes.ok) {
      const existingData = await getRes.json();
      fileSha = existingData.sha;
    } else if (getRes.status === 401) {
      return { success: false, message: 'Authentication failed: Invalid GitHub token.' };
    } else if (getRes.status !== 404) {
      // 404 is acceptable if the file doesn't exist yet on this branch
      const err = await getRes.json().catch(() => ({}));
      return { success: false, message: err.message || 'Failed to inspect repository branch.' };
    }

    // 2. Generate updated TypeScript content and encode in Base64
    const updatedTsContent = generateDefaultEbooksCode(books);
    const contentBase64 = utf8ToBase64(updatedTsContent);

    const message = customCommitMessage?.trim() || `Update publication catalog (${books.length} playbooks) via Admin Studio`;

    // 3. Put the updated content to GitHub contents API
    const putRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetPath}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token.trim()}`
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        sha: fileSha,
        branch: targetBranch
      })
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || `Failed to commit to GitHub (Status ${putRes.status})`
      };
    }

    const resultData = await putRes.json();
    const commitSha = resultData.commit?.sha?.slice(0, 7) || 'latest';
    const commitUrl = resultData.commit?.html_url || `https://github.com/${targetOwner}/${targetRepo}/commit/${commitSha}`;
    const actionsUrl = `https://github.com/${targetOwner}/${targetRepo}/actions`;

    // Update last committed hash
    setLastCommittedCatalogHash(JSON.stringify(books));

    return {
      success: true,
      message: `Successfully committed ${commitSha} to ${targetBranch}! GitHub Actions deployment triggered.`,
      commitSha,
      commitUrl,
      actionsUrl
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to commit: ${err.message}`
    };
  }
}
