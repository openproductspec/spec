import { defineConfig } from "vitest/config";

// Two test files build dist/cli.js in a beforeAll hook and then spawn it. Running
// the test files serially keeps those builds from overlapping, so one file never
// spawns dist/cli.js while another file is mid-rebuild and the file is truncated.
export default defineConfig({
  test: {
    fileParallelism: false
  }
});
