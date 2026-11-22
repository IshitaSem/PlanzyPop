"""
PlanzyPop - Checklist & Timeline Router
Handles Task CRUD, Chronological Timeline Ordering, and Preparation Progress Summaries.
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth_utils import get_current_user_optional, verify_event_owner as _verify_event_owner

router = APIRouter(tags=["Checklist & Timeline"])



@router.post(
    "/events/{event_id}/tasks",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task for an event"
)
def create_task(
    event_id: int,
    task_data: schemas.TaskCreate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    CREATE Task:
    - Creates a new preparation task for an event.
    - Returns HTTP 201 Created on success.
    - Returns HTTP 404 if event does not exist.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot add task. Event with ID {event_id} not found."
        )
    _verify_event_owner(event, current_user)

    new_task = models.Task(
        event_id=event_id,
        task_name=task_data.task_name,
        description=task_data.description,
        due_date=task_data.due_date,
        is_completed=task_data.is_completed
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.get(
    "/events/{event_id}/tasks",
    response_model=List[schemas.TaskResponse],
    summary="Get chronologically sorted tasks for an event"
)
def get_event_tasks(
    event_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    GET Event Tasks (Timeline ordering):
    - Returns all tasks for the specified event.
    - Sorts chronologically by due_date ascending (tasks with due dates first),
      with tasks lacking a due date placed at the end.
    - Returns HTTP 404 if event does not exist.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )
    _verify_event_owner(event, current_user)

    tasks = db.query(models.Task).filter(models.Task.event_id == event_id).all()
    # Sort: tasks with a due_date come first chronologically; tasks without a due_date come last
    tasks.sort(key=lambda t: (1 if t.due_date is None else 0, t.due_date or "", t.id))
    return tasks


@router.put(
    "/tasks/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Update a task or toggle completion status"
)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    UPDATE Task:
    - Allows updating task_name, description, due_date, and is_completed.
    - Rejects explicit null for required fields (task_name, is_completed).
    - Returns HTTP 404 if task does not exist.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    event = db.query(models.Event).filter(models.Event.id == task.event_id).first()
    if event:
        _verify_event_owner(event, current_user)

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task"
)
def delete_task(
    task_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    DELETE Task:
    - Removes an individual task.
    - Returns HTTP 404 if task does not exist.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    event = db.query(models.Event).filter(models.Event.id == task.event_id).first()
    if event:
        _verify_event_owner(event, current_user)

    db.delete(task)
    db.commit()
    return {
        "message": f"Task '{task.task_name}' (ID: {task_id}) successfully deleted",
        "deleted_id": task_id
    }


@router.get(
    "/events/{event_id}/tasks/summary",
    response_model=schemas.TaskSummaryResponse,
    summary="Get task completion counts, overdue tasks, and progress percentage"
)
def get_task_summary(
    event_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    TASK SUMMARY & PROGRESS:
    - Calculates:
        Total Tasks
        Completed Tasks
        Pending Tasks = Total - Completed
        Overdue Tasks = due_date < today AND is_completed is False
        Progress % = (Completed Tasks / Total Tasks) * 100 (0% if total is 0)
    - Returns HTTP 404 if event does not exist.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )
    _verify_event_owner(event, current_user)

    tasks = db.query(models.Task).filter(models.Task.event_id == event_id).all()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    pending_tasks = total_tasks - completed_tasks

    today_str = date.today().isoformat()
    # Overdue means: due date is earlier than today AND task is not completed
    overdue_tasks = sum(
        1 for t in tasks
        if not t.is_completed and t.due_date and t.due_date < today_str
    )

    progress_percentage = (
        round((completed_tasks / total_tasks) * 100, 2) if total_tasks > 0 else 0.0
    )

    return {
        "event_id": event.id,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
        "progress_percentage": progress_percentage
    }
