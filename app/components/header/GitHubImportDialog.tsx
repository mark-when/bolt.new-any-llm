import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';

export function GitHubImportDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleImport = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!url) return;

    // Extract repository path from URL
    const repoPath = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
    
    // Navigate to our GitHub import route
    navigate(`/github.com/${repoPath}`);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-bolt-elements-textPrimary bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundHover rounded-md">
          <div className="i-ph:git-branch-duotone text-lg" />
          Import project from GitHub
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bolt-elements-background border border-bolt-elements-borderColor p-6 rounded-lg shadow-lg min-w-[400px] z-50 bg-bolt-elements-background-depth-1 ">
          <Dialog.Title className="text-lg font-medium mb-4 text-bolt-elements-textPrimary">
            Import GitHub Repository
          </Dialog.Title>
          <form onSubmit={handleImport}>
            <div className="space-y-4">
              <div>
                <label htmlFor="github-url" className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  GitHub Repository URL or Path
                </label>
                <input
                  id="github-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="github.com/owner/repo"
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColor"
                />
                <p className="mt-1 text-xs text-bolt-elements-textTertiary">
                  Example: github.com/owner/repo or https://github.com/owner/repo
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 text-sm text-bolt-elements-textSecondary hover:bg-bolt-elements-backgroundHover rounded-md">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={!url}
                  className="px-4 py-2 text-sm bg-bolt-elements-button-background text-bolt-elements-button-text hover:bg-bolt-elements-button-backgroundHover rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
