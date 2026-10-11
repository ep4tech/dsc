import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('checker', Path(__file__).with_name('check_project.py'))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class CheckerTests(unittest.TestCase):
    def test_positions_and_exclusions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'example.ts').write_text('const x = 1;\nconst q = {filter: `id = "${id}"`};\n', encoding='utf-8')
            (root / 'node_modules').mkdir()
            (root / 'node_modules/ignored.ts').write_text('eval(userInput)', encoding='utf-8')
            findings, count, errors = checker.scan(root)
            self.assertEqual(count, 1)
            self.assertEqual(errors, [])
            self.assertEqual([(f['rule'], f['position']) for f in findings], [('DATA001', 'example.ts:2')])

    def test_redaction(self):
        self.assertNotIn('sensitive-value', checker.redact('password = "sensitive-value"'))

    def test_command_failure_and_timeout(self):
        import sys
        with tempfile.TemporaryDirectory() as directory:
            failed = checker.run_check(Path(directory), 'failure', [sys.executable, '-c', 'print("failed"); raise SystemExit(3)'], 5)
            self.assertEqual(failed['status'], 'FAIL')
            self.assertEqual(failed['exit_code'], 3)
            self.assertIn('failed', failed['output'])
            timed = checker.run_check(Path(directory), 'timeout', [sys.executable, '-c', 'import time; time.sleep(10)'], 1)
            self.assertEqual(timed['status'], 'TIMEOUT')


if __name__ == '__main__':
    unittest.main()
