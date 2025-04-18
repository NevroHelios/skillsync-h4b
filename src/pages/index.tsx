// File: pages/index.tsx
import Head from 'next/head';
import { useState } from 'react';
import { FiUser, FiDatabase, FiMessageCircle, FiDollarSign, FiBarChart2, FiStar } from 'react-icons/fi';
import { HiOutlineUpload } from 'react-icons/hi';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode, SiCodeforces } from 'react-icons/si';
import "../app/globals.css";

// Define types for form data
interface ProfileFormData {
  github: string;
  linkedin: string;
  leetcode: string;
  codeforces: string;
  resume: File | null;
}

export default function Home() {
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    github: '',
    linkedin: '',
    leetcode: '',
    codeforces: '',
    resume: null,
  });

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically:
    // 1. Create FormData object
    // 2. Send data to your API endpoint
    // 3. Redirect to results page or show loading state
    
    console.log('Form submitted:', formData);
    // Implementation for API call would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>DevProfile AI - Developer Profile Analyzer</title>
        <meta name="description" content="AI-powered developer profile analyzer for optimizing your technical presence" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-indigo-600 text-xl font-bold flex items-center">
                <FiUser className="mr-2" />
                DevProfile AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-indigo-600 font-medium">How It Works</a>
              <a href="#analyzer" className="text-gray-700 hover:text-indigo-600 font-medium">Analyzer</a>
              <a href="#get-started" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Elevate Your <span className="text-indigo-600">Developer Profile</span> With AI Analytics
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Unlock insights into your technical skills and digital presence to stand out to recruiters with our AI-powered profile analyzer.
              </p>
              <div className="mt-8 flex space-x-4">
                <a href="#analyzer" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition">
                  Analyze Your Profile
                </a>
                <a href="#features" className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md font-medium hover:bg-indigo-50 transition">
                  Learn More
                </a>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">95%</p>
                  <p className="text-gray-500">Accuracy Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-indigo-600">10K+</p>
                  <p className="text-gray-500">Profiles Analyzed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-indigo-600">85%</p>
                  <p className="text-gray-500">Career Growth</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src="/hero-image.svg" 
                alt="Developer Profile Dashboard" 
                className="max-w-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Comprehensive Profile Analysis</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform evaluates multiple aspects of your developer profile to provide actionable insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiDatabase className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Multi-Platform Data Aggregation</h3>
              <p className="mt-2 text-gray-600">
                Automatically scrapes and verifies data from GitHub, LinkedIn, LeetCode, CodeForces, and more.
              </p>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiBarChart2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Performance Scoring</h3>
              <p className="mt-2 text-gray-600">
                Analyzes coding contributions, project diversity, problem-solving skills, and professional engagement.
              </p>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiMessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Actionable Insights</h3>
              <p className="mt-2 text-gray-600">
                Provides a detailed breakdown of strengths, weaknesses, and actionable recommendations.
              </p>
            </div>
            
            {/* Feature Card 4 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiDollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Recruiter Readiness Score</h3>
              <p className="mt-2 text-gray-600">
                Generates a hiring potential score to help you optimize your digital presence for recruiters.
              </p>
            </div>
            
            {/* Feature Card 5 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiBarChart2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Peer Comparison</h3>
              <p className="mt-2 text-gray-600">
                Benchmark your profile against top developers and peers in your field to identify areas for growth.
              </p>
            </div>
            
            {/* Feature Card 6 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-md text-indigo-600 mb-4">
                <FiStar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Career Pathway Suggestions</h3>
              <p className="mt-2 text-gray-600">
                AI-generated career recommendations based on your skills and industry trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered profile analyzer works in three simple steps to give you valuable insights about your developer profile.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Connect Your Profiles</h3>
              <p className="mt-2 text-gray-600">
                Enter your GitHub, LinkedIn, LeetCode, and other platform usernames, and upload your resume.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI Analysis</h3>
              <p className="mt-2 text-gray-600">
                Our AI engine aggregates data from all platforms and analyzes your technical skills and digital presence.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Get Personalized Insights</h3>
              <p className="mt-2 text-gray-600">
                Receive a detailed report with actionable recommendations to enhance your developer profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analyzer Form Section */}
      <section id="analyzer" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Start Your Profile Analysis</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Connect your developer profiles and let our AI analyze your digital presence.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
            <h3 className="text-2xl font-bold text-center mb-8">Profile Analyzer</h3>
            
            <form onSubmit={handleSubmit}>
              {/* GitHub Input */}
              <div className="mb-6">
                <label htmlFor="github" className="block text-gray-700 font-medium mb-2">
                  GitHub Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGithub className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    placeholder="username"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* LinkedIn Input */}
              <div className="mb-6">
                <label htmlFor="linkedin" className="block text-gray-700 font-medium mb-2">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLinkedin className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* LeetCode Input */}
              <div className="mb-6">
                <label htmlFor="leetcode" className="block text-gray-700 font-medium mb-2">
                  LeetCode Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SiLeetcode className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="leetcode"
                    name="leetcode"
                    value={formData.leetcode}
                    onChange={handleInputChange}
                    placeholder="username"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* CodeForces Input */}
              <div className="mb-6">
                <label htmlFor="codeforces" className="block text-gray-700 font-medium mb-2">
                  CodeForces Username (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SiCodeforces className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="codeforces"
                    name="codeforces"
                    value={formData.codeforces}
                    onChange={handleInputChange}
                    placeholder="username"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* Resume Upload */}
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">
                  Resume Upload
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition" onClick={() => document.getElementById('resume')?.click()}>
                  <HiOutlineUpload className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-700">Drag and drop your resume or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, DOC</p>
                  <input 
                    type="file" 
                    id="resume" 
                    name="resume" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </div>
                {formData.resume && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: {formData.resume.name}
                  </p>
                )}
              </div>
              
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Analyze My Profile
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Boost Your Developer Career?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join thousands of developers who have improved their digital presence with DevProfile AI.
          </p>
          <a 
            href="#analyzer" 
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-md font-medium hover:bg-gray-50 transition"
          >
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4">DevProfile AI</h3>
              <p className="text-gray-300 mb-4">
                Our AI-powered platform helps developers optimize their digital presence to stand out in the job market.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-300 hover:text-white transition">Features</a></li>
                  <li><a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">Pricing</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition">About Us</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">Careers</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            &copy; {new Date().getFullYear()} DevProfile AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}