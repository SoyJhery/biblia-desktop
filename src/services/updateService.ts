import { UpdateCheckResult } from '../types';

export const GITHUB_REPO_URL = 'https://github.com/SoyJhery/biblia-desktop';
export const GITHUB_RELEASES_URL = 'https://github.com/SoyJhery/biblia-desktop/releases';

export const updateService = {
  /**
   * Comprueba si hay actualizaciones disponibles (vía Git o GitHub Releases)
   */
  async checkForUpdates(token?: string): Promise<UpdateCheckResult> {
    if (window.electronAPI?.checkForUpdates) {
      try {
        const result = await window.electronAPI.checkForUpdates(token);
        return result as UpdateCheckResult;
      } catch (err: any) {
        return {
          hasUpdate: false,
          mode: 'none',
          currentVersion: '0.4.0',
          lastChecked: new Date().toISOString(),
          error: err.message,
        };
      }
    }

    // Fallback web / navegador directo
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const res = await fetch('https://api.github.com/repos/SoyJhery/biblia-desktop/releases/latest', { headers });
      if (res.ok) {
        const releaseData = await res.json();
        const remoteTag = releaseData.tag_name?.replace(/^v/, '');
        const currentVersion = '0.4.0';

        if (remoteTag && remoteTag !== currentVersion) {
          return {
            hasUpdate: true,
            mode: 'release',
            currentVersion,
            latestVersion: releaseData.tag_name,
            releaseInfo: {
              tagName: releaseData.tag_name,
              title: releaseData.name || releaseData.tag_name,
              notes: releaseData.body || '',
              publishedAt: releaseData.published_at || '',
              url: releaseData.html_url || GITHUB_RELEASES_URL,
              assets: (releaseData.assets || []).map((a: any) => ({
                name: a.name,
                downloadUrl: a.browser_download_url,
                size: a.size,
              })),
            },
            lastChecked: new Date().toISOString(),
          };
        }
      }
    } catch (e: any) {
      console.warn('Fallback update check error:', e);
    }

    return {
      hasUpdate: false,
      mode: 'none',
      currentVersion: '0.4.0',
      lastChecked: new Date().toISOString(),
    };
  },

  /**
   * Aplica la actualización mediante Git Pull y recompilación
   */
  async applyGitUpdate(): Promise<{ success: boolean; output: string; error?: string }> {
    if (window.electronAPI?.applyGitUpdate) {
      return await window.electronAPI.applyGitUpdate();
    }
    return {
      success: false,
      output: '',
      error: 'La actualización automática por Git solo está disponible en la versión de escritorio.',
    };
  },

  /**
   * Abre un enlace web seguro en el navegador predeterminado
   */
  openExternalUrl(url: string): void {
    if (window.electronAPI?.openExternalUrl) {
      window.electronAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Abre el repositorio oficial en GitHub
   */
  openGitHubRepo(): void {
    this.openExternalUrl(GITHUB_REPO_URL);
  },

  /**
   * Abre la sección de lanzamientos (releases) en GitHub
   */
  openReleases(): void {
    this.openExternalUrl(GITHUB_RELEASES_URL);
  },
};
