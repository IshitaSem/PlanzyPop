"""
PlanzyPop – Stage 5 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Task creation (POST /events/{id}/tasks)
2. Task retrieval & timeline ordering (GET /events/{id}/tasks)
3. Updating task name and description
4. Marking task completed and marking it pending again
5. Deleting individual tasks
6. Task summary calculations (total, completed, pending, overdue)
7. Progress percentage calculation
8. Overdue calculation (due_date < today AND is_completed is False)
9. Completed overdue tasks NOT counted as overdue
10. Tasks without due dates handled properly and sorted at the end
11. Empty task list returns 0% progress
12. Validation rejection: blank task names & invalid date formats (422)
13. 404 error responses for non-existent events and tasks
14. Cascade deletion: deleting an event deletes its associated tasks
"""

import sys
import os
from datetime import date, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.testclient import TestClient
from main import app

def run_stage5_tests():
    print("=" * 65)
    print("PlanzyPop Stage 5: Checklist & Timeline Test Suite")
    print("=" * 65)

    client = TestClient(app)

    event_payload = {
        "event_name": "Farewell Party 2026",
        "event_type": "Farewell",
        "event_date": (date.today() + timedelta(days=10)).isoformat(),
        "location": "College Seminar Hall",
        "guests": 30,
        "budget": 5000.0,
        "celebration_style": "Formal & Fun"
    }
    res_event = client.post("/events", json=event_payload)
    assert res_event.status_code == 201
    event_id = res_event.json()["id"]
    print(f"[PASS] Created test event (ID: {event_id})")

    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_tasks"] == 0
    assert summary["completed_tasks"] == 0
    assert summary["pending_tasks"] == 0
    assert summary["overdue_tasks"] == 0
    assert summary["progress_percentage"] == 0.0
    print("[PASS] Empty task list returns 0% progress and zero counts")

    past_date = (date.today() - timedelta(days=2)).isoformat()
    future_date_1 = (date.today() + timedelta(days=3)).isoformat()
    future_date_2 = (date.today() + timedelta(days=5)).isoformat()

    res_a = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Book College Seminar Hall",
        "description": "Get permission letter signed by HOD",
        "due_date": past_date,
        "is_completed": False
    })
    assert res_a.status_code == 201
    task_a = res_a.json()
    task_a_id = task_a["id"]
    print(f"[PASS] Created Task A (Overdue): '{task_a['task_name']}' (Due: {past_date})")

    res_b = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Order Farewell Mementos",
        "description": "Customized pens and certificates",
        "due_date": future_date_1,
        "is_completed": False
    })
    assert res_b.status_code == 201
    task_b_id = res_b.json()["id"]
    print(f"[PASS] Created Task B: 'Order Farewell Mementos' (Due: {future_date_1})")

    res_c = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Prepare Playlist & Speeches",
        "is_completed": False
    })
    assert res_c.status_code == 201
    task_c_id = res_c.json()["id"]
    assert res_c.json()["due_date"] is None
    print(f"[PASS] Created Task C without due date: 'Prepare Playlist & Speeches'")

    res_d = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Confirm Snack Catering",
        "due_date": future_date_2,
        "is_completed": False
    })
    assert res_d.status_code == 201
    task_d_id = res_d.json()["id"]
    print(f"[PASS] Created Task D: 'Confirm Snack Catering' (Due: {future_date_2})")

    # Tasks with due date sorted ascending chronologically; None at end
    res = client.get(f"/events/{event_id}/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) == 4
    # Check ordering: past_date -> future_date_1 -> future_date_2 -> None
    assert tasks[0]["id"] == task_a_id
    assert tasks[1]["id"] == task_b_id
    assert tasks[2]["id"] == task_d_id
    assert tasks[3]["id"] == task_c_id
    assert tasks[3]["due_date"] is None
    print("[PASS] Tasks returned in chronological timeline order, tasks without due dates at end")

    res = client.put(f"/tasks/{task_b_id}", json={
        "task_name": "Order Premium Farewell Mementos",
        "description": "Engraved pens and framed certificates"
    })
    assert res.status_code == 200
    updated_b = res.json()
    assert updated_b["task_name"] == "Order Premium Farewell Mementos"
    assert updated_b["description"] == "Engraved pens and framed certificates"
    assert updated_b["due_date"] == future_date_1
    assert updated_b["is_completed"] is False
    print("[PASS] Updated task name and description successfully")

    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    s1 = res.json()
    assert s1["total_tasks"] == 4
    assert s1["completed_tasks"] == 0
    assert s1["pending_tasks"] == 4
    assert s1["overdue_tasks"] == 1
    assert s1["progress_percentage"] == 0.0
    print(f"[PASS] Initial summary verified: Total 4, Pending 4, Overdue 1, Progress 0%")

    res = client.put(f"/tasks/{task_b_id}", json={"is_completed": True})
    assert res.status_code == 200
    assert res.json()["is_completed"] is True
    print("[PASS] Marked Task B as completed")

    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    s2 = res.json()
    assert s2["completed_tasks"] == 1
    assert s2["pending_tasks"] == 3
    assert s2["progress_percentage"] == 25.0
    print("[PASS] Progress percentage updated to 25.0% (1 of 4 completed)")

    # Task A was overdue. Mark it completed.
    res = client.put(f"/tasks/{task_a_id}", json={"is_completed": True})
    assert res.status_code == 200
    assert res.json()["is_completed"] is True

    # Now completed: 2, overdue: 0!
    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    s3 = res.json()
    assert s3["completed_tasks"] == 2
    assert s3["pending_tasks"] == 2
    assert s3["overdue_tasks"] == 0
    assert s3["progress_percentage"] == 50.0
    print("[PASS] Completed overdue task is no longer counted as overdue (Overdue: 0, Progress: 50%)")

    res = client.put(f"/tasks/{task_a_id}", json={"is_completed": False})
    assert res.status_code == 200
    assert res.json()["is_completed"] is False
    print("[PASS] Marked Task A back to pending (Overdue count should return to 1)")

    res = client.get(f"/events/{event_id}/tasks/summary")
    s4 = res.json()
    assert s4["completed_tasks"] == 1
    assert s4["overdue_tasks"] == 1
    assert s4["progress_percentage"] == 25.0

    res = client.delete(f"/tasks/{task_c_id}")
    assert res.status_code == 200
    print(f"[PASS] Deleted Task C (ID: {task_c_id})")

    # Verify task list count reduced to 3
    res = client.get(f"/events/{event_id}/tasks")
    assert len(res.json()) == 3

    # Summary updated: Total 3, Completed 1, Pending 2, Progress = 33.33%
    res = client.get(f"/events/{event_id}/tasks/summary")
    s5 = res.json()
    assert s5["total_tasks"] == 3
    assert s5["completed_tasks"] == 1
    assert s5["progress_percentage"] == 33.33
    print(f"[PASS] Summary after deletion: Total 3, Progress 33.33%")

    res = client.post(f"/events/{event_id}/tasks", json={"task_name": "   "})
    assert res.status_code == 422
    print("[PASS] Rejected blank task_name with HTTP 422")

    res = client.put(f"/tasks/{task_a_id}", json={"task_name": "   "})
    assert res.status_code == 422
    print("[PASS] PUT /tasks rejected blank task_name with HTTP 422")

    res = client.put(f"/tasks/{task_a_id}", json={"task_name": None})
    assert res.status_code == 422
    print("[PASS] PUT /tasks rejected null task_name with HTTP 422")

    res = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Invalid Date Task",
        "due_date": "2026-13-45"
    })
    assert res.status_code == 422
    print("[PASS] Rejected invalid calendar date '2026-13-45' with HTTP 422")

    res = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Slash Date Task",
        "due_date": "2026/11/20"
    })
    assert res.status_code == 422
    print("[PASS] Rejected non-ISO date format '2026/11/20' with HTTP 422")

    res = client.put(f"/tasks/{task_a_id}", json={"due_date": "tomorrow"})
    assert res.status_code == 422
    print("[PASS] PUT /tasks rejected 'tomorrow' date string with HTTP 422")

    ghost_event_id = 777777
    res = client.post(f"/events/{ghost_event_id}/tasks", json={"task_name": "Ghost Task"})
    assert res.status_code == 404
    print(f"[PASS] POST /events/{ghost_event_id}/tasks returned 404 Not Found")

    res = client.get(f"/events/{ghost_event_id}/tasks")
    assert res.status_code == 404
    print(f"[PASS] GET /events/{ghost_event_id}/tasks returned 404 Not Found")

    res = client.get(f"/events/{ghost_event_id}/tasks/summary")
    assert res.status_code == 404
    print(f"[PASS] GET /events/{ghost_event_id}/tasks/summary returned 404 Not Found")

    ghost_task_id = 888888
    res = client.put(f"/tasks/{ghost_task_id}", json={"task_name": "Ghost"})
    assert res.status_code == 404
    print(f"[PASS] PUT /tasks/{ghost_task_id} returned 404 Not Found")

    res = client.delete(f"/tasks/{ghost_task_id}")
    assert res.status_code == 404
    print(f"[PASS] DELETE /tasks/{ghost_task_id} returned 404 Not Found")

    res = client.delete(f"/events/{event_id}")
    assert res.status_code == 200
    print(f"[PASS] Deleted parent event (ID: {event_id})")

    # Verify task no longer exists
    res = client.put(f"/tasks/{task_a_id}", json={"is_completed": True})
    assert res.status_code == 404
    print("[PASS] Verified tasks were cascade-deleted with parent event")

    print("=" * 65)
    print("ALL STAGE 5 CHECKLIST & TIMELINE CHECKS PASSED!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_stage5_tests()
    sys.exit(0 if success else 1)
