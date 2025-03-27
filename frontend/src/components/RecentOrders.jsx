import { Badge, Dropdown } from "react-bootstrap"

function RecentOrders({ orders = [], toast }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Processing":
        return "warning"
      case "Shipped":
        return "primary"
      case "Delivered":
        return "success"
      case "Pending":
        return "danger"
      default:
        return "secondary"
    }
  }

  // If no orders are provided, use sample data
  const displayOrders =
    orders.length > 0
      ? orders
      : [
          {
            order_id: "ORD-1234",
            customer_id: "CUST001",
            order_date: "2023-04-23T00:00:00.000Z",
            status: "Processing",
            types: "Top",
          },
          {
            order_id: "ORD-1233",
            customer_id: "CUST002",
            order_date: "2023-04-22T00:00:00.000Z",
            status: "Shipped",
            types: "Bottom",
          },
          {
            order_id: "ORD-1232",
            customer_id: "CUST003",
            order_date: "2023-04-21T00:00:00.000Z",
            status: "Delivered",
            types: "Pant",
          },
        ]

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Date</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayOrders.slice(0, 5).map((order) => (
            <tr key={order.order_id}>
              <td className="fw-medium">{order.order_id}</td>
              <td>{order.customer_id}</td>
              <td>{order.types}</td>
              <td>{new Date(order.order_date).toLocaleDateString()}</td>
              <td>
                <Badge bg={getStatusColor(order.status || "Processing")}>{order.status || "Processing"}</Badge>
              </td>
              <td className="text-end">
                <Dropdown align="end">
                  <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${order.order_id}`}>
                    <i className="bi bi-three-dots"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#">View Details</Dropdown.Item>
                    <Dropdown.Item href="#">Update Status</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item href="#">Generate Invoice</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { RecentOrders }

