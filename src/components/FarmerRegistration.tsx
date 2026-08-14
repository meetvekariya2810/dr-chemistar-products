import React, { useState } from 'react';
import { Language } from '../types';
import {
  Sprout,
  User,
  MapPin,
  Tractor,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  ShieldCheck,
  Phone,
  MessageCircle
} from 'lucide-react';
import { createFarmer, DuplicateFarmerError, ApiError } from '../api';
import {
  GENDERS,
  LAND_UNITS,
  IRRIGATION_TYPES,
  SOIL_TYPES,
  SEASONS,
  FARMING_TYPES,
  FARMING_EXPERIENCE,
  INTERESTS,
  COMMON_CROPS,
  STATES
} from '../data/farmerOptions';

const WHATSAPP_LINK = 'https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20need%20help%20registering%20as%20a%20farmer.';

interface FarmerRegistrationProps {
  currentLang: Language;
}

const EMPTY_FORM = {
  farmer_name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  gender: '',
  age: '',
  village: '',
  city: '',
  district: '',
  state: 'Gujarat',
  pincode: '',
  farm_area: '',
  land_unit: 'Bigha',
  irrigation: '',
  soil_type: '',
  main_crop: '',
  current_season: '',
  crop_area: '',
  farming_experience: '',
  farming_type: '',
  message: ''
};

type FormState = typeof EMPTY_FORM;
type FieldErrors = Partial<Record<keyof FormState | 'consent', string>>;

/**
 * Three steps, but only the FIRST contains anything mandatory.
 *
 * A farmer standing in a field on a weak connection has to be able to finish in
 * under a minute, so steps 2 and 3 are entirely optional and can be skipped
 * outright with "Submit now". Splitting the ~20 fields into one long scroll
 * would read as far more work than it is and cost real registrations.
 */
const STEPS = [
  { n: 1, label: 'Your Details', icon: User },
  { n: 2, label: 'Your Village', icon: MapPin },
  { n: 3, label: 'Your Farm', icon: Tractor }
];

/** Shared input styling - large tap targets, 16px text so iOS never zooms. */
const inputClass =
  'w-full bg-white border border-slate-300 text-slate-900 px-4 py-3.5 rounded-xl text-base ' +
  'font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 ' +
  'focus:ring-2 focus:ring-emerald-500/20 transition-colors';

const labelClass = 'text-sm font-bold text-slate-700 block mb-1.5';

