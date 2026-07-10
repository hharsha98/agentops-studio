from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from .schemas import AgentRun, WorkerJob


class Base(DeclarativeBase):
    pass


class RunRecord(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    sort_index: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)


class WorkerJobRecord(Base):
    __tablename__ = "worker_jobs"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(160), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)


class RunRepository:
    def __init__(self, database_url: str, seed_runs: list[AgentRun] | None = None) -> None:
        connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
        self.engine = create_engine(database_url, connect_args=connect_args)
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)
        Base.metadata.create_all(self.engine)
        if seed_runs is not None:
            self.seed(seed_runs)

    def seed(self, runs: list[AgentRun]) -> None:
        with self.session_factory() as session:
            existing = session.scalar(select(RunRecord.id).limit(1))
            if existing is not None:
                return

            now = datetime.now(UTC)
            for index, run in enumerate(runs):
                session.add(
                    RunRecord(
                        id=run.id,
                        workflow_id=run.workflow_id,
                        status=run.status,
                        sort_index=index,
                        created_at=now,
                        updated_at=now,
                        payload=run.model_dump(mode="json"),
                    )
                )
            session.commit()

    def list_runs(self) -> list[AgentRun]:
        with self.session_factory() as session:
            records = session.scalars(
                select(RunRecord).order_by(RunRecord.sort_index.asc(), RunRecord.updated_at.desc())
            ).all()
            return [AgentRun.model_validate(record.payload) for record in records]

    def get_run(self, run_id: str) -> AgentRun | None:
        with self.session_factory() as session:
            record = session.get(RunRecord, run_id)
            if record is None:
                return None
            return AgentRun.model_validate(record.payload)

    def is_ready(self) -> bool:
        with self.engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True

    def save_run(self, run: AgentRun, *, newest: bool = False) -> AgentRun:
        with self.session_factory() as session:
            record = session.get(RunRecord, run.id)
            now = datetime.now(UTC)

            if record is None:
                record = RunRecord(
                    id=run.id,
                    workflow_id=run.workflow_id,
                    status=run.status,
                    sort_index=self._newest_sort_index(session) if newest else self._next_sort_index(session),
                    created_at=now,
                    updated_at=now,
                    payload=run.model_dump(mode="json"),
                )
                session.add(record)
            else:
                record.workflow_id = run.workflow_id
                record.status = run.status
                record.updated_at = now
                record.payload = run.model_dump(mode="json")

            session.commit()
            return run

    def get_worker_job(self, job_id: str) -> WorkerJob | None:
        with self.session_factory() as session:
            record = session.get(WorkerJobRecord, job_id)
            if record is None:
                return None
            return WorkerJob.model_validate(record.payload)

    def save_worker_job(self, job: WorkerJob) -> WorkerJob:
        with self.session_factory() as session:
            record = session.get(WorkerJobRecord, job.id)
            now = datetime.now(UTC)

            if record is None:
                record = WorkerJobRecord(
                    id=job.id,
                    run_id=job.run_id,
                    status=job.status,
                    created_at=now,
                    updated_at=now,
                    payload=job.model_dump(mode="json"),
                )
                session.add(record)
            else:
                record.run_id = job.run_id
                record.status = job.status
                record.updated_at = now
                record.payload = job.model_dump(mode="json")

            session.commit()
            return job

    @staticmethod
    def _next_sort_index(session: Session) -> int:
        records = session.scalars(select(RunRecord.sort_index)).all()
        if not records:
            return 0
        return max(records) + 1

    @staticmethod
    def _newest_sort_index(session: Session) -> int:
        records = session.scalars(select(RunRecord.sort_index)).all()
        if not records:
            return 0
        return min(records) - 1
