#!/usr/bin/env python3
"""The beta workflow must keep a newline-free Expo property parseable."""

import subprocess
import tempfile
import unittest
from pathlib import Path


WORKFLOW = Path(__file__).resolve().parents[2] / ".github/workflows/orca-beta-android-arm64.yml"
STEP = "      - name: Pin Gradle workers + ARM64-only architectures\n"


class BetaGradleProperties(unittest.TestCase):
    def test_append_preserves_expo_json_property_without_final_newline(self):
        workflow = WORKFLOW.read_text()
        block = workflow.split(STEP, 1)[1].split("      - name:", 1)[0]
        script = "\n".join(
            line[10:] for line in block.splitlines()[1:] if line.startswith("          ")
        )
        with tempfile.TemporaryDirectory() as root:
            android = Path(root) / "android"
            android.mkdir()
            props = android / "gradle.properties"
            props.write_bytes(b"expo.inlineModules.watchedDirectories=[]")
            subprocess.run(["bash", "-c", script], cwd=root, check=True, capture_output=True)
            lines = props.read_text().splitlines()
        self.assertIn("expo.inlineModules.watchedDirectories=[]", lines)
        self.assertIn("reactNativeArchitectures=arm64-v8a", lines)
        self.assertIn("org.gradle.workers.max=2", lines)
        self.assertIn("org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=512m", lines)


if __name__ == "__main__":
    unittest.main()
