"""
PlanzyPop - Checklist & Task Timeline Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Task creation with and without due dates (POST /events/{id}/tasks)
2. Chronological timeline ordering with None-due-dates positioned last
3. Task updates (name, description, completion status)
4. Toggle completion status (pending -> completed -> pending)
5. Overdue task detection logic (past due date AND incomplete)
6. Completed overdue tasks excluded from overdue count
7. Task progress metrics (% completed, total, pending, overdue counts)
8. Empty task list handling (0% progress)
9. Input validation (blank names, invalid date formats: 422)
10. 404 Not Found error responses for non-existent events and tasks
11. Cascade deletion of tasks when parent event is deleted
"""

import sys
from datetime import date, timedelta
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def test_event(client: TestClient):
    """Creates a temporary event for checklist tests and cleans up afterwards."""
    payload = {
        "event_name": "Farewell Party Checklist Hub",
        "event_type": "Farewell",
        "event_date": (date.today() + timedelta(days=10)).isoformat(),
        "location": "College Seminar Hall",
        "guests": 30,
        "budget": 5000.0,
        "celebration_style": "Formal & Fun"
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 201
    event_data = res.json()
    yield event_data
    client.delete(f"/events/{event_data['id']}")


def test_empty_task_list_summary(client: TestClient, test_event):
    """Verify that an event with no tasks returns 0% progress and 0 counts."""
    event_id = test_event["id"]
    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_tasks"] == 0
    assert summary["completed_tasks"] == 0
    assert summary["pending_tasks"] == 0
    assert summary["overdue_tasks"] == 0
    assert summary["progress_percentage"] == 0.0


def test_create_and_timeline_sorting(client: TestClient, test_event):
    """Verify task creation with different dates and chronological timeline ordering."""
    event_id = test_event["id"]
    past_date = (date.today() - timedelta(days=2)).isoformat()
    future_date_1 = (date.today() + timedelta(days=3)).isoformat()
    future_date_2 = (date.today() + timedelta(days=5)).isoformat()

    # Create 4 tasks
    t_past = client.post(f"/events/{event_id}/tasks", json={"task_name": "Book Venue", "due_date": past_date}).json()
    t_fut1 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Order Gifts", "due_date": future_date_1}).json()
    t_nodate = client.post(f"/events/{event_id}/tasks", json={"task_name": "Music Playlist"}).json()
    t_fut2 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Confirm Catering", "due_date": future_date_2}).json()

    res = client.get(f"/events/{event_id}/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) == 4

    # Order must be: past_date -> future_date_1 -> future_date_2 -> None
    assert tasks[0]["id"] == t_past["id"]
    assert tasks[1]["id"] == t_fut1["id"]
    assert tasks[2]["id"] == t_fut2["id"]
    assert tasks[3]["id"] == t_nodate["id"]
    assert tasks[3]["due_date"] is None


def test_update_task_details(client: TestClient, test_event):
    """Verify modifying task name and description via PUT /tasks/{id}."""
    event_id = test_event["id"]
    t = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Initial Name",
        "description": "Initial Desc"
    }).json()

    res_up = client.put(f"/tasks/{t['id']}", json={
        "task_name": "Updated Name",
        "description": "Updated Description"
    })
    assert res_up.status_code == 200
    updated = res_up.json()
    assert updated["task_name"] == "Updated Name"
    assert updated["description"] == "Updated Description"


