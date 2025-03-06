const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function run() {
  const context = github.context;

  if (context.eventName === "pull_request") {
    const pr = context.payload.pull_request;
    const issueNumber = extractIssueNumber(pr.body);

    if (issueNumber) {
      if (pr.state === "closed" && pr.merged) {
        await updateIssueStatus(issueNumber, "Pending auto close");
      } else {
        await updateIssueStatus(issueNumber, "Needs review");
      }
    }
  } else if (context.eventName === "pull_request_review") {
    const pr = context.payload.pull_request;
    const issueNumber = extractIssueNumber(pr.body);

    if (issueNumber) {
      await updateIssueStatus(issueNumber, "Under review");
    }
  }
}

function extractIssueNumber(text) {
  const match = text.match(/#(\d+)/);
  return match ? match[1] : null;
}

async function updateIssueStatus(issueNumber, status) {
  const context = github.context;
  await octokit.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    labels: [status],
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
