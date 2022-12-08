import { getInput } from '@actions/core';
import { readJsonFile, writeJsonFile } from '@cpdevtools/lib-node-utilities';
import type { PackageJson } from 'type-fest';
import { Octokit } from '@octokit/rest';
import { context } from '@actions/github';

import Path from 'path/posix';

type UninitializedPackageJson = PackageJson & {
  'package-template': PackageJson
}

function isUninitializedPackageJson(obj: any): obj is UninitializedPackageJson {
  return typeof obj === 'object'
    && typeof obj['package-template'] === 'object';
}

export async function initializeFork() {
  const packageFile = getInput('packageFile', { trimWhitespace: true, required: true });
  const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
  const octokit = new Octokit({ auth: githubTokenInput });

  const pkg = await readJsonFile(packageFile);
  if (!isUninitializedPackageJson(pkg)) {
    throw new Error('Cannot initialize template fork.')
  }

  const newPkg = Object.assign({}, pkg, pkg['package-template']) as PackageJson;
  delete newPkg['package-template'];

  const path = Path.normalize(packageFile);
  const repoOwner = context.repo.owner;
  const repoName = context.repo.repo;
  const repo = `${repoOwner}/${repoName}`;

  newPkg.name = `@${repo}`;
  newPkg.version = '0.0.0-dev.0';
  newPkg.repository = `https://github.com/${repo}`;

  const fileDataResult = await octokit.repos.getContent({
    owner: repoOwner,
    repo: repoName,
    path: Path.normalize(packageFile)
  });

  const fileData = fileDataResult.data as { sha: string };
  const sha = fileData.sha;

  await octokit.repos.createOrUpdateFileContents({
    owner: repoOwner,
    repo: repoName,
    content: Buffer.from(JSON.stringify(newPkg, undefined, 2), 'utf-8').toString('base64'),
    message: 'switched to package-template',
    path,
    sha,
  });
}
