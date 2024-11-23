import { useEffect } from 'react';
import { useLocation } from '@remix-run/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { ActionRunner } from '~/lib/runtime/action-runner';
import { webcontainer } from '~/lib/webcontainer';
import type { GitHubAction } from '~/types/actions';
import type { GitHubImportData } from '~/routes/($prefix).github[.]com.$';

interface GitHubLoaderProps {
  initialData?: GitHubImportData;
}

export function GitHubLoader({ initialData }: GitHubLoaderProps) {
  const location = useLocation();

  useEffect(() => {
    // If we have initial data from the route, use it
    if (initialData) {
      initializeGitHubImport(initialData);
      return;
    }

    // Otherwise, check for URL parameters (for backward compatibility)
    const url = new URL(window.location.href);
    const githubParam = url.searchParams.get('github');

    if (githubParam) {
      try {
        const githubData = JSON.parse(decodeURIComponent(githubParam));
        initializeGitHubImport(githubData);
      } catch (error) {
        console.error('Failed to parse GitHub data:', error);
      }
    }
  }, [location.pathname, initialData]);

  return null;
}

async function getDirectoryContents(owner: string, repo: string, branch: string, path: string = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get directory contents: ${response.statusText}`);
  }
  return response.json();
}

async function downloadFile(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function initializeGitHubImport(data: GitHubImportData) {
  const messageId = `github-${data.repository.replace('/', '-')}`;

  // Initialize workbench with the GitHub repository
  workbenchStore.artifacts.setKey(messageId, {
    id: messageId,
    title: data.repository,
    closed: false,
    runner: new ActionRunner(webcontainer, () => workbenchStore.boltTerminal),
  });

  if (!workbenchStore.artifactIdList.includes(messageId)) {
    workbenchStore.artifactIdList.push(messageId);
  }

  // Create and run the GitHub action
  const action: GitHubAction = {
    type: 'github',
    repository: data.repository,
    targetDir: data.targetDir,
    content: '',
  };

  if (data.branch) {
    action.branch = data.branch;
  }

  if (data.path) {
    action.path = data.path;
  }

  workbenchStore.addAction({
    messageId,
    actionId: messageId,
    artifactId: messageId,
    action,
  });

  workbenchStore.runAction({
    messageId,
    actionId: messageId,
    artifactId: messageId,
    action,
  });

  // Show the workbench
  workbenchStore.showWorkbench.set(true);
}
