from pathlib import Path

from .config import settings


def demo_data_path(filename: str) -> Path:
    if settings.demo_data_dir:
        return Path(settings.demo_data_dir) / filename

    module_path = Path(__file__).resolve()
    for parent in module_path.parents:
        candidate = parent / "demo-data" / filename
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f"Could not find demo-data/{filename}. Set DEMO_DATA_DIR to the mounted data directory."
    )
