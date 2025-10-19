#!/usr/bin/env python3
import argparse
import re
from pathlib import Path
from collections import defaultdict

# --- Basic function definition regexes per language/extension ---
DEF_PATTERNS = {
    # Python: def foo(...):
    ".py": [
        re.compile(r'^\s*def\s+([A-Za-z_]\w*)\s*\('),
    ],
    # JavaScript/TypeScript:
    # - function foo(...) { ... }
    # - const foo = (...) => { ... }
    # - function foo() { ... }
    ".js": [
        re.compile(r'^\s*function\s+([A-Za-z_]\w*)\s*\('),
        re.compile(r'^\s*(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*\([^)]*\)\s*=>'),
        re.compile(r'^\s*(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*function\s*\('),
    ],
    ".ts": [
        re.compile(r'^\s*function\s+([A-Za-z_]\w*)\s*\('),
        re.compile(r'^\s*(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*\([^)]*\)\s*=>'),
    ],
    # C / C++ (very rough): return_type foo(...) {  (single-line signature)
    ".c":  [
        re.compile(r'^\s*[A-Za-z_][\w\s\*\(\)]*\s+([A-Za-z_]\w*)\s*\([^;{]*\)\s*\{')
    ],
    ".h":  [
        # declarations without body: return_type foo(...);
        re.compile(r'^\s*[A-Za-z_][\w\s\*\(\)]*\s+([A-Za-z_]\w*)\s*\([^;{]*\)\s*;')
    ],
    ".cpp": [
        re.compile(r'^\s*[A-Za-z_][\w\s\*\(\):<>]*\s+([A-Za-z_]\w*)\s*\([^;{]*\)\s*(?:const\s*)?\{')
    ],
    ".hpp": [
        re.compile(r'^\s*[A-Za-z_][\w\s\*\(\):<>]*\s+([A-Za-z_]\w*)\s*\([^;{]*\)\s*(?:const\s*)?;')
    ],
}

# Quick-and-dirty comment strippers (best-effort, not a parser)
def strip_comments(ext: str, text: str) -> str:
    if ext == ".py":
        # remove '#' comments (naive; doesn't handle hashes inside strings)
        return re.sub(r'#.*$', '', text, flags=re.MULTILINE)
    # JS/TS/C/C++: remove // and /* ... */
    text = re.sub(r'//.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    return text

def find_files(root: Path, exts):
    for p in root.rglob("*"):
        if p.is_file() and p.suffix in exts:
            yield p

def collect_definitions(files, include_private=False):
    defs_by_name = defaultdict(list)  # name -> list of (path,line_no,line_text)
    for path in files:
        ext = path.suffix
        patterns = DEF_PATTERNS.get(ext, [])
        if not patterns:
            continue
        try:
            lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            continue
        for i, line in enumerate(lines, start=1):
            for pat in patterns:
                m = pat.search(line)
                if m:
                    name = m.group(1)
                    if not include_private and name.startswith("_") and ext == ".py":
                        continue
                    defs_by_name[name].append((path, i, line.strip()))
                    break
    return defs_by_name

def count_usages(root: Path, exts, function_names, defs_by_name):
    # Usage search: look for word boundary + name + '('
    # Avoid counting the definition line itself.
    usage_counts = {name: 0 for name in function_names}
    for path in find_files(root, exts):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        ext = path.suffix
        text_nc = strip_comments(ext, text)

        # Build a quick skip set of definition line numbers for names in this file
        def_lines_by_name = defaultdict(set)
        for name, locs in defs_by_name.items():
            for p, line_no, _ in locs:
                if p == path:
                    def_lines_by_name[name].add(line_no)

        # Scan line by line to skip def lines
        lines = text_nc.splitlines()
        for i, line in enumerate(lines, start=1):
            for name in function_names:
                # quick reject: if name not present, skip
                if name not in line:
                    continue
                # skip definition line itself
                if i in def_lines_by_name.get(name, set()):
                    continue
                # basic call/use pattern: name(
                if re.search(rf'\b{name}\s*\(', line):
                    usage_counts[name] += 1
    return usage_counts

def main():
    ap = argparse.ArgumentParser(description="Simple dead code finder (definitions vs. usages).")
    ap.add_argument("path", type=str, help="Root directory to scan")
    ap.add_argument("--exts", type=str,
                    default=".py,.js,.ts,.c,.h,.cpp,.hpp",
                    help="Comma-separated list of file extensions to include")
    ap.add_argument("--include-private", action="store_true",
                    help="Include private-style names (e.g., _helper in Python)")
    ap.add_argument("--show-used", action="store_true",
                    help="Also list used functions with counts")
    args = ap.parse_args()

    root = Path(args.path).resolve()
    exts = {e if e.startswith(".") else f".{e}" for e in args.exts.split(",")}

    # Gather files first so we don't walk twice
    files = list(find_files(root, exts))

    defs_by_name = collect_definitions(files, include_private=args.include_private)
    if not defs_by_name:
        print("No function definitions found with the given extensions/patterns.")
        return

    usage_counts = count_usages(root, exts, defs_by_name.keys(), defs_by_name)

    unused = []
    used = []
    for name, locs in defs_by_name.items():
        total = usage_counts.get(name, 0)
        if total == 0:
            for p, line_no, line in locs:
                unused.append((name, p, line_no, line))
        else:
            for p, line_no, line in locs:
                used.append((name, p, line_no, line, total))

    print("\n=== Possibly Unused Functions (no references found) ===")
    if not unused:
        print("None 🎉")
    else:
        for name, p, ln, line in sorted(unused, key=lambda x: (str(x[1]), x[2], x[0])):
            print(f"- {name}  @ {p}:{ln}   [{line}]")

    if args.show_used:
        print("\n=== Used Functions (reference count) ===")
        for name, p, ln, line, count in sorted(used, key=lambda x: (-x[4], str(x[1]), x[2], x[0])):
            print(f"- {name}  @ {p}:{ln}   refs={count}")

if __name__ == "__main__":
    main()
