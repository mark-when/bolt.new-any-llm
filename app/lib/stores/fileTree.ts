import { atom, map } from 'nanostores';
import type { FileMap } from './files';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FileTree');

const NODE_PADDING_LEFT = 8;
const DEFAULT_HIDDEN_FILES = [/\/node_modules\//, /\/\.next/, /\/\.astro/];

export type Node = FileNode | FolderNode;

interface BaseNode {
  id: number;
  depth: number;
  name: string;
  fullPath: string;
}

interface FileNode extends BaseNode {
  kind: 'file';
}

interface FolderNode extends BaseNode {
  kind: 'folder';
}

interface FileTreeState {
  fileList: Node[];
  hiddenFiles: Array<string | RegExp>;
  rootFolder: string;
  hideRoot: boolean;
}

class FileTreeStore {
  state = map<FileTreeState>({
    fileList: [],
    hiddenFiles: DEFAULT_HIDDEN_FILES,
    rootFolder: '/',
    hideRoot: false,
  });

  collapsedFolders = atom<Set<string>>(new Set());

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.state = this.state;
      import.meta.hot.data.collapsedFolders = this.collapsedFolders;
    }
  }

  setFiles(files: FileMap, rootFolder = '/', hideRoot = false, additionalHiddenFiles: Array<string | RegExp> = []) {
    const hiddenFiles = [...DEFAULT_HIDDEN_FILES, ...additionalHiddenFiles];
    const fileList = this.buildFileList(files, rootFolder, hideRoot, hiddenFiles);

    this.state.set({
      fileList,
      hiddenFiles,
      rootFolder,
      hideRoot,
    });

    // Update collapsed folders based on new file list
    this.updateCollapsedFolders(fileList);
  }

  private updateCollapsedFolders(fileList: Node[]) {
    const currentCollapsed = this.collapsedFolders.get();
    const newCollapsed = new Set<string>();

    for (const folder of fileList) {
      if (folder.kind === 'folder' && currentCollapsed.has(folder.fullPath)) {
        newCollapsed.add(folder.fullPath);
      }
    }

    this.collapsedFolders.set(newCollapsed);
  }

  collapseFolder(fullPath: string) {
    if (this.collapsedFolders.get().has(fullPath)) {
      return;
    }
    const currentCollapsed = this.collapsedFolders.get();
    const newCollapsed = new Set(currentCollapsed);

    newCollapsed.add(fullPath);
    this.collapsedFolders.set(newCollapsed);
  }

  toggleFolder(fullPath: string) {
    const currentCollapsed = this.collapsedFolders.get();
    const newCollapsed = new Set(currentCollapsed);

    if (newCollapsed.has(fullPath)) {
      newCollapsed.delete(fullPath);
    } else {
      newCollapsed.add(fullPath);
    }

    this.collapsedFolders.set(newCollapsed);
  }

  collapseAll() {
    const folders = this.state
      .get()
      .fileList.filter((item) => item.kind === 'folder')
      .map((item) => item.fullPath);
    this.collapsedFolders.set(new Set(folders));
  }

  expandAll() {
    this.collapsedFolders.set(new Set());
  }

  getFilteredFileList(): Node[] {
    const { fileList } = this.state.get();
    const collapsedFolders = this.collapsedFolders.get();
    const list = [];

    let lastDepth = Number.MAX_SAFE_INTEGER;

    for (const fileOrFolder of fileList) {
      const depth = fileOrFolder.depth;

      // if the depth is equal we reached the end of the collapsed group
      if (lastDepth === depth) {
        lastDepth = Number.MAX_SAFE_INTEGER;
      }

      // ignore collapsed folders
      if (collapsedFolders.has(fileOrFolder.fullPath)) {
        lastDepth = Math.min(lastDepth, depth);
      }

      // ignore files and folders below the last collapsed folder
      if (lastDepth < depth) {
        continue;
      }

      list.push(fileOrFolder);
    }

    return list;
  }

  private buildFileList(
    files: FileMap,
    rootFolder = '/',
    hideRoot: boolean,
    hiddenFiles: Array<string | RegExp>,
  ): Node[] {
    const folderPaths = new Set<string>();
    const fileList: Node[] = [];

    let defaultDepth = 0;

    if (rootFolder === '/' && !hideRoot) {
      defaultDepth = 1;
      fileList.push({ kind: 'folder', name: '/', depth: 0, id: 0, fullPath: '/' });
    }

    for (const [filePath, dirent] of Object.entries(files)) {
      const segments = filePath.split('/').filter((segment) => segment);
      const fileName = segments.at(-1);

      if (!fileName || this.isHiddenFile(filePath, fileName, hiddenFiles)) {
        continue;
      }

      let currentPath = '';
      let i = 0;
      let depth = 0;

      while (i < segments.length) {
        const name = segments[i];
        const fullPath = (currentPath += `/${name}`);

        if (!fullPath.startsWith(rootFolder) || (hideRoot && fullPath === rootFolder)) {
          i++;
          continue;
        }

        if (i === segments.length - 1 && dirent?.type === 'file') {
          fileList.push({
            kind: 'file',
            id: fileList.length,
            name,
            fullPath,
            depth: depth + defaultDepth,
          });
        } else if (!folderPaths.has(fullPath)) {
          folderPaths.add(fullPath);

          fileList.push({
            kind: 'folder',
            id: fileList.length,
            name,
            fullPath,
            depth: depth + defaultDepth,
          });
        }

        i++;
        depth++;
      }
    }

    return this.sortFileList(rootFolder, fileList, hideRoot);
  }

  private isHiddenFile(filePath: string, fileName: string, hiddenFiles: Array<string | RegExp>) {
    return hiddenFiles.some((pathOrRegex) => {
      if (typeof pathOrRegex === 'string') {
        return fileName === pathOrRegex;
      }
      return pathOrRegex.test(filePath);
    });
  }

  private sortFileList(rootFolder: string, nodeList: Node[], hideRoot: boolean): Node[] {
    logger.trace('sortFileList');

    const nodeMap = new Map<string, Node>();
    const childrenMap = new Map<string, Node[]>();

    // pre-sort nodes by name and type
    nodeList.sort((a, b) => this.compareNodes(a, b));

    for (const node of nodeList) {
      nodeMap.set(node.fullPath, node);

      const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf('/'));

      if (parentPath !== rootFolder.slice(0, rootFolder.lastIndexOf('/'))) {
        if (!childrenMap.has(parentPath)) {
          childrenMap.set(parentPath, []);
        }

        childrenMap.get(parentPath)?.push(node);
      }
    }

    const sortedList: Node[] = [];

    const depthFirstTraversal = (path: string): void => {
      const node = nodeMap.get(path);

      if (node) {
        sortedList.push(node);
      }

      const children = childrenMap.get(path);

      if (children) {
        for (const child of children) {
          if (child.kind === 'folder') {
            depthFirstTraversal(child.fullPath);
          } else {
            sortedList.push(child);
          }
        }
      }
    };

    if (hideRoot) {
      // if root is hidden, start traversal from its immediate children
      const rootChildren = childrenMap.get(rootFolder) || [];

      for (const child of rootChildren) {
        depthFirstTraversal(child.fullPath);
      }
    } else {
      depthFirstTraversal(rootFolder);
    }

    return sortedList;
  }

  private compareNodes(a: Node, b: Node): number {
    if (a.kind !== b.kind) {
      return a.kind === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  }
}

export const fileTreeStore = new FileTreeStore();