def test_task_status_toggle_and_overdue_logic(client: TestClient, test_event):
    """Verify overdue detection, completion toggle, and progress recalculation."""
    event_id = test_event["id"]
    past_date = (date.today() - timedelta(days=2)).isoformat()
    future_date = (date.today() + timedelta(days=4)).isoformat()

    # Overdue task (past date, incomplete)
    t_overdue = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Overdue Task",
        "due_date": past_date,
        "is_completed": False
    }).json()

    # Regular future task
    t_future = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Future Task",
        "due_date": future_date,
        "is_completed": False
    }).json()

    # Initial summary: 2 total, 0 completed, 2 pending, 1 overdue, 0% progress
    s1 = client.get(f"/events/{event_id}/tasks/summary").json()
    assert s1["total_tasks"] == 2
    assert s1["completed_tasks"] == 0
    assert s1["pending_tasks"] == 2
    assert s1["overdue_tasks"] == 1
    assert s1["progress_percentage"] == 0.0

    # Mark the overdue task as completed
    client.put(f"/tasks/{t_overdue['id']}", json={"is_completed": True})
    s2 = client.get(f"/events/{event_id}/tasks/summary").json()
    assert s2["completed_tasks"] == 1
    assert s2["overdue_tasks"] == 0  # Completed overdue task is NOT counted as overdue
    assert s2["progress_percentage"] == 50.0

    # Toggle it back to pending
    client.put(f"/tasks/{t_overdue['id']}", json={"is_completed": False})
    s3 = client.get(f"/events/{event_id}/tasks/summary").json()
    assert s3["completed_tasks"] == 0
    assert s3["overdue_tasks"] == 1
    assert s3["progress_percentage"] == 0.0


def test_delete_task_and_summary_update(client: TestClient, test_event):
    """Verify deleting a task and dynamic progress recalculation."""
    event_id = test_event["id"]
    t1 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Task 1", "is_completed": True}).json()
    t2 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Task 2", "is_completed": False}).json()
    t3 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Task 3", "is_completed": False}).json()

    # Delete task 3
    assert client.delete(f"/tasks/{t3['id']}").status_code == 200

    # Now 2 tasks remaining, 1 completed = 50.0% progress
    summary = client.get(f"/events/{event_id}/tasks/summary").json()
    assert summary["total_tasks"] == 2
    assert summary["completed_tasks"] == 1
    assert summary["progress_percentage"] == 50.0


def test_task_validation_errors(client: TestClient, test_event):
    """Verify HTTP 422 for blank names, null names, and invalid date formats."""
    event_id = test_event["id"]
    t = client.post(f"/events/{event_id}/tasks", json={"task_name": "Valid Name"}).json()

    # Blank task name
    assert client.post(f"/events/{event_id}/tasks", json={"task_name": "   "}).status_code == 422
    assert client.put(f"/tasks/{t['id']}", json={"task_name": "   "}).status_code == 422

    # Null task name
    assert client.put(f"/tasks/{t['id']}", json={"task_name": None}).status_code == 422

    # Invalid calendar date
    assert client.post(f"/events/{event_id}/tasks", json={"task_name": "Bad Date", "due_date": "2026-13-45"}).status_code == 422

    # Non-ISO date
    assert client.post(f"/events/{event_id}/tasks", json={"task_name": "Bad Date", "due_date": "2026/11/20"}).status_code == 422

    # Relative text date
    assert client.put(f"/tasks/{t['id']}", json={"due_date": "tomorrow"}).status_code == 422


def test_task_not_found_and_cascade_deletion(client: TestClient):
    """Verify 404s for ghost IDs and cascade deletion of tasks upon event deletion."""
    ghost_id = 888888
    assert client.post(f"/events/{ghost_id}/tasks", json={"task_name": "Ghost"}).status_code == 404
    assert client.get(f"/events/{ghost_id}/tasks").status_code == 404
    assert client.get(f"/events/{ghost_id}/tasks/summary").status_code == 404
    assert client.put(f"/tasks/{ghost_id}", json={"task_name": "Ghost"}).status_code == 404
    assert client.delete(f"/tasks/{ghost_id}").status_code == 404

    # Create event and task to test cascade
    res_ev = client.post("/events", json={
        "event_name": "Cascade Task Event",
        "event_type": "Farewell",
        "event_date": "2026-12-01",
        "budget": 1000.0
    })
    ev_id = res_ev.json()["id"]
    res_t = client.post(f"/events/{ev_id}/tasks", json={"task_name": "Orphaned Task"})
    t_id = res_t.json()["id"]

    # Delete event
    client.delete(f"/events/{ev_id}")

    # Task should be gone
    assert client.put(f"/tasks/{t_id}", json={"is_completed": True}).status_code == 404


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
