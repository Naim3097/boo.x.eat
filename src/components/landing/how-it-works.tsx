"use client";

import { motion } from "framer-motion";
import { Palette, Edit3, Package, Rocket } from "lucide-react";

const steps = [
  { number: "01", icon: Palette, title: "Create Your Page", description: "Sign up and create your custom booking page. Add your branding, menu items, and available time slots.", color: "primary" as const },
  { number: "02", icon: Edit3, title: "Customize Menu & Packages", description: "Set up your menu with photos, prices, and packages. Configure deposit requirements and cancellation policies.", color: "accent" as const },
  { number: "03", icon: Package, title: "Connect Payments", description: "Link your payment gateway to receive online payments. Customers can pay deposits or full amounts upfront.", color: "primary" as const },
  { number: "04", icon: Rocket, title: "Go Live", description: "Share your unique booking link. Accept reservations 24/7 and manage everything from your dashboard.", color: "accent" as const },
];

const colorClasses = {
  primary: { number: "text-primary-600", bg: "bg-primary-50", border: "border-primary-200", icon: "text-primary-600", line: "bg-primary-200" },
  accent: { number: "text-accent-600", bg: "bg-accent-50", border: "border-accent-200", icon: "text-accent-600", line: "bg-accent-200" },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-dark-900 mb-6">
            The Production Pipeline
          </h2>
          <p className="text-lg text-dark-500">
            From setup to cash flow in four simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {steps.map((step, index) => {
              const colors = colorClasses[step.color];
              return (
                <motion.div key={index} variants={itemVariants} className="relative">
                  {index < steps.length - 1 && (
                    <div className={`absolute left-6 top-16 w-0.5 h-12 ${colors.line}`} />
                  )}
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                      <span className={`font-bold text-sm ${colors.number}`}>{step.number}</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className={`w-5 h-5 ${colors.icon}`} />
                        <h3 className="font-bold text-dark-900">{step.title}</h3>
                      </div>
                      <p className="text-dark-500 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
                <h4 className="text-white font-bold">Template Gallery</h4>
                <p className="text-primary-100 text-sm">Choose your starting point</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Modern Cafe", type: "Cafe & Coffee", gradient: "from-primary-200 to-accent-200", selected: true },
                    { name: "Fine Dining", type: "Restaurant", gradient: "from-amber-200 to-orange-200", selected: false },
                    { name: "Food Truck", type: "Street Food", gradient: "from-green-200 to-teal-200", selected: false },
                    { name: "Bakery", type: "Bakery & Desserts", gradient: "from-pink-200 to-rose-200", selected: false },
                  ].map((template, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        template.selected ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <div className={`w-full h-20 rounded-lg mb-3 bg-gradient-to-br ${template.gradient}`} />
                      <p className="font-semibold text-dark-800 text-sm">{template.name}</p>
                      <p className="text-xs text-dark-400">{template.type}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-500 hover:to-primary-400 transition-all">
                  Use This Template
                </button>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-accent-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Setup in 5 min
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
