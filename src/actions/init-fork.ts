import { getInput } from '@actions/core';
import { readJsonFile, writeJsonFile } from '@cpdevtools/lib-node-utilities';
import type { PackageJson } from 'type-fest';
import { Octokit } from '@octokit/rest';
import { context } from '@actions/github';

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

  const newPkg = pkg['package-template'];

  await octokit.repos.createOrUpdateFileContents({
    content: JSON.stringify(newPkg, undefined, 2),
    message: 'switched to package-template',
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: packageFile
  });
}
