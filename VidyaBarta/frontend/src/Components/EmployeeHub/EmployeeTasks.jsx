import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { EmployeeAuthContext } from '../../context/EmployeeAuthContext';
import { FaCheckCircle, FaSpinner, FaRegCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeTasks = () => {
  const { employee } = useContext(EmployeeAuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [employee]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const res = await axios.get(`${API_URL}/employee-auth/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (taskId) => {
    try {
      const token = localStorage.getItem('employeeToken');
      await axios.put(`${API_URL}/employee-auth/tasks/${taskId}/finish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to finish task', error);
      alert('Failed to mark task as finished');
    }
  };

  if (loading) {
    return <div className="text-center py-20"><FaSpinner className="animate-spin text-4xl text-primary mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral">My Tasks</h2>
          <p className="text-on-surface-variant">View and complete assignments assigned by your manager.</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        {tasks.length === 0 ? (
          <div className="text-center text-on-surface-variant py-10">You have no tasks assigned.</div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className={`p-4 rounded-xl border ${task.status === 'finished' ? 'border-emerald-200 bg-emerald-50/30' : 'border-outline-variant bg-surface'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${task.status === 'finished' ? 'text-emerald-700' : 'text-neutral'}`}>{task.title}</h3>
                    {task.description && <p className="text-on-surface-variant mt-1">{task.description}</p>}
                    <div className="text-xs text-outline mt-2">
                      Assigned: {new Date(task.created_at).toLocaleString()}
                      {task.status === 'finished' && task.finished_at && ` • Finished: ${new Date(task.finished_at).toLocaleString()}`}
                    </div>
                  </div>
                  <div>
                    {task.status === 'finished' ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-100 px-3 py-1 rounded-lg">
                        <FaCheckCircle /> Finished
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleFinish(task.id)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaRegCircle /> Mark Finished
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTasks;