export const FarmerRegistration: React.FC<FarmerRegistrationProps> = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [otherCrops, setOtherCrops] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [farmerId, setFarmerId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Set when the API reports this mobile just registered; submitting again
  // confirms it rather than silently creating a second record.
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    // Any edit invalidates a previous duplicate prompt.
    setDuplicateWarning(null);
  };

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  /**
   * Only the four genuinely required things are checked, and the rules match the
   * server's exactly (see server/utils/mobile.js) so nothing can pass here and
   * be rejected there with different wording.
   */
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};

    if (!form.farmer_name.trim()) errs.farmer_name = 'Please enter your name';

    const digits = form.mobile.replace(/\D/g, '');
    const local =
      digits.length === 10 ? digits
        : digits.length === 11 && digits.startsWith('0') ? digits.slice(1)
          : digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
            : '';
    if (!form.mobile.trim()) errs.mobile = 'Please enter your mobile number';
    else if (!/^[6-9]\d{9}$/.test(local)) errs.mobile = 'Please enter a valid 10-digit mobile number';

    if (!form.village.trim() && !form.city.trim()) {
      errs.village = 'Please enter your village or city';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email, or leave it blank';
    }
    if (form.pincode.trim() && !/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      errs.pincode = 'PIN code should be 6 digits';
    }
    if (!consent) errs.consent = 'Please tick the box so we may save your details';

    return errs;
  };

  const submit = async (confirmDuplicate = false) => {
    if (submitting) return;

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Send the farmer back to the step that actually has the problem rather
      // than showing an error they cannot see the cause of.
      if (errs.farmer_name || errs.mobile || errs.consent || errs.email) setStep(1);
      else if (errs.village || errs.pincode) setStep(2);
      setError('Please check the highlighted fields.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await createFarmer(
        { ...form, other_crops: otherCrops, interests, consent: true },
        confirmDuplicate
      );
      setFarmerId(result.farmer_id);
    } catch (err) {
      if (err instanceof DuplicateFarmerError) {
        setDuplicateWarning(err.message);
      } else if (err instanceof ApiError && err.status === 0) {
        setError('Unable to reach our server. Please check your connection and try again, or register on WhatsApp.');
      } else {
        setError((err as Error)?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(farmerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked - the number is on screen anyway */
    }
  };

  const registerAnother = () => {
    setForm(EMPTY_FORM);
    setOtherCrops([]);
    setInterests([]);
    setConsent(false);
    setFarmerId('');
    setStep(1);
    setError(null);
    setFieldErrors({});
    setDuplicateWarning(null);
  };

  /* ---------------------------------------------------------------------- */
  /* Success                                                                 */
  /* ---------------------------------------------------------------------- */

  if (farmerId) {
    return (
      <section id="farmer" className="py-12 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-11 h-11 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 font-display">
                Registration Successful!
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Thank you, <span className="font-bold text-slate-900">{form.farmer_name}</span>.
                You are now registered with Dr. CHEMISTAR. Our technical team will contact you
                with crop guidance and product recommendations.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5">
              <span className="block text-[11px] uppercase tracking-widest text-emerald-700 font-black">
                Your Farmer Registration ID
              </span>
              <span className="block text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-wider mt-1.5 break-all">
                {farmerId}
              </span>
              <button
                onClick={copyId}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Please save this ID. Quote it when you call our customer care so our team can
              find your details instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:+916351250285"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Us
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                WhatsApp
              </a>
            </div>

            <button
              onClick={registerAnother}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
            >
              Register another farmer
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Form                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <section id="farmer" className="py-10 sm:py-14 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold mb-3">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Free Farmer Registration &middot; ખેડૂત નોંધણી</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
            Join the Dr. CHEMISTAR Farmer Family
          </h1>
          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
            Register free to get crop advice, pest &amp; disease guidance and product
            recommendations from our technical team. It takes less than a minute -
            only your name, mobile and village are required.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.n;
            const active = step === s.n;
            return (
              <React.Fragment key={s.n}>
                <button
                  type="button"
                  onClick={() => setStep(s.n)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      active
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : done
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-bold ${
                      active ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className={`h-0.5 w-6 sm:w-14 rounded ${step > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-8 space-y-5"
        >

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-bold">Could not register</p>
                <p className="mt-0.5">{error}</p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:underline mt-2"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Register on WhatsApp instead
                </a>
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div role="alert" className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold">Already registered?</p>
                  <p className="mt-0.5">{duplicateWarning}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
                >
                  Yes, register again
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="bg-white border border-amber-300 text-amber-800 font-bold text-xs px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------ STEP 1 ------------------------------ */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Your Details
              </h2>

              <div>
                <label className={labelClass}>
                  Farmer Name <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-medium"> / ખેડૂતનું નામ</span>
                </label>
                <input
                  type="text"
                  value={form.farmer_name}
                  onChange={(e) => set('farmer_name', e.target.value)}
                  placeholder="e.g. Rameshbhai Patel"
                  autoComplete="name"
                  className={`${inputClass} ${fieldErrors.farmer_name ? 'border-red-400' : ''}`}
                />
                {fieldErrors.farmer_name && <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.farmer_name}</p>}
              </div>

              <div>
                <label className={labelClass}>
                  Mobile Number <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-medium"> / મોબાઈલ નંબર</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  className={`${inputClass} ${fieldErrors.mobile ? 'border-red-400' : ''}`}
                />
                {fieldErrors.mobile && <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.mobile}</p>}
              </div>

              <details className="group">
                <summary className="text-xs font-bold text-emerald-700 cursor-pointer select-none list-none flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  Add more details (optional)
                </summary>

                <div className="mt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Alternate Mobile</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={form.alternate_mobile}
                        onChange={(e) => set('alternate_mobile', e.target.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="Optional"
                        autoComplete="email"
                        className={`${inputClass} ${fieldErrors.email ? 'border-red-400' : ''}`}
                      />
                      {fieldErrors.email && <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.email}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                        <option value="">Prefer not to say</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Age</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={10}
                        max={120}
                        value={form.age}
                        onChange={(e) => set('age', e.target.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* ------------------------------ STEP 2 ------------------------------ */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Your Village
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Village <span className="text-red-500">*</span>
                    <span className="text-slate-400 font-medium"> / ગામ</span>
                  </label>
                  <input
                    type="text"
                    value={form.village}
                    onChange={(e) => set('village', e.target.value)}
                    placeholder="e.g. Ingorala"
                    className={`${inputClass} ${fieldErrors.village ? 'border-red-400' : ''}`}
                  />
                  {fieldErrors.village && <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.village}</p>}
                </div>
                <div>
                  <label className={labelClass}>City / Taluka</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="e.g. Savarkundla"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 -mt-1">
                Either one is enough - fill in whichever you know.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>District</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => set('district', e.target.value)}
                    placeholder="e.g. Amreli"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="sm:w-1/2">
                <label className={labelClass}>PIN Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value)}
                  placeholder="Optional"
                  className={`${inputClass} ${fieldErrors.pincode ? 'border-red-400' : ''}`}
                />
                {fieldErrors.pincode && <p className="text-xs text-red-600 font-semibold mt-1">{fieldErrors.pincode}</p>}
              </div>
            </div>
          )}

          {/* ------------------------------ STEP 3 ------------------------------ */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-600" />
                Your Farm <span className="text-xs font-bold text-slate-400">(all optional)</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Farm Area</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.1"
                      value={form.farm_area}
                      onChange={(e) => set('farm_area', e.target.value)}
                      placeholder="e.g. 12"
                      className={inputClass}
                    />
                    <select
                      value={form.land_unit}
                      onChange={(e) => set('land_unit', e.target.value)}
                      className={`${inputClass} w-32`}
                    >
                      {LAND_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Irrigation</label>
                  <select value={form.irrigation} onChange={(e) => set('irrigation', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {IRRIGATION_TYPES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Soil Type</label>
                  <select value={form.soil_type} onChange={(e) => set('soil_type', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Main Crop</label>
                  <select value={form.main_crop} onChange={(e) => set('main_crop', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {COMMON_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Other Crops You Grow</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CROPS.filter((c) => c !== 'Other').map((crop) => {
                    const on = otherCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggle(otherCrops, setOtherCrops, crop)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          on
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Current Season</label>
                  <select value={form.current_season} onChange={(e) => set('current_season', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Farming Type</label>
                  <select value={form.farming_type} onChange={(e) => set('farming_type', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {FARMING_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Farming Experience</label>
                <select value={form.farming_experience} onChange={(e) => set('farming_experience', e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {FARMING_EXPERIENCE.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>What are you interested in?</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((item) => {
                    const on = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggle(interests, setInterests, item)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          on
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>Your Message / Question</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Tell us about any crop problem you are facing..."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Consent - always visible, on every step */}
          <div className={`rounded-2xl border p-4 ${fieldErrors.consent ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setFieldErrors((p) => ({ ...p, consent: undefined })); }}
                className="w-5 h-5 mt-0.5 rounded accent-emerald-600 flex-shrink-0"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  I agree to share my details <span className="text-red-500">*</span>
                </span>
                I allow Dr. CHEMISTAR Crop Care Pvt. Ltd. to store these details and contact me
                about crop advice and products. My information will be kept private and will
                never be sold or shown publicly.
              </span>
            </label>
            {fieldErrors.consent && <p className="text-xs text-red-600 font-semibold mt-2 ml-8">{fieldErrors.consent}</p>}
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-3.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Submitting is possible from ANY step - steps 2 and 3 are optional,
                so a farmer is never forced to page through them. */}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-w-[180px] bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4" />
                  {step < 3 ? 'Submit Now' : 'Complete Registration'}
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Need help? Call <a href="tel:+916351250285" className="font-bold text-emerald-700">+91 6351 250 285</a>
            {' '}or message us on WhatsApp - our team will register you.
          </p>
        </form>
      </div>
    </section>
  );
};
