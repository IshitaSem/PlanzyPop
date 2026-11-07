"""
PlanzyPop – Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Stage 2, 4 & 5: Database Models (Event, Expense, and Task)
This module defines the SQLAlchemy ORM models and their relational mapping.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Event(Base):
    """
    SQLAlchemy ORM Model representing an Event in PlanzyPop.

    Viva Explanation:
    - An ORM (Object-Relational Mapping) model translates a Python class into a SQL relational table.
    - Class attributes (id, event_name, etc.) map directly to table columns.
    - One Event has many Expenses (1:N) and many Tasks (1:N).
    """
    __tablename__ = "events"

    # Primary key uniquely identifies each event
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Event details
    event_name = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)         # e.g., Birthday, Fresher, Farewell, Hostel Party
    event_date = Column(String(50), nullable=False)         # e.g., "2026-11-20" or "20 Nov, 6:00 PM"
    location = Column(String(200), nullable=True)           # e.g., "Hostel Common Room, Campus Hall"
    guests = Column(Integer, default=0, nullable=False)     # Number of expected attendees
    budget = Column(Float, default=0.0, nullable=False)     # Planned budget amount in INR (Rs)
    celebration_style = Column(String(100), nullable=True)  # e.g., DIY, Casual, Aesthetic, Party

    # Audit timestamp recorded when event is created
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to Expenses: One Event -> Many Expenses
    # cascade="all, delete-orphan" ensures deleting an event automatically deletes its expenses
    expenses = relationship(
        "Expense",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="Expense.id.desc()"
    )

    # Relationship to Tasks: One Event -> Many Tasks
    # cascade="all, delete-orphan" ensures deleting an event automatically deletes its checklist tasks
    tasks = relationship(
        "Task",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="Task.id.desc()"
    )

    def __repr__(self):
        return f"<Event(id={self.id}, name='{self.event_name}', budget={self.budget})>"


class Expense(Base):
    """
    SQLAlchemy ORM Model representing an Expense for an Event.

    Viva Explanation:
    - Represents individual purchases (e.g., Cake, Balloons, Snacks).
    - 'event_id' is a Foreign Key referencing 'events.id'.
    - Enforces referential integrity between events and their expenses.
    """
    __tablename__ = "expenses"

    # Primary key uniquely identifies each expense item
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key linking this expense to its parent event
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)

    # Expense details
    expense_name = Column(String(100), nullable=False)      # e.g., "Chocolate Birthday Cake"
    category = Column(String(50), nullable=False, default="Other")  # Food, Decorations, Cake, Venue, Gifts, Travel, Entertainment, Other
    amount = Column(Float, nullable=False, default=0.0)      # Spent amount in INR (Rs)
    expense_date = Column(String(50), nullable=True)        # Date when expense was incurred

    # Audit timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship back to Event
    event = relationship("Event", back_populates="expenses")

    def __repr__(self):
        return f"<Expense(id={self.id}, event_id={self.event_id}, name='{self.expense_name}', amount={self.amount})>"


class Task(Base):
    """
    SQLAlchemy ORM Model representing an Event Preparation Task (Checklist & Timeline).

    Viva Explanation:
    - Represents action items before and during the event (e.g. Order Cake, Prepare Playlist).
    - 'event_id' is a Foreign Key referencing 'events.id'.
    - 'due_date' (YYYY-MM-DD) enables chronological timeline ordering.
    - 'is_completed' tracks progress for dashboard completion metrics.
    """
    __tablename__ = "tasks"

    # Primary key uniquely identifies each task item
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key linking this task to its parent event
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)

    # Task details
    task_name = Column(String(150), nullable=False)         # e.g., "Order 1kg Chocolate Cake"
    description = Column(String(500), nullable=True)        # Optional notes, e.g., "Eggless with Happy Birthday tag"
    due_date = Column(String(20), nullable=True)            # ISO format: YYYY-MM-DD
    is_completed = Column(Boolean, default=False, nullable=False)

    # Audit timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship back to Event
    event = relationship("Event", back_populates="tasks")

    def __repr__(self):
        return f"<Task(id={self.id}, event_id={self.event_id}, name='{self.task_name}', completed={self.is_completed})>"
