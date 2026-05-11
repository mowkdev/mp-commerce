#!/usr/bin/env node
const { execSync } = require("child_process")

const DB_NAME = process.env.DB_NAME || "medusa-dtc-starter"
const CONTAINER = process.env.DB_CONTAINER || "mp-commerce-postgres"
const USER = process.env.DB_USER || "postgres"

function run(cmd) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: "inherit" })
}

try {
  run(
    `docker exec ${CONTAINER} psql -U ${USER} -d postgres -c "DROP DATABASE IF EXISTS \\"${DB_NAME}\\" WITH (FORCE);"`
  )
  run(
    `docker exec ${CONTAINER} psql -U ${USER} -d postgres -c "CREATE DATABASE \\"${DB_NAME}\\";"`
  )
  console.log(`Database "${DB_NAME}" reset.`)
} catch (e) {
  console.error(`Failed to reset database: ${e.message}`)
  process.exit(1)
}
