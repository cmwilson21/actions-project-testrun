const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function run() {
  const context = github.context;
  console.log(`Event name: ${context.eventName}`);

  if (context.eventName === "pull_request") {
    const pr = context.payload.pull_request;
    const issueNumber = extractIssueNumber(pr.body);
    console.log(`Pull request event detected. Issue number: ${issueNumber}`);

    if (issueNumber) {
      if (pr.state === "closed" && pr.merged) {
        console.log(
          `PR merged. Updating issue #${issueNumber} to "Pending auto close"`
        );
        await updateIssueStatus(issueNumber, "Pending auto close");
      } else {
        console.log(
          `PR opened or edited. Updating issue #${issueNumber} to "Needs review"`
        );
        await updateIssueStatus(issueNumber, "Needs review");
      }
    } else {
      console.log("No issue number found in PR body.");
    }
  } else if (context.eventName === "pull_request_review") {
    const pr = context.payload.pull_request;
    const issueNumber = extractIssueNumber(pr.body);
    console.log(
      `Pull request review event detected. Issue number: ${issueNumber}`
    );

    if (issueNumber) {
      console.log(
        `PR review submitted. Updating issue #${issueNumber} to "Under review"`
      );
      await updateIssueStatus(issueNumber, "Under review");
    } else {
      console.log("No issue number found in PR body.");
    }
  } else {
    console.log("Event not handled.");
  }
}

function extractIssueNumber(text) {
  const match = text.match(/#(\d+)/);
  return match ? match[1] : null;
}

async function updateIssueStatus(issueNumber, status) {
  const context = github.context;
  console.log(`Updating issue #${issueNumber} with status: ${status}`);
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
