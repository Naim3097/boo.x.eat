"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Utensils, Calendar, CreditCard } from "lucide-react";
import { GradientText } from "./gradient-text";

export function Hero() {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-white">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 md:pt-24 lg:pt-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full font-medium bg-primary-100 text-primary-700 px-3 py-1 text-sm mb-6">
              🚀 Seamless F&B Management
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-dark-900 leading-tight mb-6"
          >
            <span className="block">Book &middot; Serve &middot; Grow</span>
            <GradientText variant="mixed" className="block mt-2">
              All in One Platform
            </GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-dark-500 max-w-2xl mx-auto mb-8"
          >
            Stop juggling multiple tools. The only F&B platform with online
            bookings, integrated payments, and full POS system — all designed for
            restaurants that want to grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg text-white font-semibold bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400 rounded-full shadow-lg hover:shadow-glow transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Create Your Page Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/demo-restaurant"
              className="inline-flex items-center justify-center px-8 py-4 text-lg text-dark-800 font-semibold bg-white border-2 border-gray-200 hover:border-primary-300 hover:text-primary-700 rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Play className="mr-2 w-5 h-5" />
              View Demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-dark-400 text-sm"
          >
            {["Free tier available", "No credit card required", "Setup in 5 minutes"].map((text) => (
              <span key={text} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Hero Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 relative"
        >
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-dark-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    booxeat.com/kedaikakros
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-accent-50 p-8 min-h-[400px]">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark-900">Kedai Kakros</h3>
                      <p className="text-sm text-dark-400">Malaysian Cuisine</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-dark-700">Book a Table</p>
                        <p className="text-xs text-dark-400">Select date & time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent-50 rounded-lg">
                      <Utensils className="w-5 h-5 text-accent-600" />
                      <div>
                        <p className="text-sm font-medium text-dark-700">View Menu</p>
                        <p className="text-xs text-dark-400">Browse packages & dishes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-dark-700">Pay Online</p>
                        <p className="text-xs text-dark-400">Secure payment gateway</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg font-semibold">
                    Book Now
                  </button>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -left-8 top-1/4 animate-float hidden lg:block">
              <div className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-800">Booking Confirmed!</p>
                  <p className="text-xs text-dark-400">Table for 4 at 7:00 PM</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 top-1/3 animate-float hidden lg:block" style={{ animationDelay: "2s" }}>
              <div className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-800">Payment Received</p>
                  <p className="text-xs text-dark-400">RM 125.00</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
