"""DSC source review and local diagnostics. Python 3.10+, no pip dependencies."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

EXCLUDE = {"node_modules", ".git", ".next", "out", "dist", "coverage", "reports", "tools", "pb_data", "public"}
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"}


def redact(text: str) -> str:
    text = re.sub(r'(?i)((?:password|api[_-]?key|token|secret)\s*[:=]\s*)[\"\'][^\"\'\n]+[\"\']', r'\1"[REDACTED]"', text)
    text = re.sub(r'\b(?:re_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|\d{8,12}:[A-Za-z0-9_-]{30,})\b', '[REDACTED]', text)
    return text


def scan(root: Path) -> tuple[list[dict], int, list[str]]:
    findings, errors = [], []
    count = 0

    def add(path, line, rule, category, severity, issue, details):
        findings.append(dict(position=f"{path.relative_to(root).as_posix()}:{line}", rule=rule,
                             category=category, severity=severity, confidence="review required",
                             issue=issue, details=details))

    for directory, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE and not Path(directory, d).is_symlink())
        for name in sorted(files):
            path = Path(directory, name)
            if path.is_symlink() or path.suffix not in EXTENSIONS or name in {"package-lock.json", "next-env.d.ts"}:
                continue
            try:
                source = path.read_text(encoding="utf-8-sig")
            except (OSError, UnicodeError) as exc:
                errors.append(f"{path.relative_to(root)}: {type(exc).__name__}")
                continue
            count += 1
            lines = source.splitlines()
            for number, line in enumerate(lines, 1):
                rules = [
                    (r'filter\s*:\s*`[^`]*\$\{', 'DATA001', 'data handling', 'MEDIUM', 'Interpolated database filter', 'An interpolated filter may change query meaning if a value contains quotes or operators. Check value provenance and use PocketBase filter binding.'),
                    (r'dangerouslySetInnerHTML', 'SEC001', 'security', 'HIGH', 'HTML injection sink', 'Trace the HTML to its source and verify robust sanitization before rendering. This sink alone does not prove XSS.'),
                    (r'\beval\s*\(|\bnew\s+Function\s*\(', 'SEC002', 'security', 'HIGH', 'Dynamic code execution', 'Verify no untrusted content reaches this execution point; prefer a restricted parser.'),
                    (r'NEXT_PUBLIC_[A-Z_]*(?:SECRET|TOKEN|PASSWORD|API_KEY)', 'SEC003', 'security', 'HIGH', 'Potential secret exposed to browser', 'Next.js public environment variables are browser-visible. Verify this value is intentionally public.'),
                    (r'\bgetFullList\s*\(', 'DATA002', 'data handling', 'MEDIUM', 'Unbounded collection retrieval', 'Review expected record counts and access rules. Use pagination or an explicit bounded query for growing datasets.'),
                    (r'\b(?:as\s+any|:\s*any\b)', 'DESIGN001', 'design', 'LOW', 'Type safety bypass', 'Review this boundary for runtime validation; an any type can hide incompatible data shapes.'),
                    (r'catch\s*(?:\([^)]*\))?\s*\{\s*\}', 'DATA003', 'data handling', 'MEDIUM', 'Empty error handler', 'A failure can disappear without feedback or recovery. Surface or deliberately document the error.'),
                    (r'\b(?:listRule|viewRule|createRule|updateRule|deleteRule)\s*:\s*[\"\']\s*[\"\']', 'SEC004', 'security', 'HIGH', 'Public PocketBase rule in migration', 'An empty rule grants public access. Check collection sensitivity and later migrations; historical rules may have been replaced.'),
                ]
                for pattern, rule, category, severity, issue, details in rules:
                    if re.search(pattern, line):
                        add(path, number, rule, category, severity, issue, details)
            if len(lines) > 650:
                add(path, 1, 'DESIGN002', 'design', 'MEDIUM', 'Large module', f'{len(lines)} lines. Review separation of UI, validation, and persistence responsibilities; size is a review signal, not a defect by itself.')
            if path.name == 'route.ts' and 'POST' in source:
                line = next((i for i, value in enumerate(lines, 1) if 'function POST' in value), 1)
                if re.search(r'emails\.send|api\.telegram\.org', source):
                    if not re.search(r'authStore|authRefresh|getServerSession|requireAuth|verifyToken|authorization|authenticate', source, re.I):
                        add(path, line, 'SEC005', 'security', 'HIGH', 'Messaging route has no visible authentication check', 'This handler invokes an external messaging service. Verify middleware and deployment controls; public contact endpoints still need abuse protection and fixed recipients.')
                    if not re.search(r'rateLimit|ratelimit|captcha|turnstile', source, re.I):
                        add(path, line, 'SEC006', 'security', 'MEDIUM', 'No visible messaging abuse protection', 'Check gateway controls and add enforced throttling or bot protection to prevent spam and service-cost abuse.')
                if 'request.json()' in source and not re.search(r'validate\w*\(|\.safeParse\(|\.parse\(raw|typeof\s', source):
                    add(path, line, 'DATA004', 'data handling', 'MEDIUM', 'Request shape validation needs review', 'Presence checks do not establish types, lengths, allowed recipients, or attachment limits. Validate the complete request schema before using data.')
                if re.search(r'Response\.json\(\{ error: message', source):
                    add(path, line, 'SEC007', 'security', 'MEDIUM', 'Raw exception returned to caller', 'Upstream exceptions can expose internal details. Return a generic error and record redacted diagnostics server-side.')
    return findings, count, errors


def run_check(root: Path, label: str, args: list[str], timeout: int) -> dict:
    started = datetime.now(timezone.utc)
    executable = shutil.which(args[0]) if not Path(args[0]).is_absolute() else args[0]
    result = dict(name=label, command=args, status="SKIPPED", exit_code=None, output="")
    if not executable:
        result['output'] = f"Required executable unavailable: {args[0]}"
        return result
    # Output goes to a temporary file to avoid unbounded memory use for large lint logs.
    with tempfile.TemporaryFile() as log:
        try:
            process = subprocess.Popen([executable, *args[1:]], cwd=root, stdout=log,
                                       stderr=subprocess.STDOUT, shell=False)
            try:
                code = process.wait(timeout=timeout)
                result.update(status='PASS' if code == 0 else 'FAIL', exit_code=code)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
                result['status'] = 'TIMEOUT'
        except OSError as exc:
            result.update(status='ERROR', output=str(exc))
        log.seek(0)
        output = log.read(160_000).decode('utf-8', errors='replace')
        if log.read(1):
            output += '\n[Output truncated at 160000 bytes]'
        result['output'] += redact(output)
    result['seconds'] = round((datetime.now(timezone.utc) - started).total_seconds(), 2)
    return result


def diagnostics(root: Path, timeout: int, build: bool) -> list[dict]:
    checks = []
    for label, relative, args in [
        ('TypeScript', 'node_modules/typescript/bin/tsc', ['--noEmit', '--incremental', 'false']),
        ('ESLint', 'node_modules/eslint/bin/eslint.js', ['.']),
    ]:
        tool = root / relative
        if tool.is_file():
            checks.append(run_check(root, label, ['node', str(tool), *args], timeout))
        else:
            checks.append(dict(name=label, status='SKIPPED', output=f'Missing local dependency: {relative}', exit_code=None))
    tests = sorted((root / 'tests').glob('*.test.cjs'))
    ts_tests = sorted((root / 'tests').glob('*.test.ts'))
    for path in tests:
        checks.append(run_check(root, f'Unit test {path.name}', ['node', str(path)], timeout))
    for path in ts_tests:
        if (root / 'node_modules/tsx/dist/cli.mjs').is_file():
            checks.append(run_check(root, f'Unit test {path.name}', ['node', str(root / 'node_modules/tsx/dist/cli.mjs'), str(path)], timeout))
        else:
            checks.append(dict(name=f'Unit test {path.name}', status='SKIPPED', output='Local tsx dependency missing', exit_code=None))
    if not tests and not ts_tests:
        checks.append(dict(name='Unit tests', status='SKIPPED', output='No *.test.cjs or *.test.ts files discovered', exit_code=None))
    if build:
        checks.append(run_check(root, 'Next.js build', ['node', str(root / 'node_modules/next/dist/bin/next'), 'build'], timeout))
    return checks


def report(data: dict) -> str:
    lines = ['DSC PROJECT CHECK REPORT', f"Generated: {data['generated']}", f"Project: {data['project']}",
             f"Source files scanned: {data['files_scanned']}", f"Findings: {len(data['findings'])}",
             f"Severity counts: {dict(Counter(f['severity'] for f in data['findings']))}", '',
             'Scope: heuristic source review plus local diagnostics when enabled. Findings require human review.',
             'This is not a complete security audit or proof that the application is safe.',
             'No browser, live database, messaging, or deployment tests are run. Dependency CVEs are not checked.',
             'Environment files, generated assets, dependencies and database files are excluded.',
             'Code is not automatically repaired. Existing unit tests execute project code.', '', 'FINDINGS']
    for i, item in enumerate(data['findings'], 1):
        lines.extend([f"{i}. [{item['severity']}] [{item['category']}] {item['rule']}",
                      f"Position: {item['position']}", f"Issue: {item['issue']}",
                      f"Confidence: {item['confidence']}", f"Details: {item['details']}", ''])
    lines.append('DIAGNOSTICS (compiler/linter output includes original file positions)')
    for check in data['checks']:
        lines.extend([f"{check['name']}: {check['status']} (exit {check.get('exit_code')})", check['output'].strip(), ''])
    lines.extend(['SCAN ERRORS', *data['scan_errors']])
    return '\n'.join(lines) + '\n'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path, help='Text report path; default PROJECT/reports/dsc-report.txt')
    parser.add_argument('--static-only', action='store_true', help='Do not execute project code')
    parser.add_argument('--build', action='store_true', help='Also run Next.js build (may require network/environment configuration)')
    parser.add_argument('--timeout', type=int, default=180, help='Seconds per diagnostic command')
    options = parser.parse_args()
    root = options.project.resolve()
    if not (root / 'package.json').is_file() or options.timeout <= 0:
        parser.error('Project must contain package.json and timeout must be positive')
    findings, count, errors = scan(root)
    checks = diagnostics(root, options.timeout, options.build) if not options.static_only else [dict(name='Local diagnostics', status='SKIPPED', output='--static-only selected', exit_code=None)]
    data = dict(generated=datetime.now(timezone.utc).isoformat(), project=str(root), findings=findings,
                files_scanned=count, scan_errors=errors, checks=checks)
    output = options.output or root / 'reports/dsc-report.txt'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report(data), encoding='utf-8')
    output.with_suffix('.json').write_text(json.dumps(data, indent=2), encoding='utf-8')
    print(f'Report: {output.resolve()} | {len(findings)} review findings | {count} files scanned')
    print('Diagnostics: ' + ', '.join(f"{c['name']}={c['status']}" for c in checks))
    return int(bool(findings or errors or any(c['status'] in {'FAIL', 'ERROR', 'TIMEOUT', 'SKIPPED'} for c in checks)))


if __name__ == '__main__':
    sys.exit(main())
