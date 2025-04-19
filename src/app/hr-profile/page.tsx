"use client";
// import { useState, useEffect } from "react";
import { JobPostingForm } from "@/components/JobPostingForm";
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link'; // For Job Posting link
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { HRProfileClientData, IHRProfile } from '@/models/HRProfile'; // Import types

interface Job {
  _id: string;
  title: string;
  company: string;
  skills: string[];
  experience: string;
  wallet: string;
  matchedDevs?: Developer[];
}

export default function HRProfilePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch HR's jobs on component mount
  useEffect(() => {
    // In a complete implementation, we would use the connected wallet address
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  // Fetch matched developers for a specific job
  const fetchMatches = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matching?jobId=${jobId}`);
      if (res.ok) {
        const matchedDevs = await res.json();
        const job = jobs.find(j => j._id === jobId);
        if (job) {
          const updatedJob = { ...job, matchedDevs };
          setSelectedJob(updatedJob);
          setJobs(jobs.map(j => j._id === jobId ? updatedJob : j));
        }
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for a matched developer
  const getChartData = (dev: Developer, job: Job) => {
    const jobSkills = job.skills;
    const devSkills = Object.keys(dev.skills);
    
    // Combine all skills from job and developer
    const allSkills = [...new Set([...jobSkills, ...devSkills])];
    
    const data = {
      labels: allSkills,
      datasets: [
        {
          label: 'Job Requirements',
          data: allSkills.map(skill => jobSkills.includes(skill) ? 100 : 0),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
        {
          label: 'Developer Skills',
          data: allSkills.map(skill => dev.skills[skill] || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ]
    };
    
    return data;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">HR Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <JobPostingForm />
        </div>
        
        <div>
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Your Job Postings</h2>
            
            {loading ? (
              <p>Loading...</p>
            ) : jobs.length === 0 ? (
              <p>No jobs posted yet. Use the form to post your first job.</p>
            ) : (
              <ul className="space-y-3">
                {jobs.map(job => (
                  <li 
                    key={job._id} 
                    className={`p-3 rounded ${selectedJob?._id === job._id ? 'bg-indigo-900' : 'bg-gray-800'} hover:bg-indigo-800 cursor-pointer`}
                    onClick={() => fetchMatches(job._id)}
                  >
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm">{job.company} • {job.experience}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.skills.map(skill => (
                        <span key={skill} className="px-2 py-1 text-xs bg-blue-900 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {job.matchedDevs && (
                      <div className="text-xs mt-2 text-green-400">
                        {job.matchedDevs.length} matched developers
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {selectedJob?.matchedDevs && (
        <div className="mt-8 bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            Matched Developers for {selectedJob.title}
          </h2>
          
          {selectedJob.matchedDevs.length === 0 ? (
            <p>No matching developers found for this job.</p>
          ) : (
            <div className="space-y-6">
              {selectedJob.matchedDevs.map(dev => (
                <div key={dev.wallet} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {dev.githubData?.name || 'Anonymous Developer'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Wallet: {dev.wallet.slice(0, 6)}...{dev.wallet.slice(-4)}
                      </p>
                      {dev.github && (
                        <p className="text-sm">
                          GitHub: {dev.github}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">
                        {Math.round(dev.matchScore)}% Match
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-64">
                    <Bar 
                      data={getChartData(dev, selectedJob)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}