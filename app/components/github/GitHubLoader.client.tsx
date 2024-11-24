import { useEffect } from 'react';
import { useLocation } from '@remix-run/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { ActionRunner } from '~/lib/runtime/action-runner';
import { webcontainer } from '~/lib/webcontainer';
import type { GitHubAction } from '~/types/actions';

interface GitHubLoaderProps {
  path: string;
  searchParams: Record<string, string>;
}

export function GitHubLoader({ path, searchParams }: GitHubLoaderProps) {
  const location = useLocation();

  useEffect(() => {
    // Handle the path from the URL (e.g., "owner/repo" or "owner/repo/tree/branch/path")
    if (path) {
      const pathParts = path.split('/');
      if (pathParts.length >= 2) {
        const repository = `${pathParts[0]}/${pathParts[1]}`;
        let branch, subPath;

        // Check if path contains branch and subpath info
        if (pathParts.length > 2 && pathParts[2] === 'tree') {
          branch = pathParts[3];
          subPath = pathParts.slice(4).join('/');
        }

        initializeGitHubImport({
          repository,
          targetDir: '.',
          ...(branch && { branch }),
          ...(subPath && { path: subPath }),
        });
      }
      return;
    }

    // Fallback: check for URL parameters (for backward compatibility)
    const githubParam = searchParams && searchParams['github'];
    if (githubParam) {
      try {
        const githubData = JSON.parse(decodeURIComponent(githubParam));
        initializeGitHubImport(githubData);
      } catch (error) {
        console.error('Failed to parse GitHub data:', error);
      }
    }
  }, [location.pathname, path, searchParams]);

  return null;
}


function initializeGitHubImport(data: GitHubImportData) {
  workbenchStore.importFromGithub(data.repository.split('/')[0], data.repository.split('/')[1]);
}
