"use client";

import { motion } from "framer-motion";
import { AlertCircle, Clock, PieChart, Wallet } from "lucide-react";
import { GradientText } from "./gradient-text";

const painPoints = [
  {
    icon: AlertCircle,
    title: "Fragmented Tools",
    description: "Juggling between booking apps, payment systems, and POS terminals wastes your time and creates errors.",
  },
  {
    icon: Clock,
    title: "Manual Bookings",
    description: "Phone calls, WhatsApp messages, and spreadsheets for reservations lead to double bookings and no-shows.",
  },
  {
    icon: PieChart,
    title: "No Real Insights",
    description: "Without integrated data, you're flying blind on which items sell, peak hours, and customer preferences.",
  },
  {
    icon: Wallet,
    title: "Payment Delays",
    description: "Waiting days for payment settlements affects your cash flow and supplier relationships.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PainPoints() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-dark-900 mb-6">
            Running a restaurant is hard enough.
            <br />
            <GradientText variant="accent">
              Your tools shouldn&apos;t make it harder.
            </GradientText>
          </h2>
          <p className="text-lg text-dark-500">
            You&apos;re likely paying for a booking system, a payment gateway, and a POS — and none of them
            talk to each other. You waste hours on admin and lose money to inefficiency.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                <point.icon className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-3">{point.title}</h3>
              <p className="text-dark-500 text-sm leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
