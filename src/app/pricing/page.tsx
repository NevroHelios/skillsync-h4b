'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen  text-white z-1">
      {/* Navigation */}
      
      
      {/* Header */}
      <header className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent mb-6">Choose Your Plan</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Elevate your professional presence with SkillSync - the ultimate developer portfolio and job platform
        </p>
      </header>
      
      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 transition-transform hover:scale-105">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-100">Free</h3>
              <div className="mt-4 flex items-end">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="mt-2 text-gray-400">Perfect for developers just starting out</p>
              
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Basic developer profile</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>GitHub repository showcase</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Browse job listings</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Limited project showcase (3 max)</span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gray-800">
              <button className="w-full py-3 px-4 bg-transparent border border-orange-400 text-orange-400 rounded-md hover:bg-orange-400 hover:text-black transition-colors">
                Get Started
              </button>
            </div>
          </div>
          
          {/* Premium Tier */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-pink-500 transition-transform hover:scale-105">
            <div className="p-1 bg-gradient-to-r from-orange-400 to-pink-500">
              <div className="bg-gray-900 p-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-100">Premium</h3>
                  <span className="px-3 py-1 text-xs font-medium bg-pink-500 text-white rounded-full">Popular</span>
                </div>
                <div className="mt-4 flex items-end">
                  <span className="text-5xl font-bold">$12</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="mt-2 text-gray-400">For serious developers building their career</p>
                
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>Enhanced developer profile</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>Unlimited project showcase</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>AI profile scoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>NFT certification for completed jobs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>Priority job application</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mr-2 flex-shrink-0" />
                    <span>Public leaderboard presence</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-8 bg-gray-800">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-md hover:opacity-90 transition-opacity">
                Subscribe Now
              </button>
            </div>
          </div>
          
          {/* Premium Plus Tier */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 transition-transform hover:scale-105">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-100">Premium Plus</h3>
              <div className="mt-4 flex items-end">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="mt-2 text-gray-400">For professional developers and hiring managers</p>
              
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>All Premium features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>AI project chatbot for HR</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Post unlimited job listings</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>StarkNet NFT job verification</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Advanced applicant filtering</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Featured placement in searches</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-orange-400 mr-2 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gray-800">
              <button className="w-full py-3 px-4 bg-transparent border border-orange-400 text-orange-400 rounded-md hover:bg-orange-400 hover:text-black transition-colors">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SkillSync?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Better than LinkedIn</h3>
            <p className="text-gray-400">More professional, tech-focused profile for developers</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">NFT Job Verification</h3>
            <p className="text-gray-400">Immutable proof of job posts and completed work</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
            <p className="text-gray-400">Smart profile scoring and project chatbot</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Public Leaderboard</h3>
            <p className="text-gray-400">Showcase your skills and compete with peers</p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Can I switch plans anytime?</h3>
            <p className="text-gray-400">Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your current billing cycle.</p>
          </div>
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-bold mb-2">How does the NFT certification work?</h3>
            <p className="text-gray-400">When you complete a job through SkillSync, both parties can mint an NFT on StarkNet that verifies the work was completed. This creates a permanent, verifiable record of your professional history.</p>
          </div>
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-bold mb-2">What is AI profile scoring?</h3>
            <p className="text-gray-400">Our AI analyzes your profile, projects, and GitHub repositories to generate personalized scores across different technical domains. These scores help employers find the right talent for their needs.</p>
          </div>
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Is there a discount for annual billing?</h3>
            <p className="text-gray-400">Yes! Save 20% when you choose annual billing on any paid plan. Contact our sales team for enterprise pricing options.</p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center border-t border-gray-800">
        <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Developer Profile?</h2>
        <p className="text-xl text-gray-300 mb-8">Join thousands of developers who have already discovered the SkillSync advantage</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-md hover:opacity-90 transition-opacity">
            Get Started for Free
          </button>
          <button className="px-8 py-3 bg-transparent border border-white text-white rounded-md hover:bg-white hover:text-black transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">SkillSync</span>
              <p className="text-gray-400 mt-2">The ultimate developer portfolio platform</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SkillSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;