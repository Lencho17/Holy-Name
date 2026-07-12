import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';

const Appointment = () => {
  const { schoolProfile } = useContext(SiteDataContext);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const initialForm = {
    category: 'Academic Affairs',
    personnel: '',
    name: '',
    phone: '',
    email: '',
    appointmentDate: '',
    time_slot: '',
    purpose: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch Time Slots on Date Change
  useEffect(() => {
    if (formData.appointmentDate) {
      setFetchingSlots(true);
      setFormData(f => ({ ...f, time_slot: '' }));
      axios.get(`${apiBase}/appointments/slots?date=${formData.appointmentDate}`)
        .then(res => {
          setAvailableSlots(res.data || []);
        })
        .catch(err => {
          console.error(err);
          // Fallback static slots for demo if backend fails
          setAvailableSlots(['09:00 AM', '10:30 AM', '11:00 AM', '01:30 PM', '03:00 PM']);
        })
        .finally(() => setFetchingSlots(false));
    }
  }, [formData.appointmentDate, apiBase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const selectSlot = (slot) => {
    setFormData(f => ({ ...f, time_slot: slot }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time_slot) {
      alert("Please select a time slot.");
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(false);

    try {
      const payload = {
        category: formData.category,
        name: formData.name || 'Visitor',
        phone: formData.phone || '0000000000',
        email: formData.email || 'visitor@example.com',
        purpose: formData.purpose,
        appointmentDate: formData.appointmentDate,
        time_slot: formData.time_slot,
        persons_count: 1
      };

      await axios.post(`${apiBase}/appointments`, payload);
      setSubmitted(true);
      setFormData(initialForm);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Date input restriction (no past dates)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="min-h-screen pt-20">
        {/* Hero / Header Section */}
        <header className="relative overflow-hidden bg-primary py-16 md:py-24">
          <div className="absolute inset-0 opacity-10"></div>
          <div className="relative z-10 max-w-container-max mx-auto px-gutter text-center">
            <h1 className="font-display text-display text-on-primary mb-4">Book Your Session</h1>
            <p className="font-body-lg text-body-lg text-primary-fixed max-w-2xl mx-auto opacity-90">
              Schedule a one-on-one meeting with our academic counselors, faculty members, or administrative staff to discuss your educational journey.
            </p>
          </div>
        </header>

        {/* Main Booking Interface */}
        <section className="max-w-container-max mx-auto px-gutter -mt-12 mb-section-padding relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Information & Trust Signals */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Why Book?</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">school</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Academic Guidance</p>
                      <p className="text-label-sm text-on-surface-variant">Clarify course requirements and career paths.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">handshake</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Parent-Teacher Connect</p>
                      <p className="text-label-sm text-on-surface-variant">Review student progress with dedicated mentors.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">account_balance</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Administrative Queries</p>
                      <p className="text-label-sm text-on-surface-variant">Resolve admission or documentation concerns.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="relative rounded-xl overflow-hidden h-64 group shadow-md hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfSxALg_X3_enCA9hAKTMZxoBFtLiX88YzqZNN6g9kRwbubeFX-VJ6h-OJzVW2-Ysn7Qb9nx_rjbAfO-vYZhJ8OjdVZcy8wqt69ymDCjS_aaFceZqIR_b069dAQjboufce6zygJ9LTskyWSrtyj_MDD9UD6R7M-SG-bbKu48Beaokv4JyZtucF9MmSTKIh1VhIYMZWXI5dJ7u95OK7797Glh_6YfRUX_nJbEEhhdLIQmWx3_ye7W_8-RhohMc04Fpbi9dqertlC5c')" }}></div>
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <p className="font-headline-md text-headline-md">Our Campus</p>
                  <p className="text-label-md opacity-80">Visit us in person</p>
                </div>
              </div>
            </div>

            {/* Right Column: The Booking Form */}
            <div className="lg:col-span-8">
              <form className="bg-white p-8 md:p-12 rounded-xl shadow-md border border-outline-variant space-y-8" onSubmit={handleSubmit}>
                
                {/* Step 1: Contact Details & Department */}
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-3">
                    <span className="bg-primary-container text-on-primary-container w-8 h-8 flex items-center justify-center rounded-full text-label-md">1</span>
                    Your Details &amp; Department
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Full Name</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Phone Number</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Department</label>
                      <select name="category" value={formData.category} onChange={handleChange} className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all appearance-none cursor-pointer">
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Admissions & Enrollment">Admissions &amp; Enrollment</option>
                        <option value="Career Counseling">Career Counseling</option>
                        <option value="Faculty of Science">Faculty of Science</option>
                        <option value="Faculty of Arts">Faculty of Arts</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Personnel (Optional)</label>
                      <select name="personnel" value={formData.personnel} onChange={handleChange} className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all appearance-none cursor-pointer">
                        <option value="">Next Available Counselor</option>
                        <option value="Dr. Elena Richards">Dr. Elena Richards - Dean</option>
                        <option value="Prof. Marcus Thorne">Prof. Marcus Thorne - Dept Head</option>
                        <option value="Sarah Jenkins">Sarah Jenkins - Admin Lead</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-outline-variant opacity-50" />

                {/* Step 2: Date & Time */}
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-3">
                    <span className="bg-primary-container text-on-primary-container w-8 h-8 flex items-center justify-center rounded-full text-label-md">2</span>
                    Pick Date &amp; Time
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Appointment Date</label>
                      <input 
                        required 
                        type="date" 
                        name="appointmentDate" 
                        value={formData.appointmentDate} 
                        onChange={handleChange} 
                        min={today}
                        className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Available Slots</label>
                      <div className="grid grid-cols-3 gap-2">
                        {!formData.appointmentDate ? (
                          <div className="col-span-3 text-sm text-secondary">Please select a date first.</div>
                        ) : fetchingSlots ? (
                          <div className="col-span-3 text-sm text-primary flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Loading...</div>
                        ) : availableSlots.length > 0 ? (
                          availableSlots.map((slot, i) => (
                            <button 
                              key={i}
                              type="button" 
                              onClick={() => selectSlot(typeof slot === 'object' ? slot.slot : slot)}
                              className={`py-2 text-label-sm border rounded-lg transition-all ${formData.time_slot === (typeof slot === 'object' ? slot.slot : slot) ? 'bg-primary text-white border-primary' : 'border-outline-variant hover:border-primary hover:text-primary'}`}
                            >
                              {typeof slot === 'object' ? slot.slot : slot}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-3 text-sm text-error">No slots available for this date.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-outline-variant opacity-50" />

                {/* Step 3: Purpose & Details */}
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-3">
                    <span className="bg-primary-container text-on-primary-container w-8 h-8 flex items-center justify-center rounded-full text-label-md">3</span>
                    Purpose of Meeting
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1">Brief Description</label>
                      <textarea 
                        required
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        className="w-full p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all" 
                        placeholder="Please describe the purpose of your visit..." 
                        rows="4"
                      ></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="reminder" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                      <label htmlFor="reminder" className="text-body-md text-on-surface-variant cursor-pointer">Receive an SMS reminder 24 hours before the appointment</label>
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {submitError}
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={submitting || submitted}
                    className={`w-full py-4 rounded-lg font-headline-md text-headline-md shadow-lg transition-all transform active:scale-[0.98] ${submitted ? 'bg-green-600 text-white' : 'bg-primary text-on-primary hover:shadow-xl hover:bg-blue-700'}`}
                  >
                    {submitting ? 'Processing...' : submitted ? 'Appointment Booked!' : 'Confirm Appointment'}
                  </button>
                  <p className="text-center text-label-sm text-on-surface-variant mt-4">
                    By booking, you agree to our <a href="#" className="text-primary underline">Privacy Policy</a> regarding data handling.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="bg-surface-container py-section-padding">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Frequently Asked Questions</h2>
              <p className="text-body-lg text-on-surface-variant">Everything you need to know about visiting Excellence Academy.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                <h4 className="font-label-md text-label-md text-on-surface mb-2">Can I cancel my appointment?</h4>
                <p className="text-body-md text-on-surface-variant">Yes, appointments can be cancelled or rescheduled up to 4 hours in advance through the link in your confirmation email.</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                <h4 className="font-label-md text-label-md text-on-surface mb-2">What documents should I bring?</h4>
                <p className="text-body-md text-on-surface-variant">For admissions inquiries, please bring previous academic records and a valid ID. For counseling, no specific documents are required.</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                <h4 className="font-label-md text-label-md text-on-surface mb-2">Are virtual meetings available?</h4>
                <p className="text-body-md text-on-surface-variant">Currently, we prioritize in-person interactions, but virtual sessions can be requested by contacting our support desk directly.</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                <h4 className="font-label-md text-label-md text-on-surface mb-2">How long is each session?</h4>
                <p className="text-body-md text-on-surface-variant">Standard sessions are scheduled for 30 minutes. If you require more time, please mention it in the description field.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Appointment;
