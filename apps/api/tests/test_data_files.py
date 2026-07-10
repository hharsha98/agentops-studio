from importlib import import_module


def test_demo_data_path_uses_explicit_runtime_directory(tmp_path, monkeypatch) -> None:
    data_files = import_module("app.data_files")
    monkeypatch.setattr(data_files.settings, "demo_data_dir", str(tmp_path))

    resolved = data_files.demo_data_path("replay-runs.json")

    assert resolved == tmp_path / "replay-runs.json"
