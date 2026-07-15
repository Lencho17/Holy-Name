import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2, FiPlus, FiStar } from 'react-icons/fi';

export default function ManagePricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    name: '',
    description: '',
    price: '',
    interval: '/mo',
    features: [''],
    is_popular: false,
    button_text: 'Get Started',
    button_link: '/login',
    sort_order: 1,
  });

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/saas-pricing`);
      setPlans(res.data);
    } catch (error) {
      console.error('Failed to fetch pricing plans', error);
      alert('Error fetching pricing plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentPlan,
        features: JSON.stringify(currentPlan.features.filter(f => f.trim() !== '')),
      };

      if (isEditing) {
        await axios.put(`${apiBase}/saas-pricing/${currentPlan.id}`, payload);
        alert('Plan updated successfully');
      } else {
        await axios.post(`${apiBase}/saas-pricing`, payload);
        alert('Plan created successfully');
      }
      setIsEditing(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan', error);
      alert('Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    let parsedFeatures = [];
    try {
      parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
    } catch (e) {
      parsedFeatures = [];
    }
    setCurrentPlan({
      ...plan,
      features: parsedFeatures.length > 0 ? parsedFeatures : [''],
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      await axios.delete(`${apiBase}/saas-pricing/${id}`);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan', error);
      alert('Failed to delete plan');
    }
  };

  const updateFeature = (index, value) => {
    const updated = [...currentPlan.features];
    updated[index] = value;
    setCurrentPlan({ ...currentPlan, features: updated });
  };

  const addFeature = () => {
    setCurrentPlan({ ...currentPlan, features: [...currentPlan.features, ''] });
  };

  const removeFeature = (index) => {
    const updated = currentPlan.features.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push('');
    setCurrentPlan({ ...currentPlan, features: updated });
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentPlan.id ? 'Edit Plan' : 'Add New Plan'}</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Plan Name</label>
              <input required type="text" value={currentPlan.name} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Sort Order</label>
              <input type="number" value={currentPlan.sort_order} onChange={e => setCurrentPlan({...currentPlan, sort_order: parseInt(e.target.value) || 0})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Description</label>
            <input required type="text" value={currentPlan.description} onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Price (e.g. ₹1,999 or Custom)</label>
              <input required type="text" value={currentPlan.price} onChange={e => setCurrentPlan({...currentPlan, price: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Interval (e.g. /mo or leave blank)</label>
              <input type="text" value={currentPlan.interval} onChange={e => setCurrentPlan({...currentPlan, interval: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Features</label>
            {currentPlan.features.map((feat, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={feat} onChange={(e) => updateFeature(idx, e.target.value)} className="flex-1 border px-3 py-2 rounded focus:ring focus:ring-blue-200" placeholder="Feature description" />
                <button type="button" onClick={() => removeFeature(idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addFeature} className="text-sm font-semibold text-blue-600 hover:text-blue-800">+ Add Feature</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Button Text</label>
              <input required type="text" value={currentPlan.button_text} onChange={e => setCurrentPlan({...currentPlan, button_text: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Button Link</label>
              <input required type="text" value={currentPlan.button_link} onChange={e => setCurrentPlan({...currentPlan, button_link: e.target.value})} className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPop" checked={currentPlan.is_popular} onChange={e => setCurrentPlan({...currentPlan, is_popular: e.target.checked})} className="w-4 h-4 text-blue-600" />
            <label htmlFor="isPop" className="text-sm font-semibold text-gray-700">Highlight as "Most Popular"</label>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700">Save Plan</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Pricing Plans</h2>
        <button onClick={() => {
          setCurrentPlan({ name: '', description: '', price: '', interval: '/mo', features: [''], is_popular: false, button_text: 'Get Started', button_link: '/login', sort_order: plans.length + 1 });
          setIsEditing(true);
        }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          <span>+</span> Add New Plan
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500 border border-dashed border-gray-300">No pricing plans found. Click "Add New Plan" to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            let features = [];
            try { features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features; } catch(e) {}
            return (
              <div key={plan.id} className={`border rounded-xl p-5 relative flex flex-col ${plan.is_popular ? 'border-blue-500 ring-1 ring-blue-500 shadow-lg' : 'border-gray-200'}`}>
                {plan.is_popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Popular</div>}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(plan)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded" title="Edit">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded" title="Delete">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">{plan.price}<span className="text-lg text-gray-500 font-normal">{plan.interval}</span></p>
                <p className="text-sm text-gray-500 mb-4 h-10">{plan.description}</p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                  {(features || []).map((f, i) => <li key={i} className="flex gap-2"><span className="text-blue-500 font-bold">✓</span> {f}</li>)}
                </ul>
                <div className="text-xs text-center p-2 bg-gray-50 rounded text-gray-500 font-mono border border-gray-100">
                  Button: {plan.button_text} &rarr; {plan.button_link}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
