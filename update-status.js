import { Octokit } from "@octokit/rest";
import * as github from "@actions/github";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function run() {
  const context = github.context;
  console.log(`Event name: ${context.eventName}`);

  if (context.eventName === "pull_request") {
    const pr = context.payload.pull_request;
    console.log(`PR body: ${pr.body}`);
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
    const review = context.payload.review;
    console.log(`PR body: ${pr.body}`);
    const issueNumber = extractIssueNumber(pr.body);
    console.log(
      `Pull request review event detected. Issue number: ${issueNumber}`
    );
    console.log(`Review state: ${review.state}`);

    if (issueNumber) {
      if (
        review.state === "approved" ||
        review.state === "changes_requested" ||
        review.state === "commented" ||
        review.state === "dismissed"
      ) {
        console.log(
          `PR review submitted. Updating issue #${issueNumber} to "Under review"`
        );
        await updateIssueStatus(issueNumber, "Under review");
      } else {
        console.log(`Review state not handled: ${review.state}`);
      }
    } else {
      console.log("No issue number found in PR body.");
    }
  } else {
    console.log("Event not handled.");
  }
}

function extractIssueNumber(text) {
  console.log(`Extracting issue number from text: ${text}`);
  const match = text.match(/#(\d+)/);
  return match ? match[1] : null;
}

async function updateIssueStatus(issueNumber, status) {
  const context = github.context;
  console.log(`Updating issue #${issueNumber} with status: ${status}`);

  let state;
  switch (status) {
    case "Needs review":
      state = "open";
      break;
    case "Under review":
      state = "open";
      break;
    case "Pending auto close":
      state = "closed";
      break;
    default:
      state = "open";
  }

  await octokit.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    state: state,
    labels: [status],
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
