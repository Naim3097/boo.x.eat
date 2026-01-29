import React from 'react';
import { Header } from '../components/layout';
import { 
  Hero, 
  PainPoints, 
  Features, 
  HowItWorks, 
  Pricing, 
  CTA, 
  Footer 
} from '../components/sections';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <PainPoints />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
