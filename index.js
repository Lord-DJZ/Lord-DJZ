import { writeFile } from "node:fs/promises";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const git = simpleGit();
const dataPath = "data.json";
const requestedCommits = Number(process.argv[2] ?? 600);

if (!Number.isInteger(requestedCommits) || requestedCommits <= 0) {
  throw new Error("Pass a positive integer commit count, for example: node index.js 25");
}

const buildCommitDate = () => {
  const daysBack = random.int(0, 364);
  const hour = random.int(0, 23);
  const minute = random.int(0, 59);
  const second = random.int(0, 59);

  return moment()
    .subtract(daysBack, "days")
    .hour(hour)
    .minute(minute)
    .second(second)
    .millisecond(0)
    .format();
};

const writeCommitData = async (date, index) => {
  const payload = {
    date,
    commitNumber: index + 1,
    marker: `commit-${index + 1}-${Date.now()}-${random.int(1000, 9999)}`,
  };

  await writeFile(dataPath, `${JSON.stringify(payload)}\n`);
};

const getFirstCommitFiles = async () => {
  const status = await git.status();
  const files = [dataPath];

  if (status.files.some((file) => file.path === "index.js")) {
    files.push("index.js");
  }

  return files;
};

const makeCommits = async (count) => {
  const firstCommitFiles = await getFirstCommitFiles();

  for (let index = 0; index < count; index += 1) {
    const date = buildCommitDate();
    const filesToStage = index === 0 ? firstCommitFiles : [dataPath];

    await writeCommitData(date, index);
    await git.add(filesToStage);
    await simpleGit()
      .env({ GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date })
      .raw(["commit", "--allow-empty", "--date", date, "-m", date]);

    if ((index + 1) % 50 === 0 || index === count - 1) {
      console.log(`Created ${index + 1}/${count} commits`);
    }
  }

  await git.push("origin", "main");
};

makeCommits(requestedCommits).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
