import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Crown, Building2 } from 'lucide-react';
import { Button, Badge, GradientText } from '../ui';

const plans = [
  {
    name: 'Starter',
    subtitle: 'Free Forever',
    price: 'RM 0',
    period: '/month',
    description: 'Perfect for small vendors just getting started with online bookings.',
    icon: Sparkles,
    color: 'gray',
    popular: false,
    features: [
      { text: 'Custom booking page', included: true },
      { text: 'Up to 50 bookings/month', included: true },
      { text: 'Menu display', included: true },
      { text: 'Email notifications', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Payment integration', included: false },
      { text: 'POS system', included: false },
      { text: 'Inventory management', included: false },
    ],
    cta: 'Start Free',
    ctaVariant: 'secondary' as const,
  },
  {
    name: 'Professional',
    subtitle: 'Most Popular',
    price: 'RM 99',
    period: '/month',
    description: 'Full POS integration for growing restaurants ready to scale.',
    icon: Crown,
    color: 'primary',
    popular: true,
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Unlimited bookings', included: true },
      { text: 'Payment gateway integration', included: true },
      { text: 'Complete POS system', included: true },
      { text: 'Tablet POS interface', included: true },
      { text: 'Inventory management', included: true },
      { text: 'Finance & accounting', included: true },
      { text: 'Receipt printing', included: true },
    ],
    cta: 'Start 14-Day Trial',
    ctaVariant: 'primary' as const,
  },
  {
    name: 'Enterprise',
    subtitle: 'Premium Setup',
    price: 'Custom',
    period: '',
    description: 'End-to-end setup and support for multi-location businesses.',
    icon: Building2,
    color: 'accent',
    popular: false,
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'Multi-location support', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'White-label options', included: true },
      { text: 'On-site training', included: true },
      { text: 'Priority support 24/7', included: true },
      { text: 'Custom development', included: true },
    ],
    cta: 'Contact Sales',
    ctaVariant: 'accent' as const,
  },
];

const colorClasses = {
  gray: {
    bg: 'bg-white',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  primary: {
    bg: 'bg-gradient-to-b from-primary-50 to-white',
    border: 'border-primary-200',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
  },
  accent: {
    bg: 'bg-gradient-to-b from-accent-50 to-white',
    border: 'border-accent-200',
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
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

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="section-padding bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-dark-900 mb-6">
            Simple, Transparent{' '}
            <GradientText variant="primary">Pricing</GradientText>
          </h2>
          <p className="text-lg text-dark-500">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => {
            const colors = colorClasses[plan.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative rounded-3xl ${colors.bg} border-2 ${colors.border} p-8 ${
                  plan.popular ? 'shadow-2xl scale-105 z-10' : 'shadow-lg'
                } transition-all duration-300 hover:shadow-xl`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="primary" className="shadow-lg">
                      ⭐ Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className={`w-7 h-7 ${colors.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-900">{plan.name}</h3>
                  <p className="text-sm text-dark-400">{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-4xl font-extrabold text-dark-900">{plan.price}</span>
                  <span className="text-dark-400">{plan.period}</span>
                  <p className="text-sm text-dark-500 mt-2">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-dark-700' : 'text-dark-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button variant={plan.ctaVariant} className="w-full">
                  {plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Money-back guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-dark-400 text-sm">
            💳 No credit card required for free tier • 🔒 Cancel anytime • 💰 14-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
