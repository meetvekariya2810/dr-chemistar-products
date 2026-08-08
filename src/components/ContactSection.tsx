import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, Building2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { createEnquiry, isApiConfigured } from '../api';

const WHATSAPP_LINK = 'https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20have%20an%20inquiry.';

interface ContactSectionProps {
  currentLang: Language;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ currentLang }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [userType, setUserType] = useState('Farmer');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    // No backend on this deployment: say so instead of showing a thank-you for
    // an enquiry nobody will ever receive.
    if (!isApiConfigured) {
      setError(
        'Online enquiry submission is not available on this site yet. ' +
          'Please send us your requirement on WhatsApp or call +91 6351 250 285 - our team replies within 4 hours.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await createEnquiry({ name, phone, email, userType, message, city });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while sending your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitted(false);
    setError(null);
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setUserType('Farmer');
    setMessage('');
  };

  return (
    <section id="contact" className="py-16 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold mb-3">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>24/7 Corporate & Customer Care Contact</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            {t.contactTitle}
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            Headquartered in Rajkot, Gujarat. Reach out for sales, dealership inquiries, product support, or technical agronomic consultation.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Office Info & Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
              
              <div>
                <h3 className="text-xl font-bold font-display text-white mb-4">
                  {t.headOffice}
                </h3>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Factory & Registered Office:</span>
                      <p className="text-slate-300 leading-relaxed mt-0.5">{t.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Customer Care Hotline:</span>
                      <a href="tel:+916351250285" className="text-amber-300 font-bold hover:underline">
                        +91 6351 250 285
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-sky-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Corporate Email:</span>
                      <a href="mailto:drchemistarcrop@gmail.com" className="text-sky-300 hover:underline">
                        drchemistarcrop@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Business Operating Hours:</span>
                      <p className="text-slate-300">Monday - Saturday: 9:00 AM to 7:00 PM IST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA */}
              <a
                href="https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-glow-green"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Chat Directly on WhatsApp (+91 6351 250 285)</span>
              </a>

            </div>

            {/* Simulated Google Map Location Card */}
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-white/10 p-4 text-center">
              <div className="bg-slate-900 rounded-2xl h-48 flex flex-col items-center justify-center p-4 border border-slate-800">
                <MapPin className="w-10 h-10 text-emerald-400 animate-bounce mb-2" />
                <span className="text-xs font-bold text-white">Google Maps Location Preview</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Sopan Industrial Zone, Near Atul Auto, Rajkot (Gujarat)</span>
                <a
                  href="https://maps.google.com/?q=Rajkot+Sopan+Industrial+Zone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/20"
                >
                  Open in Google Maps App
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Contact & Lead Form */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
            
            <h3 className="text-xl font-bold font-display text-white mb-2">
              Send us a Message or Inquiry
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Our regional technical officers will respond to your query within 4 hours.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 p-8 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-2xl font-black text-white font-display">
                  Inquiry Received!
                </h4>
                <p className="text-xs text-slate-300">
                  Thank you, <span className="font-bold text-white">{name}</span>. Your message regarding <span className="font-bold text-emerald-400">{userType} support</span> has been logged into our Rajkot headquarters database.
                </p>
                <button
                  onClick={handleSendAnother}
                  className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {error && (
                  <div
                    role="alert"
                    className="bg-red-500/15 border border-red-400/40 text-red-100 p-4 rounded-2xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed space-y-2">
                      <p className="font-bold text-white">Your enquiry could not be sent</p>
                      <p>{error}</p>
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-300 hover:underline"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        Send it on WhatsApp instead
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Phone / Mobile No. *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajkot, Gondal, Junagadh"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">I am inquiring as a:</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Farmer">Farmer (ખેડૂત)</option>
                    <option value="Dealer">Authorized Agro Dealer (ડીલર)</option>
                    <option value="Distributor">Distributor / Stockist</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Your Message / Product Inquiry *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your crop requirement or product inquiry here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry Form</span>
                      </>
                    )}
                  </button>

                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
