"""
PlanzyPop - Events Router
Handles Event CRUD operations (Create, Read, Update, Delete).
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(tags=["Events"])


@router.post(
    "/events",
    response_model=schemas.EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event"
)
def create_event(event_data: schemas.EventCreate, db: Session = Depends(get_db)):
    """
    Creates a new event record in the database.
    Validates event name, type, date, guest count, and budget.
    """
    new_event = models.Event(
        event_name=event_data.event_name,
        event_type=event_data.event_type,
        event_date=event_data.event_date,
        location=event_data.location,
        guests=event_data.guests,
        budget=event_data.budget,
        celebration_style=event_data.celebration_style
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get(
    "/events",
    response_model=List[schemas.EventResponse],
    summary="List all events"
)
def get_all_events(db: Session = Depends(get_db)):
    """
    Retrieves all planned events, ordered chronologically by newest ID first.
    """
    events = db.query(models.Event).order_by(models.Event.id.desc()).all()
    return events


@router.get(
    "/events/{event_id}",
    response_model=schemas.EventResponse,
    summary="Get event details by ID"
)
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    """
    Fetches a single event record by its primary key ID.
    Returns HTTP 404 if not found.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found"
        )
    return event


@router.put(
    "/events/{event_id}",
    response_model=schemas.EventResponse,
    summary="Update an existing event"
)
def update_event(
    event_id: int,
    event_update: schemas.EventUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates mutable fields of an existing event.
    Only provided fields in the request body are updated.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found"
        )

    update_data = event_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete(
    "/events/{event_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an event and cascade associated records"
)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    Deletes an event from the database.
    Due to database cascades, related expenses and tasks are also cleaned up.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found"
        )

    db.delete(event)
    db.commit()
    return {
        "message": f"Event '{event.event_name}' (ID: {event_id}) successfully deleted",
        "deleted_id": event_id
    }
