import { Card, Badge, ProgressBar } from "react-bootstrap"

function TasksList({ tasks = [], toast }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "NOT STARTED":
        return "secondary"
      case "IN PROGRESS":
        return "warning"
      case "COMPLETED":
        return "success"
      default:
        return "secondary"
    }
  }

  const getProgressValue = (status) => {
    switch (status) {
      case "NOT STARTED":
        return 0
      case "IN PROGRESS":
        return 50
      case "COMPLETED":
        return 100
      default:
        return 0
    }
  }

  // If no tasks are provided, use sample data
  const displayTasks =
    tasks.length > 0
      ? tasks
      : [
          {
            task_id: "TASK-1",
            name: "Process Order #ORD-1234",
            status: "IN PROGRESS",
            dependencies: "[]",
          },
          {
            task_id: "TASK-2",
            name: "Quality Check for Order #ORD-1233",
            status: "NOT STARTED",
            dependencies: '["TASK-1"]',
          },
          {
            task_id: "TASK-3",
            name: "Restock Cotton Fabric",
            status: "COMPLETED",
            dependencies: "[]",
          },
        ]

  return (
    <div className="task-list">
      {displayTasks.slice(0, 5).map((task) => (
        <Card key={task.task_id} className="mb-3 border-0 shadow-sm">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <div
                  className={`me-2 rounded-circle bg-${getStatusColor(task.status)} d-flex align-items-center justify-content-center`}
                  style={{ width: "10px", height: "10px" }}
                ></div>
                <h6 className="mb-0">{task.name}</h6>
              </div>
              <Badge bg={getStatusColor(task.status)}>{task.status}</Badge>
            </div>
            <ProgressBar
              now={getProgressValue(task.status)}
              variant={getStatusColor(task.status)}
              style={{ height: "6px" }}
            />
            {task.dependencies && task.dependencies !== "[]" && (
              <div className="mt-2 small text-muted">
                <i className="bi bi-link me-1"></i>
                Has dependencies
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  )
}

export { TasksList }

