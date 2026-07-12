import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaSearch, FaCheckCircle, FaTimesCircle, FaSpinner, FaRupeeSign, FaShoppingCart, FaServer } from 'react-icons/fa';

const DomainManager = ({ apiUrl, token }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  
  const [purchasing, setPurchasing] = useState(false);
  const [myDomains, setMyDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);

  const fetchDomains = async () => {
    try {
      const res = await axios.get(`${apiUrl}/domains`, { headers: { Authorization: `Bearer ${token}` } });
      setMyDomains(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Ensure domain has an extension for realistic search
    const domainToSearch = searchQuery.includes('.') ? searchQuery : `${searchQuery}.com`;

    try {
      setSearching(true);
      setSearchResult(null);
      const res = await axios.get(`${apiUrl}/domains/check?domain=${domainToSearch}`, { headers: { Authorization: `Bearer ${token}` } });
      setSearchResult(res.data);
    } catch (err) {
      alert('Failed to search domain. Try again later.');
    } finally {
      setSearching(false);
    }
  };

  const handleRequest = async (domainToBuy, priceToPay) => {
    if (window.confirm(`Are you sure you want to request ${domainToBuy}? The SuperAdmin will review and link this domain to your site.`)) {
      try {
        setPurchasing(true);
        const res = await axios.post(`${apiUrl}/domains/request`, {
          domain: domainToBuy,
          cost: priceToPay
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        alert(`Success! Your request for ${domainToBuy} has been submitted.`);
        setSearchResult(null);
        setSearchQuery('');
        fetchDomains(); // refresh my list
      } catch (err) {
        alert(err.response?.data?.message || 'Request failed');
      } finally {
        setPurchasing(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <FaGlobe className="text-purple-600 text-3xl" />
        <div>
          <h2 className="text-2xl font-black text-gray-800">Custom Domain Requests</h2>
          <p className="text-sm text-gray-500 font-medium">Search for a domain and request the SuperAdmin to link it to your school platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Search & Buy */}
        <div>
          <h3 className="font-black text-gray-800 text-lg mb-4">Register a New Domain</h3>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. holynameacademy.com" 
                className="w-full pl-10 pr-4 py-4 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-purple-500 shadow-sm"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={searching}
              className="bg-purple-600 text-white px-6 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {searching ? <FaSpinner className="animate-spin" /> : <><FaSearch className="mr-2"/> Search</>}
            </button>
          </form>

          {searchResult && (
            <div className={`p-8 rounded-2xl border ${searchResult.available ? 'border-green-200 bg-green-50/50' : 'border-red-100 bg-red-50/50'} animate-fadeIn shadow-sm`}>
              
              {!searchResult.available ? (
                <div className="mb-8 border-b border-gray-200 pb-6">
                  <h4 className="text-2xl font-black text-gray-800 mb-2">
                    Sorry, <span className="text-red-600 font-mono tracking-tight">{searchResult.domain}</span> is taken
                  </h4>
                  <p className="text-gray-500 font-medium">How about one of these alternatives?</p>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-6">
                  <div>
                    <h4 className="text-2xl font-black text-gray-800 font-mono tracking-tight">{searchResult.domain}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                        <FaCheckCircle className="mr-1"/> Available
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Yearly Cost</p>
                    <p className="text-3xl font-black text-gray-800 flex items-center justify-end">
                      <FaRupeeSign className="text-xl opacity-70" /> {searchResult.price}
                    </p>
                  </div>
                </div>
              )}

              {searchResult.available && (
                <button 
                  onClick={() => handleRequest(searchResult.domain, searchResult.price)}
                  disabled={purchasing}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-black shadow-lg shadow-gray-900/30 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-8"
                >
                  {purchasing ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {purchasing ? 'Submitting Request...' : 'Request Custom Domain'}
                </button>
              )}

              {/* Suggestions List */}
              {searchResult.suggestions && searchResult.suggestions.length > 0 && (
                <div className="mt-4 space-y-3">
                  {!searchResult.available && (
                     <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-widest">Recommended Alternatives</h4>
                  )}
                  {searchResult.suggestions.map((sug, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                      <div className="font-mono font-bold text-gray-800 text-lg">
                        {sug.domain}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-black text-gray-800 flex items-center justify-end text-xl">
                            <FaRupeeSign className="text-sm opacity-70 mr-0.5" />{sug.price}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">for first year</p>
                        </div>
                        <button 
                          onClick={() => handleRequest(sug.domain, sug.price)}
                          disabled={purchasing}
                          className="bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-black transition-colors disabled:opacity-50 shadow-md font-bold text-sm"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: My Domains */}
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-6 flex items-center gap-2">
            <FaServer className="text-purple-600" /> My Active Domains
          </h3>

          {loadingDomains ? (
            <div className="flex justify-center p-10"><FaSpinner className="animate-spin text-purple-500 text-2xl" /></div>
          ) : myDomains.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl">
              <FaGlobe className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">You haven't purchased any custom domains yet. Search and buy one to replace your vidyabarta.com subdomain!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDomains.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-purple-200 transition-colors cursor-default">
                  <div>
                    <h4 className="font-bold text-gray-800 font-mono text-lg">{d.domain_name}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-1">Purchased on {new Date(d.purchased_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1 ${
                      d.status === 'Active' || d.status === 'Linked' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {d.status === 'Active' || d.status === 'Linked' ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />} {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainManager;
