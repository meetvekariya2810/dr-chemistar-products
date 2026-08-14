import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, Building2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { createEnquiry, isEnquiryFormDisabled } from '../api';

const WHATSAPP_LINK = 'https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20have%20an%20inquiry.';

/**
 * Short, human-quotable reference from the database id.
 *
 * MongoDB ids are 24 hex characters - unusable as something a farmer reads out
 * over the phone. The last 8 are the counter/random portion, so they are the
 * part that actually distinguishes two enquiries.
 */
const toReferenceId = (id: string) => (id || '').slice(-8).toUpperCase();

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
  const [referenceId, setReferenceId] = useState<string>('');
  const [submittedName, setSubmittedName] = useState<string>('');
  const [submittedType, setSubmittedType] = useState<string>('');

  const t = TRANSLATIONS[currentLang];

  /**
   * Catch the obvious problems before spending a round trip, using the same
   * rules the server enforces so a submission can never pass here and fail
   * there with a different-sounding message.
   */
  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your full name.';
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) return 'Please enter your phone number.';
    if (digits.length < 7 || digits.length > 15) return 'Please enter a valid phone number.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address, or leave it blank.';
    }
    if (!city.trim()) return 'Please enter your city or district.';
    if (!userType.trim()) return 'Please choose what you are inquiring as.';
    if (!message.trim()) return 'Please describe your requirement.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    // The ONLY case that may claim submission is unavailable: the form has been
    // deliberately switched off with VITE_DISABLE_ENQUIRY_FORM. Otherwise we
    // always call the API and report what actually happened - a build without
    // VITE_API_URL is not the same thing as a site without a backend.
    if (isEnquiryFormDisabled) {
      setError(
        'Online enquiry submission is currently switched off. ' +
          'Please send us your requirement on WhatsApp or call +91 6351 250 285 - our team replies within 4 hours.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await createEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        userType,
        message: message.trim(),
        city: city.trim()
      });
      setReferenceId(toReferenceId(result?.id || ''));
      setSubmittedName(name.trim());
      setSubmittedType(userType);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.status === 0
          ? 'Unable to connect to the enquiry service. Please try again in a moment, or contact us on WhatsApp.'
          : err?.message || 'Something went wrong while sending your enquiry. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitted(false);
    setError(null);
    setReferenceId('');
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

            {/* Real Google Map Location Card */}
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-white/10 p-4">
              <div className="w-full overflow-hidden rounded-2xl border border-slate-800 h-[300px] sm:h-[450px] bg-slate-900">
                <iframe
                  title="DR. CHEMISTAR Agro Industries Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d17104.825557503747!2d70.77703427960643!3d22.13824499768966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3958352105fb75b9%3A0x8a1a870606a0656e!2sDR.%20CHEMISTAR%20AGRO%20INDUSTRIES!5e1!3m2!1sen!2sin!4v1786636267189!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="focus:outline-none"
                />
              </div>
              
              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                    DR. CHEMISTAR CROP CARE PVT. LTD.
                  </h4>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    Verified Location
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-amber-400 text-xs font-bold">4.9</span>
                  <div className="flex text-amber-400">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-1">(Factory & Head Office)</span>
                </div>

                <div className="text-slate-300 text-xs leading-relaxed font-sans">
                  <p className="font-bold text-white mb-1">Factory & Registered Office:</p>
                  <p>Survey No. 664, Plot No. 17,</p>
                  <p>Near Atul Auto, N.H.-8B,</p>
                  <p>Sopan Industrial Zone,</p>
                  <p>Rajkot, Gujarat, India.</p>
                </div>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=DR.+CHEMISTAR+AGRO+INDUSTRIES,+Sopan+Industrial+Zone,+Rajkot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <span>Open in Google Maps App</span>
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
                  Enquiry Submitted
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your enquiry has been submitted successfully. Thank you,{' '}
                  <span className="font-bold text-white">{submittedName}</span> - your message regarding{' '}
                  <span className="font-bold text-emerald-400">{submittedType} support</span> has been logged
                  into our Rajkot headquarters database. Our technical team will contact you shortly.
                </p>

                {referenceId && (
                  <div className="bg-slate-900/60 border border-emerald-400/20 rounded-xl px-4 py-3 inline-block">
                    <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Reference ID
                    </span>
                    <span className="block text-lg font-black text-emerald-300 font-mono tracking-wider">
                      #{referenceId}
                    </span>
                  </div>
                )}

                <div>
                  <button
                    onClick={handleSendAnother}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Send another enquiry
                  </button>
                </div>
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
                    <option value="Retailer">Retailer</option>
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
