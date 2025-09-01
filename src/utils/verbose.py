"""
Verbose logging utilities
"""
import os
from typing import Any

# Global verbose flag - can be controlled by environment variable or programmatically
_verbose_enabled = os.getenv("VERBOSE", "false").lower() in ("true", "1", "yes", "on")


def set_verbose(enabled: bool) -> None:
    """
    Set the global verbose flag.
    
    Args:
        enabled: Whether to enable verbose output
    """
    global _verbose_enabled
    _verbose_enabled = enabled


def is_verbose() -> bool:
    """
    Check if verbose mode is enabled.
    
    Returns:
        True if verbose mode is enabled
    """
    return _verbose_enabled


def printVerbose(*args: Any, **kwargs: Any) -> None:
    """
    Print only when verbose mode is enabled.
    Works exactly like print() but respects the verbose flag.
    
    Args:
        *args: Arguments to pass to print()
        **kwargs: Keyword arguments to pass to print()
    """
    if _verbose_enabled:
        print(*args, **kwargs)
