import React, { useState, Suspense, lazy } from 'react';
import './App.css';
import './components/overlay/overlay.css'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Spinner from 'react-bootstrap/Spinner';
import Nav from 'react-bootstrap/Nav';


// ✅ Lazy-loaded components
const OrderForm = lazy(() => import('./components/orderForm'));
const OrderList = lazy(() => import('./components/orderList/orderList'));

const TaskList = lazy(() => import('./components/orderList/viewTasks'));

function App() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen bg-gray-50 p-6 formStyle">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab title="Create Order" eventKey="create">
          {activeTab === 'create' && (
            <Suspense fallback={<Spinner animation="border" className="m-4" />}>
              <OrderForm />
            </Suspense>
          )}
        </Tab>

        <Tab title="View Orders" eventKey="view">
          {activeTab === 'view' && (
            <Suspense fallback={<Spinner animation="border" className="m-4" />}>
              <OrderList />
            </Suspense>
          )}
        </Tab>
        <Tab title="View Tasks" eventKey="task">
          {activeTab === 'task' && (
            <Suspense fallback={<Spinner animation="border" className="m-4" />}>
              <TaskList />
            </Suspense>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}

export default App;
