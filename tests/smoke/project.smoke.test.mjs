import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

function expectFile(relPath) {
  const fullPath = path.join(ROOT, relPath)
  assert.equal(fs.existsSync(fullPath), true, `${relPath} must exist`)
  const stat = fs.statSync(fullPath)
  assert.equal(stat.isFile(), true, `${relPath} must be a file`)
}

test("critical app files exist", () => {
  expectFile("app/layout.tsx")
  expectFile("app/page.tsx")
  expectFile("next.config.mjs")
  expectFile("lib/firebase-admin.ts")
  expectFile("package.json")
})

test("package scripts include release gates", () => {
  const packageJsonPath = path.join(ROOT, "package.json")
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  assert.equal(typeof packageJson.scripts?.lint, "string")
  assert.equal(typeof packageJson.scripts?.typecheck, "string")
  assert.equal(typeof packageJson.scripts?.build, "string")
  assert.equal(typeof packageJson.scripts?.["test:smoke"], "string")
})

test("firebase admin env placeholders are documented", () => {
  const envExamplePath = path.join(ROOT, ".env.example")
  const envExample = fs.readFileSync(envExamplePath, "utf8")

  assert.match(envExample, /FIREBASE_DATABASE_URL=/)
  assert.match(envExample, /FIREBASE_SERVICE_ACCOUNT_KEY=/)
})
