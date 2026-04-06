"""Business process models — franchise applications and reports."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import (
    BigInteger, Date, DateTime, Integer,
    Numeric, String, Text,
)

from ..extensions import db
from .core import TimestampMixin


class FranchiseApplication(TimestampMixin, db.Model):
    __tablename__ = "franchise_applications"
    application_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    branch_owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    proposed_location: Mapped[str] = mapped_column(String(255), nullable=False)
    business_experience: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    investment_capacity: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    status_id: Mapped[int] = mapped_column(
        ForeignKey("application_statuses.status_id"), nullable=False
    )
    decision_by_franchisor_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("franchisors.franchisor_id")
    )
    decision_notes: Mapped[str | None] = mapped_column(Text)
    document_blob_id: Mapped[int | None] = mapped_column(
        ForeignKey("file_blobs.blob_id", ondelete="SET NULL"), nullable=True
    )

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="franchise_applications"
    )
    branch_owner_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[branch_owner_user_id],
        back_populates="franchise_applications",
    )
    status: Mapped["ApplicationStatus"] = relationship(
        "ApplicationStatus", back_populates="franchise_applications"
    )
    decision_by_franchisor: Mapped[Optional["Franchisor"]] = relationship(
        "Franchisor", back_populates="franchise_applications_decided"
    )
    document_blob: Mapped[Optional["FileBlob"]] = relationship(
        "FileBlob", foreign_keys=[document_blob_id]
    )


class Report(db.Model):
    __tablename__ = "reports"
    report_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    generated_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=True
    )
    franchisor_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("franchisors.franchisor_id"), nullable=False
    )
    branch_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("branches.branch_id")
    )
    report_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'MASTER', 'BRANCH'
    period_start: Mapped[Date] = mapped_column(Date, nullable=False)
    period_end: Mapped[Date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    generated_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="reports", foreign_keys=[generated_by_user_id]
    )
    franchisor: Mapped[Optional["Franchisor"]] = relationship(
        "Franchisor", back_populates="reports"
    )
    branch: Mapped[Optional["Branch"]] = relationship(
        "Branch", back_populates="reports"
    )
    data_entries: Mapped[list["ReportData"]] = relationship(
        "ReportData", back_populates="report", cascade="all, delete-orphan"
    )


class ReportData(db.Model):
    __tablename__ = "report_data"
    report_data_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    report_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("reports.report_id"), nullable=False
    )
    data_key: Mapped[str] = mapped_column(String(100), nullable=False)
    data_value: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    report: Mapped["Report"] = relationship("Report", back_populates="data_entries")
