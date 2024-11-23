export type ActionType = 'file' | 'shell' | 'github';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface GitHubAction extends BaseAction {
  type: 'github';
  repository: string;     // Format: owner/repo
  targetDir: string;      // Directory to clone into
  branch?: string;        // Optional branch name
  path?: string;         // Optional subdirectory path within the repository
}

export type BoltAction = FileAction | ShellAction | StartAction | GitHubAction;

export type BoltActionData = BoltAction | BaseAction;
