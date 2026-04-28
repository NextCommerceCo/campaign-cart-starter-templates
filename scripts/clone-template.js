#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, "src");
const campaignsPath = path.join(projectRoot, "_data", "campaigns.json");
const slugPattern = /^[a-z0-9-]+$/;

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readCampaigns() {
  const raw = await fs.readFile(campaignsPath, "utf8");
  return JSON.parse(raw);
}

function listTemplates(campaigns) {
  return Object.keys(campaigns).sort((a, b) => a.localeCompare(b));
}

function validateSlug(input) {
  if (!input) return "Slug cannot be empty.";
  if (!slugPattern.test(input)) {
    return "Slug must use lowercase letters, numbers, and dashes only.";
  }
  return null;
}

async function chooseTemplate(rl, templates) {
  stdout.write("\nAvailable templates:\n");
  templates.forEach((template, index) => {
    stdout.write(`${index + 1}. ${template}\n`);
  });

  const selected = await rl.question("\nSelect template number: ");
  const choice = Number.parseInt(selected.trim(), 10);

  if (!Number.isInteger(choice) || choice < 1 || choice > templates.length) {
    throw new Error("Invalid template selection.");
  }

  return templates[choice - 1];
}

async function promptSlug(rl) {
  const input = (await rl.question("New campaign slug (e.g. my-campaign): ")).trim();
  const error = validateSlug(input);
  if (error) {
    throw new Error(error);
  }
  return input;
}

async function promptName(rl, fallbackName) {
  const input = (await rl.question(`Campaign display name [${fallbackName}]: `)).trim();
  return input || fallbackName;
}

async function assertProjectShape() {
  if (!(await pathExists(srcDir))) {
    throw new Error("Missing src/ directory. Run this from your campaign-kit project root.");
  }
  if (!(await pathExists(campaignsPath))) {
    throw new Error("Missing _data/campaigns.json. Run `npx campaign-init` first.");
  }
}

async function run() {
  await assertProjectShape();

  const campaigns = await readCampaigns();
  const templates = listTemplates(campaigns);
  if (templates.length === 0) {
    throw new Error("No templates found in _data/campaigns.json.");
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const template = await chooseTemplate(rl, templates);
    const slug = await promptSlug(rl);
    const name = await promptName(rl, campaigns[template].name);
    const sourceDir = path.join(srcDir, template);
    const targetDir = path.join(srcDir, slug);

    if (!(await pathExists(sourceDir))) {
      throw new Error(`Template folder not found: src/${template}`);
    }
    if (await pathExists(targetDir)) {
      throw new Error(`Target folder already exists: src/${slug}`);
    }
    if (campaigns[slug]) {
      throw new Error(`A campaign with slug '${slug}' already exists in _data/campaigns.json.`);
    }

    stdout.write("\nSummary:\n");
    stdout.write(`- Template: ${template}\n`);
    stdout.write(`- New slug: ${slug}\n`);
    stdout.write(`- New name: ${name}\n`);
    const confirm = (await rl.question("Proceed? [y/N]: ")).trim().toLowerCase();
    if (confirm !== "y" && confirm !== "yes") {
      stdout.write("Aborted.\n");
      return;
    }

    await fs.cp(sourceDir, targetDir, { recursive: true });

    const newCampaigns = {
      ...campaigns,
      [slug]: {
        ...campaigns[template],
        name,
      },
    };

    await fs.writeFile(campaignsPath, `${JSON.stringify(newCampaigns, null, 2)}\n`, "utf8");

    stdout.write("\nDone.\n");
    stdout.write(`- Created: src/${slug}\n`);
    stdout.write(`- Added: _data/campaigns.json -> ${slug}\n`);
    stdout.write("\nNext steps:\n");
    stdout.write("- npm run config\n");
    stdout.write("- npm run dev\n");
  } finally {
    rl.close();
  }
}

run().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
