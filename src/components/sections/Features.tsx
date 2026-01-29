import React from 'react';
import { motion } from 'framer-motion';
import { GradientText } from '../ui';
import { 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Tablet, 
  Package, 
  FileText,
  Users,
  Globe,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Online Booking',
    description: 'Custom booking page with real-time availability, table management, and automated confirmations.',
    color: 'primary',
  },
  {
    icon: CreditCard,
    title: 'Integrated Payments',
    description: 'Accept payments online with multiple gateways. Instant notifications and faster settlements.',
    color: 'accent',
  },
  {
    icon: Tablet,
    title: 'Tablet POS',
    description: 'Full-featured point of sale that syncs with your bookings. Works offline, syncs when online.',
    color: 'primary',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels in real-time. Get alerts when items run low. Reduce waste and theft.',
    color: 'accent',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'See what sells, peak hours, customer trends. Data-driven decisions for growth.',
    color: 'primary',
  },
  {
    icon: FileText,
    title: 'Finance & Receipts',
    description: 'Automated invoicing, receipt printing, and financial reports. Simplify your accounting.',
    color: 'accent',
  },
];

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    hoverBg: 'group-hover:bg-primary-100',
    icon: 'text-primary-600',
    border: 'border-primary-100',
  },
  accent: {
    bg: 'bg-accent-50',
    hoverBg: 'group-hover:bg-accent-100',
    icon: 'text-accent-600',
    border: 'border-accent-100',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const Features: React.FC = () => {
  return (
    <section id="features" className="section-padding bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      
      <div className="container-custom relative z-10">
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
            It's not just a reservation app — it's a complete revenue engine with faster settlements and zero bloat.
          </p>
        </motion.div>

        {/* Feature illustration - 3 connected blocks like nexova */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20"
        >
          {/* Block 1 - Booking */}
          <div className="relative group">
            <div className="w-48 h-48 bg-gradient-to-br from-primary-100 to-primary-50 rounded-3xl border-2 border-primary-200 flex flex-col items-center justify-center p-6 transition-transform group-hover:-translate-y-2">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <p className="font-bold text-dark-800 text-center">Online Booking</p>
              <p className="text-sm text-dark-400 text-center">Reserve & Pay</p>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden md:flex items-center">
            <div className="w-12 h-1 bg-gradient-to-r from-primary-300 to-accent-300 rounded-full" />
            <Zap className="w-6 h-6 text-accent-500 mx-2" />
            <div className="w-12 h-1 bg-gradient-to-r from-accent-300 to-accent-400 rounded-full" />
          </div>

          {/* Block 2 - POS */}
          <div className="relative group">
            <div className="w-48 h-48 bg-gradient-to-br from-accent-100 to-accent-50 rounded-3xl border-2 border-accent-200 flex flex-col items-center justify-center p-6 transition-transform group-hover:-translate-y-2">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <Tablet className="w-8 h-8 text-accent-600" />
              </div>
              <p className="font-bold text-dark-800 text-center">POS System</p>
              <p className="text-sm text-dark-400 text-center">Serve & Sell</p>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden md:flex items-center">
            <div className="w-12 h-1 bg-gradient-to-r from-accent-400 to-primary-300 rounded-full" />
            <Zap className="w-6 h-6 text-primary-500 mx-2" />
            <div className="w-12 h-1 bg-gradient-to-r from-primary-300 to-primary-400 rounded-full" />
          </div>

          {/* Block 3 - Analytics */}
          <div className="relative group">
            <div className="w-48 h-48 bg-gradient-to-br from-primary-100 to-accent-50 rounded-3xl border-2 border-primary-200 flex flex-col items-center justify-center p-6 transition-transform group-hover:-translate-y-2">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <p className="font-bold text-dark-800 text-center">Analytics</p>
              <p className="text-sm text-dark-400 text-center">Track & Grow</p>
            </div>
          </div>
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
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
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
};

export default Features;
