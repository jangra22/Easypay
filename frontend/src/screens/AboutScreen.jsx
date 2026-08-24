import React from 'react';
import { motion } from 'framer-motion';
import { Info, ArrowLeft, Github, Globe, ShieldCheck, Heart } from 'lucide-react';

const AboutScreen = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-0 bg-white p-6 md:p-16">
      {/* Mobile-only Header */}
      <div className="md:hidden bg-white p-6 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between mb-8 -mx-6 -mt-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
           <ArrowLeft size={24} />
        </button>
        <h1 className="font-black text-xl text-gray-900 tracking-tighter uppercase">About</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-24">
          
          {/* Left Column: Branding & Mission */}
          <div className="flex-1 space-y-12">
            <div className="flex flex-col items-center md:items-start">
               <motion.div 
                 initial={{ scale: 0.8 }}
                 animate={{ scale: 1 }}
                 className="w-24 h-24 bg-primary-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary-200 text-white"
               >
                  <ShieldCheck size={48} />
               </motion.div>
               <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Easy<span className="text-primary-500">Pay</span></h2>
               <p className="text-gray-400 font-black text-sm uppercase tracking-[0.3em]">Version 1.0.0 Alpha</p>
            </div>

            <section className="space-y-6">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase border-l-4 border-primary-500 pl-6">Our Mission</h3>
               <p className="text-gray-500 text-lg font-medium leading-relaxed">
                 EasyPay aims to make supermarket shopping faster, smarter, and healthier. We believe everyone deserves a seamless checkout experience and the right to know exactly what they are consuming.
               </p>
            </section>

            <div className="hidden md:flex flex-col items-start pt-12 border-t border-gray-100">
               <div className="flex space-x-8 mb-6">
                  <button className="text-gray-300 hover:text-gray-900 transition-colors">
                     <Github size={28} />
                  </button>
                  <button className="text-gray-300 hover:text-gray-900 transition-colors">
                     <Globe size={28} />
                  </button>
               </div>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Designed with care by Google DeepMind Team</p>
            </div>
          </div>

          {/* Right Column: Process & Details */}
          <div className="flex-1 space-y-12 bg-gray-50/50 p-8 md:p-12 rounded-[3rem] border border-gray-100">
            <section>
               <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight uppercase">Scientific Approach</h3>
               <div className="space-y-8">
                  <div className="flex items-start space-x-6 group">
                     <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-primary-600 flex items-center justify-center text-lg font-black shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all">1</div>
                     <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-1">Base Analysis</h4>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">Modified Nutri-Score algorithm precisely adapted for unique dietary patterns.</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-6 group">
                     <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-primary-600 flex items-center justify-center text-lg font-black shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all">2</div>
                     <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-1">Personalized Logic</h4>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">Real-time penalty system mapped to 12+ pre-defined health conditions.</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-6 group">
                     <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-primary-600 flex items-center justify-center text-lg font-black shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all">3</div>
                     <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-1">AI Recommendation</h4>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">Advanced inference using Google Gemini to suggest healthier market alternatives.</p>
                     </div>
                  </div>
               </div>
            </section>

            <section className="bg-white p-8 rounded-[2rem] border border-gray-200/50 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-2 h-full bg-red-500/10"></div>
               <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center space-x-3 uppercase tracking-widest">
                  <Heart size={18} className="text-red-500" />
                  <span>Medical Disclaimer</span>
               </h3>
               <p className="text-gray-400 text-xs leading-relaxed font-medium italic">
                 EasyPay's health analysis feature is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding your health conditions.
               </p>
            </section>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden mt-16 pt-8 border-t border-gray-100 flex flex-col items-center space-y-8">
           <div className="flex space-x-8">
              <button className="text-gray-300">
                 <Github size={24} />
              </button>
              <button className="text-gray-300">
                 <Globe size={24} />
              </button>
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest text-center leading-loose">
             Designed with care by<br />Google DeepMind Team
           </p>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
