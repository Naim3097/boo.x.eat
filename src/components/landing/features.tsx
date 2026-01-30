"use client";

import { motion } from "framer-motion";
import { GradientText } from "./gradient-text";
import {
  Calendar,
  CreditCard,
  BarChart3,
  Tablet,
  Package,
  FileText,
  Zap,
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Online Booking", description: "Custom booking page with real-time availability, table management, and automated confirmations.", color: "primary" as const },
  { icon: CreditCard, title: "Integrated Payments", description: "Accept payments online with multiple gateways. Instant notifications and faster settlements.", color: "accent" as const },
  { icon: Tablet, title: "Tablet POS", description: "Full-featured point of sale that syncs with your bookings. Works offline, syncs when online.", color: "primary" as const },
  { icon: Package, title: "Inventory Management", description: "Track stock levels in real-time. Get alerts when items run low. Reduce waste and theft.", color: "accent" as const },
  { icon: BarChart3, title: "Analytics Dashboard", description: "See what sells, peak hours, customer trends. Data-driven decisions for growth.", color: "primary" as const },
  { icon: FileText, title: "Finance & Receipts", description: "Automated invoicing, receipt printing, and financial reports. Simplify your accounting.", color: "accent" as const },
];

const colorClasses = {
  primary: { bg: "bg-primary-50", hoverBg: "group-hover:bg-primary-100", icon: "text-primary-600", border: "border-primary-100" },
  accent: { bg: "bg-accent-50", hoverBg: "group-hover:bg-accent-100", icon: "text-accent-600", border: "border-accent-100" },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-dark-900 mb-6">
            <GradientText variant="primary">boo.x.eat</GradientText> unifies the
            <br />
            entire lifecycle
          </h2>
          <p className="text-lg text-dark-500">
            We combined professional-grade booking tools with a full POS system.
            It&apos;s not just a reservation app — it&apos;s a complete revenue engine with faster settlements and zero bloat.
          </p>
        </motion.div>

        {/* 3 Connected Blocks */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20"
        >
          {[
            { icon: Calendar, title: "Online Booking", sub: "Reserve & Pay", color: "from-primary-100 to-primary-50", borderColor: "border-primary-200", iconColor: "text-primary-600" },
            { icon: Tablet, title: "POS System", sub: "Serve & Sell", color: "from-accent-100 to-accent-50", borderColor: "border-accent-200", iconColor: "text-accent-600" },
            { icon: BarChart3, title: "Analytics", sub: "Track & Grow", color: "from-primary-100 to-accent-50", borderColor: "border-primary-200", iconColor: "text-primary-600" },
          ].map((block, i) => (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && (
                <div className="hidden md:flex items-center">
                  <div className="w-12 h-1 bg-gradient-to-r from-primary-300 to-accent-300 rounded-full" />
                  <Zap className="w-6 h-6 text-accent-500 mx-2" />
                  <div className="w-12 h-1 bg-gradient-to-r from-accent-300 to-accent-400 rounded-full" />
                </div>
              )}
              <div className="group">
                <div className={`w-48 h-48 bg-gradient-to-br ${block.color} rounded-3xl border-2 ${block.borderColor} flex flex-col items-center justify-center p-6 transition-transform group-hover:-translate-y-2`}>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                    <block.icon className={`w-8 h-8 ${block.iconColor}`} />
                  </div>
                  <p className="font-bold text-dark-800 text-center">{block.title}</p>
                  <p className="text-sm text-dark-400 text-center">{block.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color];
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`group bg-white rounded-2xl p-6 border ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} ${colors.hoverBg} flex items-center justify-center mb-5 transition-colors`}>
                  <feature.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-3">{feature.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
