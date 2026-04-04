'use strict';

const simpleGit = require('simple-git');

async function getGitInfo() {
  try {
    const git = simpleGit();
    const [branch, log, remotes, tags] = await Promise.all([
      git.revparse(['--abbrev-ref', 'HEAD']),
      git.log({ maxCount: 10 }),
      git.getRemotes(true),
      git.tags(),
    ]);
    return {
      branch: branch.trim(),
      commit: log.latest ? log.latest.hash : null,
      log: log.all,
      remoteUrl: remotes[0] && remotes[0].refs ? remotes[0].refs.fetch : null,
      tags: tags.all,
    };
  } catch (_err) {
    return { branch: null, commit: null, log: [], remoteUrl: null, tags: [] };
  }
}

module.exports = { getGitInfo };
