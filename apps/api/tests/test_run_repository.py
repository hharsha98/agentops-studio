from app.replay_store import SEED_RUNS, create_replay_run, get_run, summarize_run
from app.repository import RunRepository
from app.schemas import ReplayRunRequest


def test_repository_persists_created_run_across_reload(tmp_path) -> None:
    database_url = f"sqlite:///{tmp_path / 'runs.db'}"
    repository = RunRepository(database_url)
    created = create_replay_run(
        ReplayRunRequest(
            workflow_id="executive-daily-brief",
            goal="Persist this replay across repository reloads",
        ),
        repository=repository,
    )

    reloaded_repository = RunRepository(database_url)
    reloaded = get_run(created.id, repository=reloaded_repository)

    assert reloaded is not None
    assert reloaded.id == created.id
    assert reloaded.goal == "Persist this replay across repository reloads"


def test_repository_lists_new_runs_before_seed_runs(tmp_path) -> None:
    repository = RunRepository(f"sqlite:///{tmp_path / 'runs.db'}", seed_runs=SEED_RUNS)
    created = create_replay_run(
        ReplayRunRequest(
            workflow_id="support-triage",
            goal="Persist support triage replay state",
        ),
        repository=repository,
    )

    summaries = [summarize_run(run) for run in repository.list_runs()]

    assert summaries[0].id == created.id
    assert summaries[0].workflow_id == "support-triage"
    assert any(summary.id == "run-executive-brief" for summary in summaries)
