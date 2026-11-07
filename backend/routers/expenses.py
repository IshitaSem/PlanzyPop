"""
PlanzyPop - Expenses & Budget Management Router
Handles Expense CRUD, Budget Tracking, Overspending Alerts, and Fair Expense Splitting.
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(tags=["Budget Management", "Expenses"])


# ============================================================================
# Expense CRUD Operations
# ============================================================================

@router.post(
    "/events/{event_id}/expenses",
    response_model=schemas.ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an expense to an event"
)
def add_expense(
    event_id: int,
    expense_data: schemas.ExpenseCreate,
    db: Session = Depends(get_db)
):
    """
    ADD an Expense to an Event:
    - Verifies that the parent event exists (returns 404 if not found).
    - Enforces valid category from EXPENSE_CATEGORIES.
    - Inserts a new row in the 'expenses' table linked to 'event_id'.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot add expense. Event with ID {event_id} not found."
        )

    new_expense = models.Expense(
        event_id=event_id,
        expense_name=expense_data.expense_name,
        category=expense_data.category,
        amount=expense_data.amount,
        expense_date=expense_data.expense_date
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@router.get(
    "/events/{event_id}/expenses",
    response_model=List[schemas.ExpenseResponse],
    summary="List all expenses for an event"
)
def get_event_expenses(event_id: int, db: Session = Depends(get_db)):
    """
    VIEW Expenses for an Event:
    - Retrieves all expenses recorded for the specified event.
    - Returns 404 if the event does not exist.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.event_id == event_id)
        .order_by(models.Expense.id.desc())
        .all()
    )
    return expenses


@router.put(
    "/expenses/{expense_id}",
    response_model=schemas.ExpenseResponse,
    summary="Update an existing expense"
)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db)
):
    """
    UPDATE an Expense:
    - Updates fields of an individual expense.
    - Rejects explicit null values for required fields.
    - Rejects invalid categories and negative amounts.
    - Returns 404 if the expense does not exist.
    """
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found."
        )

    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an expense"
)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """
    DELETE an Expense:
    - Removes an individual expense item.
    - Returns 404 if the expense does not exist.
    """
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found."
        )

    db.delete(expense)
    db.commit()
    return {
        "message": f"Expense '{expense.expense_name}' (ID: {expense_id}) successfully deleted",
        "deleted_id": expense_id
    }


# ============================================================================
# Budget Calculations & Expense Splitting
# ============================================================================

@router.get(
    "/events/{event_id}/budget",
    response_model=schemas.BudgetSummaryResponse,
    summary="Get budget utilization and category breakdown"
)
def get_event_budget_summary(event_id: int, db: Session = Depends(get_db)):
    """
    CALCULATE Budget Summary:
    - Calculates:
        Total Expenses = sum(expense amounts)
        Remaining Budget = Planned Budget - Total Expenses
        Budget Utilisation % = (Total Expenses / Planned Budget) * 100
    - Generates category-wise breakdown (Food, Cake, Decorations, etc.).
    - Detects overspending and generates an alert message.
    - Safely handles zero-budget events to prevent ZeroDivisionError.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    expenses = db.query(models.Expense).filter(models.Expense.event_id == event_id).all()

    total_expenses = round(sum(exp.amount for exp in expenses), 2)
    planned_budget = round(event.budget, 2)
    remaining_budget = round(planned_budget - total_expenses, 2)

    # Safe utilisation calculation (avoid division by zero)
    if planned_budget > 0:
        utilisation_percentage = round((total_expenses / planned_budget) * 100, 2)
    else:
        utilisation_percentage = 0.0 if total_expenses == 0 else 100.0

    # Overspending detection
    is_over_budget = total_expenses > planned_budget
    warning_message = None
    if is_over_budget:
        over_amount = round(total_expenses - planned_budget, 2)
        warning_message = f"Warning: Spending has exceeded your planned budget by Rs {over_amount}!"

    # Category-wise breakdown
    category_breakdown: Dict[str, float] = {}
    for exp in expenses:
        category_breakdown[exp.category] = round(
            category_breakdown.get(exp.category, 0.0) + exp.amount, 2
        )

    return {
        "event_id": event.id,
        "event_name": event.event_name,
        "currency": "INR",
        "planned_budget": planned_budget,
        "total_expenses": total_expenses,
        "remaining_budget": remaining_budget,
        "utilisation_percentage": utilisation_percentage,
        "is_over_budget": is_over_budget,
        "warning_message": warning_message,
        "category_breakdown": category_breakdown
    }


@router.post(
    "/calculate-split",
    response_model=schemas.ExpenseSplitResponse,
    summary="Standalone equal expense splitting calculator"
)
def calculate_expense_split(split_data: schemas.ExpenseSplitRequest):
    """
    EQUAL EXPENSE SHARING CALCULATOR:
    - Calculates each person's contribution: Share = Total / Number of Friends
    - Validates num_people > 0.
    """
    share = round(split_data.total_amount / split_data.num_people, 2)
    return {
        "total_amount": split_data.total_amount,
        "num_people": split_data.num_people,
        "share_per_person": share,
        "currency": "INR",
        "split_basis": "custom_amount",
        "explanation": f"Total Rs {split_data.total_amount} divided equally among {split_data.num_people} friends is Rs {share} per person."
    }


@router.get(
    "/events/{event_id}/split-expense",
    response_model=schemas.ExpenseSplitResponse,
    summary="Split an event's expenses or planned budget among contributing friends"
)
def split_event_expenses(
    event_id: int,
    people: int = Query(default=1, gt=0, description="Number of contributing friends"),
    db: Session = Depends(get_db)
):
    """
    EVENT-SPECIFIC EXPENSE SPLIT:
    - Divides the current total event expenses equally among friends.
    - If at least one expense record exists (if expenses:), divides actual recorded expenses (even if total is 0).
    - If no expense records exist, falls back to dividing the planned budget.
    - Clearly indicates whether split_basis is 'actual_expenses' or 'planned_budget'.
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    expenses = db.query(models.Expense).filter(models.Expense.event_id == event_id).all()
    total_expenses = sum(exp.amount for exp in expenses)

    # Use actual logged expenses if expense records exist; otherwise fallback to planned budget
    if expenses:
        amount_to_split = total_expenses
        split_basis = "actual_expenses"
        explanation = f"Based on actual recorded expenses: Total of Rs {round(amount_to_split, 2)} divided equally among {people} friends is Rs {round(amount_to_split / people, 2)} per person."
    else:
        amount_to_split = event.budget
        split_basis = "planned_budget"
        explanation = f"No expenses recorded yet. Based on planned budget fallback: Total of Rs {round(amount_to_split, 2)} divided equally among {people} friends is Rs {round(amount_to_split / people, 2)} per person."

    share = round(amount_to_split / people, 2)

    return {
        "total_amount": round(amount_to_split, 2),
        "num_people": people,
        "share_per_person": share,
        "currency": "INR",
        "split_basis": split_basis,
        "explanation": explanation
    }
