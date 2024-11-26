import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { GitHubLoader } from '~/components/github/GitHubLoader.client';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      {false && <Header />}
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <>
            <GitHubLoader />
            <Chat />
          </>
        )}
      </ClientOnly>
    </div>
  );
}
