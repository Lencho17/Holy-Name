import React, { useState } from 'react';
import axios from 'axios';
import { FaBullhorn, FaSpinner } from 'react-icons/fa';

const ReadmissionCampaign = ({ apiUrl, token }) => {
  const [classes, setClasses] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const classOptions = [
    'ALL', 'NURSERY', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 - Arts', '11 - Science', '11 - Commerce', '12 - Arts', '12 - Science', '12 - Commerce'
  ];

  const handleToggleClass = (cls) => {
    if (cls === 'ALL') {
      if (classes.includes('ALL')) setClasses([]);
      else setClasses(['ALL']);
      return;
    }

    if (classes.includes('ALL')) {
      setClasses([cls]);
      return;
    }

    if (classes.includes(cls)) {
      setClasses(classes.filter(c => c !== cls));
    } else {
      setClasses([...classes, cls]);
    }
  };

  const handleIssueCampaign = async (e) => {
    e.preventDefault();
    if (classes.length === 0 || !deadline) {
      alert("Please select at least one class and set a deadline.");
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${apiUrl}/students/readmission-campaign`, {
        classes,
        deadline
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Success! Issued readmission campaign for ${res.data.updatedCount} students.`);
      setClasses([]);
      setDeadline('');
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBullhorn className="text-blue-500" /> Issue Readmission Campaign
        </h3>
        <p className="text-gray-500 text-sm mt-1">Select classes and set a deadline to issue a readmission requirement. Promoted students will be prompted to pay their Admission Fee and Quarter 1 Tuition Fee.</p>
      </div>

      <form onSubmit={handleIssueCampaign} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Select Classes</label>
          <div className="flex flex-wrap gap-2">
            {classOptions.map(cls => (
              <button
                type="button"
                key={cls}
                onClick={() => handleToggleClass(cls)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${classes.includes(cls) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400'}`}
              >
                {cls === 'ALL' ? 'All Classes' : `Class ${cls}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Payment Deadline</label>
          <input
            type="date"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs w-full"
          />
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.startsWith('Success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin" /> : 'Issue Campaign'}
        </button>
      </form>
    </div>
  );
};

export default ReadmissionCampaign;
