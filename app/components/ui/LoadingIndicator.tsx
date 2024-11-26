import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

export const LoadingIndicator = () => {
  const outstandingFiles = useStore(workbenchStore.outstandingFiles);
  const loadedFiles = useStore(workbenchStore.loadedFiles);

  return (
    (loadedFiles < outstandingFiles) && <div className="mx-4 p-[px] text-sm text-bolt-elements-item-contentDefault max-w-48 grow shrink bg-bolt-elements-background-depth-1 rounded-full">
      <div
        className="h-2 rounded"
        style={{
          width: `${Math.max(Math.min(loadedFiles / outstandingFiles, 1), 0) * 100}%`,
          backgroundColor: `var(--bolt-elements-item-contentAccent)`,
        }}
      ></div>
    </div>
  );
};
