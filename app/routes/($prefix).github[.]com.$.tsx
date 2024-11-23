import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { GitHubLoader } from '~/components/github/GitHubLoader.client';

export interface GitHubImportData {
  repository: string;
  targetDir: string;
  path?: string;
  branch?: string;
}

interface LoaderData {
  github?: GitHubImportData;
}

// Handle URLs like /github.com/owner/repo or /github/owner/repo
export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = params['*'] || '';
  const prefix = params.prefix || '';
  
  // Extract owner/repo from the URL path
  const repoPath = path.replace(/^(\.com\/)?/, '');
  const [owner, repo, ...rest] = repoPath.split('/');
  
  if (!owner || !repo) {
    return json<LoaderData>({});
  }

  // Create the GitHub data object
  const githubData: GitHubImportData = {
    repository: `${owner}/${repo}`,
    targetDir: '.',
    branch: url.searchParams.get('branch') || undefined,
    path: rest.length > 0 ? rest.join('/') : undefined,
  };

  return json<LoaderData>({ github: githubData });
}

export default function GitHubImport() {
  const { github } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <>
            {github && <GitHubLoader initialData={github} />}
            <Chat />
          </>
        )}
      </ClientOnly>
    </div>
  );
}
