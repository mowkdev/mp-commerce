#!/usr/bin/env node
const { spawnSync } = require("child_process")

const email = process.env.ADMIN_EMAIL || "admin@medusa-test.com"
const password = process.env.ADMIN_PASSWORD || "supersecret"

console.log(`> medusa user -e ${email} -p ********`)

const result = spawnSync(
  "npx",
  ["medusa", "user", "-e", email, "-p", password],
  { stdio: ["inherit", "pipe", "pipe"], shell: true }
)

const stdout = result.stdout?.toString() || ""
const stderr = result.stderr?.toString() || ""
process.stdout.write(stdout)
process.stderr.write(stderr)

const combined = `${stdout}\n${stderr}`.toLowerCase()
const alreadyExists =
  combined.includes("already exists") ||
  combined.includes("duplicate") ||
  combined.includes("unique constraint")

if (result.status === 0) {
  console.log(`Admin user "${email}" ready.`)
  process.exit(0)
}

if (alreadyExists) {
  console.log(`Admin user "${email}" already exists — skipping.`)
  process.exit(0)
}

console.error(`Failed to create admin user (exit code ${result.status}).`)
process.exit(result.status ?? 1)
