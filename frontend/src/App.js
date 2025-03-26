import React, { useEffect, useState } from 'react';
import './App.css';

import OrderForm from "./components/orderForm";
import OrderList from "./components/orderList/orderList";

function App() {
  // return (
  //   <div className="p-6 bg-gray-100 min-h-screen mainPage">
  //     <OrderForm />
  //   </div>
  // );

  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-indigo-600 text-dark' : 'bg-white border'}`}
          onClick={() => setActiveTab('create')}
        >
          Create Order
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'view' ? 'bg-indigo-600 text-dark' : 'bg-white border'}`}
          onClick={() => setActiveTab('view')}
        >
          View Orders
        </button>
      </div>

      {activeTab === 'create' ? <OrderForm /> : <OrderList />}
    </div>
  );
}
export default App;
