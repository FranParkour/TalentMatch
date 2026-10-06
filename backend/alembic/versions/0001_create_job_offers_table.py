"""create job offers table

Revision ID: 0001_job_offers
Revises: 
Create Date: 2026-08-26 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_job_offers'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'job_offers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True, server_default=''),
        sa.Column('employment_type', sa.String(length=100), nullable=True, server_default='Full-time'),
        sa.Column('experience_required', sa.String(length=100), nullable=True, server_default=''),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('required_skills', sa.JSON(), nullable=False),
        sa.Column('preferred_skills', sa.JSON(), nullable=False),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_offers_id'), 'job_offers', ['id'], unique=False)
    op.create_index(op.f('ix_job_offers_title'), 'job_offers', ['title'], unique=False)
    op.create_index(op.f('ix_job_offers_status'), 'job_offers', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_job_offers_status'), table_name='job_offers')
    op.drop_index(op.f('ix_job_offers_title'), table_name='job_offers')
    op.drop_index(op.f('ix_job_offers_id'), table_name='job_offers')
    op.drop_table('job_offers')
