import React, { useState } from 'react';
import axios from 'axios';
import { FaWhatsapp, FaSms, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const CommunicationHub = ({ apiUrl, token }) => {
  const [audience, setAudience] = useState('All Parents');
  const [channel, setChannel] = useState('WhatsApp');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return alert('Message cannot be empty');
    
    try {
      setSending(true);
      await axios.post(`${apiUrl}/communication`, {
        audience,
        channel,
        message
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert(`Message successfully sent via ${channel} to ${audience}!`);
      setMessage('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaWhatsapp className="text-green-500 text-3xl" />
        <h2 className="text-2xl font-black text-gray-800">Communication Hub</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSend} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Target Audience</label>
                <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full border-gray-200 p-3 rounded-xl shadow-sm font-semibold">
                  <option value="All Parents">All Parents</option>
                  <option value="Class 10 Parents">Class 10 Parents</option>
                  <option value="Class 12 Parents">Class 12 Parents</option>
                  <option value="All Teaching Staff">All Teaching Staff</option>
                  <option value="All Non-Teaching Staff">All Non-Teaching Staff</option>
                  <option value="Fee Defaulters">Fee Defaulters</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Channel</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setChannel('WhatsApp')}
                    className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-xl font-bold border-2 transition-all ${channel === 'WhatsApp' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    <FaWhatsapp /> WhatsApp
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChannel('SMS')}
                    className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-xl font-bold border-2 transition-all ${channel === 'SMS' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    <FaSms /> SMS
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1 flex justify-between">
                Message Content
                <span className="text-gray-400 font-normal">{message.length} chars</span>
              </label>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                rows="6" 
                className="w-full border-gray-200 p-4 rounded-xl shadow-sm resize-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder={`Dear Parents,\n\nThis is to inform you that...`}
              />
            </div>

            <button 
              disabled={sending || !message.trim()}
              type="submit" 
              className={`w-full p-4 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all ${
                channel === 'WhatsApp' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30 shadow-lg' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30 shadow-lg'
              } disabled:opacity-50 disabled:shadow-none`}
            >
              {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />} 
              {sending ? 'Sending Broadcast...' : `Send Broadcast via ${channel}`}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaWhatsapp className="text-green-500"/> Live Preview</h3>
          
          <div className="bg-[#E5DDD5] w-full max-w-[300px] mx-auto rounded-3xl overflow-hidden shadow-inner border-[8px] border-gray-800 relative h-[400px] flex flex-col">
            <div className="bg-[#075E54] text-white p-3 font-bold text-sm flex items-center gap-2 z-10 shadow-sm">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#075E54] font-black text-xs">HN</div>
              <div>
                <div>{audience}</div>
                <div className="text-[10px] font-normal text-green-100">Official School Account</div>
              </div>
            </div>
            <div className="p-3 flex-1 overflow-y-auto relative z-10 flex flex-col justify-end pb-4">
              {message ? (
                <div className="bg-[#DCF8C6] text-gray-800 p-3 rounded-lg rounded-tr-none text-sm max-w-[85%] self-end shadow-sm relative whitespace-pre-wrap">
                  {message}
                  <div className="text-[10px] text-green-700 text-right mt-1 opacity-70">10:42 AM</div>
                </div>
              ) : (
                <div className="text-center text-xs text-gray-500 bg-white/50 p-2 rounded-lg">Start typing to see preview...</div>
              )}
            </div>
            
            {/* WhatsApp Doodle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/508/172/HD-wallpaper-whatsapp-background-doodles-pattern.jpg")', backgroundSize: 'cover' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub;
