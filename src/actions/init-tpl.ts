import { getInput } from '@actions/core';
import { context } from '@actions/github';
import { readJsonFile } from '@cpdevtools/lib-node-utilities';
import { Octokit } from '@octokit/rest';
import Path from 'path/posix';
import type { PackageJson } from 'type-fest';

type UninitializedPackageJson = PackageJson & {
  'package-template': PackageJson
}

function isUninitializedPackageJson(obj: any): obj is UninitializedPackageJson {
  return typeof obj === 'object'
    && typeof obj['package-template'] === 'object';
}

export async function initializeTemplateInstance() {
  const packageFile = getInput('packageFile', { trimWhitespace: true, required: true });
  const githubTokenInput = getInput('githubToken', { trimWhitespace: true });
  const octokit = new Octokit({ auth: githubTokenInput });

  const path = Path.normalize(packageFile);
  const repoOwner = context.repo.owner;
  const repoName = context.repo.repo;
  const repo = `${repoOwner}/${repoName}`;
  const pkgName = `@${repo}`;

  const pkg = await readJsonFile(packageFile);
  if (pkg.name !== pkgName) {

    if (!isUninitializedPackageJson(pkg)) {
      throw new Error('Cannot initialize template fork.')
    }

    const newPkg = Object.assign({}, pkg, pkg['package-template']) as PackageJson;
    newPkg.name = `@${repo}`;

    delete newPkg['package-template'];
    newPkg.version = '0.0.0-dev.0';
    newPkg.repository = `https://github.com/${repo}`;

    newPkg.fromTemplate ??= [];
    (newPkg.fromTemplate as string[]).unshift(`${pkg.name}@${pkg.version}`);

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
}
