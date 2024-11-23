import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { GitHubLoader } from '~/components/github/GitHubLoader.client';

interface LoaderData {
  path: string;
  searchParams: Record<string, string>;
}

// Handle URLs like /github.com/owner/repo or /github/owner/repo
export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  return json<LoaderData>({ 
    path: params['*'] || '',
    searchParams
  });
}

export default function GitHubImport() {
  const { path, searchParams } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <>
            <GitHubLoader path={path} searchParams={searchParams} />
            <Chat />
          </>
        )}
      </ClientOnly>
    </div>
  );
}
