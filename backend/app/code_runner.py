"""Utility helpers to execute user-submitted code in a sandboxed fashion."""

from __future__ import annotations

import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional, cast


class ExecutionError(Exception):
    """Raised when execution cannot be performed for the requested language."""


LanguageConfig = Dict[str, object]


LANGUAGE_CONFIGS: Dict[str, LanguageConfig] = {
    "python": {
        "source_ext": ".py",
        "run": ["python3", "{source}"],
        "timeout": 8,
    },
    "c": {
        "source_ext": ".c",
        "compile": ["gcc", "{source}", "-o", "{binary}"],
        "run": ["{binary}"],
        "timeout": 10,
    },
}


def _format_command(command: List[str], *, source: Path, binary: Path) -> List[str]:
    return [part.format(source=str(source), binary=str(binary)) for part in command]


def run_code(language: str, code: str, stdin: Optional[str] = None) -> Dict[str, object]:
    """Execute a snippet of code and return stdout/stderr/exit information."""

    config = LANGUAGE_CONFIGS.get(language.lower())
    if not config:
        raise ExecutionError(f"Unsupported language: {language}")

    timeout = int(config.get("timeout", 8))

    with tempfile.TemporaryDirectory() as tmp_dir:
        workdir = Path(tmp_dir)
        source_path = workdir / f"Main{config['source_ext']}"
        source_path.write_text(code)
        binary_path = workdir / "app.out"

        compile_cmd = cast(Optional[List[str]], config.get("compile"))
        if compile_cmd:
            try:
                compiled = subprocess.run(
                    _format_command(compile_cmd, source=source_path, binary=binary_path),
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=workdir,
                )
            except FileNotFoundError as exc:
                missing = exc.filename or compile_cmd[0]
                return {
                    "stdout": "",
                    "stderr": f"Command not found: {missing}",
                    "exit_code": 127,
                    "execution_time": 0.0,
                }
            if compiled.returncode != 0:
                return {
                    "stdout": compiled.stdout,
                    "stderr": compiled.stderr,
                    "exit_code": compiled.returncode,
                    "execution_time": 0.0,
                }
        run_cmd = _format_command(cast(List[str], config["run"]), source=source_path, binary=binary_path)
        start = time.perf_counter()
        try:
            executed = subprocess.run(
                run_cmd,
                capture_output=True,
                text=True,
                input=stdin,
                timeout=timeout,
                cwd=workdir,
            )
            duration = time.perf_counter() - start
            return {
                "stdout": executed.stdout,
                "stderr": executed.stderr,
                "exit_code": executed.returncode,
                "execution_time": duration,
            }
        except FileNotFoundError as exc:
            duration = time.perf_counter() - start
            missing = exc.filename or run_cmd[0]
            return {
                "stdout": "",
                "stderr": f"Command not found: {missing}",
                "exit_code": 127,
                "execution_time": duration,
            }
        except subprocess.TimeoutExpired as exc:
            duration = time.perf_counter() - start
            return {
                "stdout": exc.stdout or "",
                "stderr": (exc.stderr or "") + "\nExecution timed out.",
                "exit_code": -1,
                "execution_time": duration,
            }

