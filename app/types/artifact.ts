export interface BoltArtifactData {
  id: string;
  title: string;
}

export interface GitHubProjectArtifact extends BoltArtifactData {
  type: 'github';
  repository: string;  // Format: owner/repo
  branch?: string;     // Optional branch name, defaults to main/master
  path?: string;       // Optional subdirectory path within the repository
}
