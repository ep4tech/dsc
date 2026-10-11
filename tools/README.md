# DSC project checker

Run from the DSC workspace with Python 3.10 or later:

```powershell
python dsc/tools/check_project.py
```

The checker generates `dsc/reports/dsc-report.txt` and a matching JSON report.
Each source finding includes file and line, category, severity, issue, and
details. Compiler, lint and unit-test failures retain their original diagnostic
positions in the diagnostics section. Python uses only its standard library.
Node and installed project dependencies are needed for executable checks.

Options:

```powershell
python dsc/tools/check_project.py --static-only
python dsc/tools/check_project.py --build --timeout 300
python dsc/tools/check_project.py --project dsc --output dsc/reports/review.txt
python -m unittest discover -s dsc/tools -p "test_*.py"
```

Default diagnostics run TypeScript, ESLint, and discovered `tests/*.test.cjs`
and `tests/*.test.ts`. Integration scripts are excluded because they may modify
live data. Build is opt-in. No dependencies are installed automatically.
Unit tests execute repository code; use `--static-only` when reviewing an
untrusted checkout. Run only trusted projects.

Exit code 0 means no findings, no scan errors, and all selected diagnostics
passed. Exit code 1 means findings, failures, or incomplete checks. Invalid
arguments exit with code 2. Heuristic findings need review and may be false
positives; absence of findings is not proof of correctness or security.
Historical migration rules may have been replaced. This tool does not resolve
the effective deployed access rules, inspect live databases, test browsers,
scan dependency CVEs, or fix the application. Log redaction is best effort;
review reports before sharing them externally.
