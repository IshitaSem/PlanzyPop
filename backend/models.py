"""
PlanzyPop – Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Database Models (User, UserToken, Event, Expense, Task, SavedSpot)
This module defines the SQLAlchemy ORM models and their relational mapping.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """
    SQLAlchemy ORM Model representing a registered User in PlanzyPop.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tokens = relationship("UserToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"


class UserToken(Base):
    """
    SQLAlchemy ORM Model representing an active authentication session token.
    """
    __tablename__ = "user_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="tokens")

    def __repr__(self):
        return f"<UserToken(id={self.id}, user_id={self.user_id})>"


class Event(Base):
    """
    SQLAlchemy ORM Model representing an Event in PlanzyPop.
    One Event has many Expenses (1:N) and many Tasks (1:N).
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(100), nullable=True, index=True)

    event_name = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_date = Column(String(50), nullable=False)
    location = Column(String(200), nullable=True)
    guests = Column(Integer, default=0, nullable=False)
    budget = Column(Float, default=0.0, nullable=False)
    celebration_style = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # cascade="all, delete-orphan" ensures deleting an event automatically deletes its expenses
    expenses = relationship(
        "Expense",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="Expense.id.desc()"
    )

    # cascade="all, delete-orphan" ensures deleting an event automatically deletes its checklist tasks
    tasks = relationship(
        "Task",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="Task.id.desc()"
    )

    def __repr__(self):
        return f"<Event(id={self.id}, name='{self.event_name}', budget={self.budget}, user_id='{self.user_id}')>"


class Expense(Base):
    """
    SQLAlchemy ORM Model representing an Expense for an Event.
    'event_id' is a Foreign Key referencing 'events.id'.
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)

    expense_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, default="Other")
    amount = Column(Float, nullable=False, default=0.0)
    expense_date = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="expenses")

    def __repr__(self):
        return f"<Expense(id={self.id}, event_id={self.event_id}, name='{self.expense_name}', amount={self.amount})>"


class Task(Base):
    """
    SQLAlchemy ORM Model representing an Event Preparation Task (Checklist & Timeline).
    'event_id' is a Foreign Key referencing 'events.id'.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)

    task_name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    due_date = Column(String(20), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="tasks")

    def __repr__(self):
        return f"<Task(id={self.id}, event_id={self.event_id}, name='{self.task_name}', completed={self.is_completed})>"


class SavedSpot(Base):
    """
    SQLAlchemy ORM Model representing a user's Saved / Bookmarked Spot in PopSpots.
    Supports persistent favourites and guest mode without forcing authentication.
    """
    __tablename__ = "saved_spots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), nullable=True, default="guest", index=True)
    spot_id = Column(String(100), nullable=False, index=True)
    osm_type = Column(String(20), nullable=True)
    osm_id = Column(String(50), nullable=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(250), nullable=True)
    opening_hours = Column(String(100), nullable=True)
    price_info = Column(String(50), nullable=True)
    vibe = Column(String(50), nullable=True)
    tags_json = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SavedSpot(id={self.id}, spot_id='{self.spot_id}', name='{self.name}', user_id='{self.user_id}')>"
