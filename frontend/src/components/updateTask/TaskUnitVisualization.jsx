"use client"

import { useState, useEffect } from "react"
import { Card, Row, Col, Badge, ProgressBar } from "react-bootstrap"
import { FaCut, FaPrint, FaEdit, FaBox, FaQuestion } from "react-icons/fa"
import { GiSewingMachine } from 'react-icons/gi'; // Sewing machine icon
import { GiHeavyCollar } from "react-icons/gi";
import { TbHttpGet } from "react-icons/tb";

const TASK_UNITS = ["PROCUREMENT", "COLLAR", "CUTTING", "PRINTING", "EMBROIDERY", "STITCHING", "PACKAGING", "UNASSIGNED"]

const getTaskUnitIcon = (unit) => {
  switch (unit) {
    case "PROCUREMENT":
      return <TbHttpGet />
    case "COLLAR":
      return <GiHeavyCollar />
    case "CUTTING":
      return <FaCut />
    case "PRINTING":
      return <FaPrint />
    case "EMBROIDERY":
      return <FaEdit />
    case "STITCHING":
      return <GiSewingMachine />
    case "PACKAGING":
      return <FaBox />
    case "UNASSIGNED":
      return <FaQuestion />
    default:
      return <FaQuestion />
  }
}

const getTaskUnitColor = (unit) => {
  switch (unit) {
    case "PROCUREMENT":
      return "primary"
    case "COLLAR":
      return "warning"
    case "CUTTING":
      return "danger"
    case "PRINTING":
      return "primary"
    case "EMBROIDERY":
      return "warning"
    case "STITCHING":
      return "success"
    case "PACKAGING":
      return "info"
    case "UNASSIGNED":
      return "secondary"
    default:
      return "secondary"
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "NOT STARTED":
      return "secondary"
    case "IN PROGRESS":
      return "warning"
    case "COMPLETED":
      return "success"
    case "BLOCKED":
      return "danger"
    default:
      return "secondary"
  }
}

export default function TaskUnitVisualization({ tasks = [] }) {
  const [unitStats, setUnitStats] = useState({})

  useEffect(() => {
    // Calculate statistics for each task unit
    const stats = {}

    TASK_UNITS.forEach((unit) => {
      const unitTasks = tasks.filter((task) => task.task_unit === unit)
      const total = unitTasks.length
      const notStarted = unitTasks.filter((task) => task.status === "NOT STARTED").length
      const inProgress = unitTasks.filter((task) => task.status === "IN PROGRESS").length
      const completed = unitTasks.filter((task) => task.status === "COMPLETED").length
      const blocked = unitTasks.filter((task) => task.status === "BLOCKED").length

      stats[unit] = {
        total,
        notStarted,
        inProgress,
        completed,
        blocked,
        tasks: unitTasks,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })

    setUnitStats(stats)
  }, [tasks])

  const totalTasks = tasks.length
  const overallCompleted = tasks.filter((task) => task.status === "COMPLETED").length
  const overallCompletionRate = totalTasks > 0 ? Math.round((overallCompleted / totalTasks) * 100) : 0

  return (
    <div>
      {/* Overall Progress */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-gradient-primary text-white">
          <h5 className="mb-0 text-dark">📊 Overall Task Progress</h5>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold">Overall Completion</span>
                <span className="fw-bold">{overallCompletionRate}%</span>
              </div>
              <ProgressBar
                now={overallCompletionRate}
                variant={overallCompletionRate === 100 ? "success" : overallCompletionRate > 50 ? "warning" : "danger"}
                style={{ height: "20px" }}
              />
            </Col>
            <Col md={4} className="text-center">
              <h3 className="mb-0 text-primary">
                {overallCompleted}/{totalTasks}
              </h3>
              <small className="text-muted">Tasks Completed</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Task Units Grid */}
      <Row className="g-3">
        {TASK_UNITS.map((unit) => {
          const stats = unitStats[unit] || {
            total: 0,
            notStarted: 0,
            inProgress: 0,
            completed: 0,
            blocked: 0,
            completionRate: 0,
          }

          return (
            <Col key={unit} md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className={`bg-${getTaskUnitColor(unit)} text-white`}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {getTaskUnitIcon(unit)}
                      <span className="ms-2 fw-bold">{unit}</span>
                    </div>
                    <Badge bg="light" text="dark">
                      {stats.total}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="fw-bold">Progress</small>
                      <small className="fw-bold">{stats.completionRate}%</small>
                    </div>
                    <ProgressBar
                      now={stats.completionRate}
                      variant={
                        stats.completionRate === 100 ? "success" : stats.completionRate > 50 ? "warning" : "danger"
                      }
                      style={{ height: "8px" }}
                    />
                  </div>

                  {/* Status Breakdown */}
                  <div className="d-flex flex-wrap gap-1">
                    {stats.notStarted > 0 && (
                      <Badge bg="secondary" className="small">
                        {stats.notStarted} Not Started
                      </Badge>
                    )}
                    {stats.inProgress > 0 && (
                      <Badge bg="warning" className="small">
                        {stats.inProgress} In Progress
                      </Badge>
                    )}
                    {stats.completed > 0 && (
                      <Badge bg="success" className="small">
                        {stats.completed} Completed
                      </Badge>
                    )}
                    {stats.blocked > 0 && (
                      <Badge bg="danger" className="small">
                        {stats.blocked} Blocked
                      </Badge>
                    )}
                  </div>

                  {/* Task List */}
                  {stats.total > 0 && (
                    <div className="mt-3">
                      <small className="text-muted fw-bold">Tasks:</small>
                      <div className="mt-1" style={{ maxHeight: "100px", overflowY: "auto" }}>
                        {stats.tasks.map((task) => (
                          <div
                            key={task.task_id}
                            className="d-flex justify-content-between align-items-center py-1 border-bottom"
                          >
                            <small className="text-truncate me-2">{task.name}</small>
                            <Badge bg={getStatusColor(task.status)} className="small">
                              {task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.total === 0 && (
                    <div className="text-center text-muted py-3">
                      <small>No tasks assigned</small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Summary Statistics */}
      <Card className="mt-4 border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h6 className="mb-0">📈 Summary Statistics</h6>
        </Card.Header>
        <Card.Body>
          <Row className="text-center">
            <Col md={3}>
              <div className="border-end">
                <h4 className="text-secondary mb-0">
                  {Object.values(unitStats).reduce((sum, stat) => sum + stat.notStarted, 0)}
                </h4>
                <small className="text-muted">Not Started</small>
              </div>
            </Col>
            <Col md={3}>
              <div className="border-end">
                <h4 className="text-warning mb-0">
                  {Object.values(unitStats).reduce((sum, stat) => sum + stat.inProgress, 0)}
                </h4>
                <small className="text-muted">In Progress</small>
              </div>
            </Col>
            <Col md={3}>
              <div className="border-end">
                <h4 className="text-success mb-0">
                  {Object.values(unitStats).reduce((sum, stat) => sum + stat.completed, 0)}
                </h4>
                <small className="text-muted">Completed</small>
              </div>
            </Col>
            <Col md={3}>
              <div>
                <h4 className="text-danger mb-0">
                  {Object.values(unitStats).reduce((sum, stat) => sum + stat.blocked, 0)}
                </h4>
                <small className="text-muted">Blocked</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  )
}
