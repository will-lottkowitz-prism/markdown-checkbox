import * as path from 'path';
import * as fs from 'fs';
import { runTests } from 'vscode-test';

const main = async () => {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './spec/index');

    // The folder that is used as workspace in the tests
    const testWorkspace = path.resolve(__dirname, './workspace');

    // Pin the VS Code build with VSCODE_TEST_VERSION (e.g. "1.131.0") so a
    // machine that already has that build cached - or CI - can run the suite
    // without reaching the update server. Defaults to the latest stable.
    const version = process.env.VSCODE_TEST_VERSION || undefined;

    // Download VS Code, unzip it and run the integration test
    await runTests({
      version,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [testWorkspace, '--disable-extensions'],
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
};

main();
