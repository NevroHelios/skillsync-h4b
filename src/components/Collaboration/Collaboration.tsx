'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import CodeSpace from '../Productivity/CodeSpace'
import Discount from './Discount'
import HoverCard from '../Productivity/HoverCard'
import { motion } from "framer-motion"
import { FiBriefcase, FiMapPin } from 'react-icons/fi'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRouter } from 'next/navigation';
import UserProfileCard from '@/components/UserProfileCard';

type Props = {}

const Collaboration = (props: Props) => {
  const [hovered, setHovered] = useState<boolean>(false)
  const [hovered1, setHovered1] = useState<boolean>(false)
  const [hovered2, setHovered2] = useState<boolean>(false)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: .1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };
  return (
    <div className='max-w-[1280px] mx-auto'>
      <div className='flex md:pl-7 space-x-3 md:space-x-10'>
        <div className='flex flex-col items-center'>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }} className='relative'>
            <svg aria-hidden="true" height="24" viewBox="0 0 24 24" version="1.1" width="24" fill='currentColor' data-view-component="true" className=" text-white">
              <path d="M2.828 4.328C5.26 1.896 9.5 1.881 11.935 4.317c.024.024.046.05.067.076 1.391-1.078 2.993-1.886 4.777-1.89a6.22 6.22 0 0 1 4.424 1.825c.559.56 1.023 1.165 1.34 1.922.318.756.47 1.617.468 2.663 0 2.972-2.047 5.808-4.269 8.074-2.098 2.14-4.507 3.924-5.974 5.009l-.311.23a.752.752 0 0 1-.897 0l-.312-.23c-1.466-1.085-3.875-2.869-5.973-5.009-2.22-2.263-4.264-5.095-4.27-8.063a6.216 6.216 0 0 1 1.823-4.596Zm8.033 1.042c-1.846-1.834-5.124-1.823-6.969.022a4.712 4.712 0 0 0-1.382 3.52c0 2.332 1.65 4.79 3.839 7.022 1.947 1.986 4.184 3.66 5.66 4.752a78.214 78.214 0 0 0 2.159-1.645l-2.14-1.974a.752.752 0 0 1 1.02-1.106l2.295 2.118c.616-.52 1.242-1.08 1.85-1.672l-2.16-1.992a.753.753 0 0 1 1.021-1.106l2.188 2.02a18.963 18.963 0 0 0 1.528-1.877l-.585-.586-1.651-1.652c-1.078-1.074-2.837-1.055-3.935.043-.379.38-.76.758-1.132 1.126-1.14 1.124-2.96 1.077-4.07-.043-.489-.495-.98-.988-1.475-1.482a.752.752 0 0 1-.04-1.019c.234-.276.483-.576.745-.893.928-1.12 2.023-2.442 3.234-3.576Zm9.725 6.77c.579-1.08.92-2.167.92-3.228.002-.899-.128-1.552-.35-2.08-.22-.526-.551-.974-1.017-1.44a4.71 4.71 0 0 0-3.356-1.384c-1.66.004-3.25.951-4.77 2.346-1.18 1.084-2.233 2.353-3.188 3.506l-.351.423c.331.332.663.664.993.998a1.375 1.375 0 0 0 1.943.03c.37-.365.748-.74 1.125-1.118 1.662-1.663 4.373-1.726 6.06-.045.56.558 1.12 1.12 1.658 1.658Z"></path>
            </svg>
            <span className="absolute left-0 top-0 h-full w-full home-campaign-glowing-icon-glow-2 z-3"></span>
          </motion.div>
          <motion.div initial={{ height: 0 }} whileInView={{ height: '100%' }} transition={{ delay: 0.8 }} className=" h-full w-[3px] mt-7 rounded-md bg-gradient-to-b from-[#ffd6cc] via-[#ec6547] to-transparent" ></motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, type: 'tween' }} className='md:w-10/12 mb-24'>
          <h2 className="text-[20px] md:text-2xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{ transitionDelay: '200ms' }}>Collaboration</h2>
          <h3 className="text-[28px] md:text-[40px] max-md:leading-8 max-lg:leading-10 lg:text-5xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{ transitionDelay: '300ms' }}>
            <span className="text-[#ffa28b]">Supercharge collaboration.</span>
            We provide unlimited repositories, best-in-class version control, and the world’s most powerful open source community—so your team can work more efficiently together.
          </h3>
        </motion.div>
      </div>
      <JobProductSection />

      {/* User Dashboard Section */}
      <UserDashboardSection />

      {/* User Dashboard Cards Slider */}
      {/* <UserDashboardSliderSection /> */}

      <div className='flex justify-between items-center'>
        <div className='flex justify-between md:space-x-10 max-md:flex-col'>
          <HoverCard backgroundColor='#ffa28b' direction='flex-col' left='0'>
            <div className='md:flex flex-col flex-1 p-8 sm:p-10 lg:py-16 lg:pl-16 lg:pr-32 '>
              <p className=" text-xl md:text-2xl mb-6 font-medium text-[#7d8590]"><span className='text-white font-semibold'>on Find YourDream Job  you can see the NFTs</span>  you can apply the job from hear</p>
              <div>
                {/* <a onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} href="" className='py-1 inline-block text-xl text-white font-semibold'>
                  You can apply the job from hear 
                  <svg xmlns="http://www.w3.org/2000/svg" className={` mb-[2px] text-white transition inline-block ml-3 ease-in duration-300  ${hovered ? "translate-x-0 " : "-translate-x-1"}`} width="20" height="20" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M7.28033 3.21967C6.98744 2.92678 6.51256 2.92678 6.21967 3.21967C5.92678 3.51256 5.92678 3.98744 6.21967 4.28033L7.28033 3.21967ZM11 8L11.5303 8.53033C11.8232 8.23744 11.8232 7.76256 11.5303 7.46967L11 8ZM6.21967 11.7197C5.92678 12.0126 5.92678 12.4874 6.21967 12.7803C6.51256 13.0732 6.98744 13.0732 7.28033 12.7803L6.21967 11.7197ZM6.21967 4.28033L10.4697 8.53033L11.5303 7.46967L7.28033 3.21967L6.21967 4.28033ZM10.4697 7.46967L6.21967 11.7197L7.28033 12.7803L11.5303 8.53033L10.4697 7.46967Z"></path><path className={` text-white transition ease-in duration-150 ${hovered ? " opacity-100" : "opacity-0 "}`} stroke="currentColor" d="M1.75 8H11" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                  <div className={` ${hovered ? "w-11/12 scale-100" : "w-0 scale-0"} origin-left  transition ease-in duration-300 h-[2.5px] bg-white rounded-full`}></div>
                </a> */}
              </div>
            </div>
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ type: 'tween', duration: 0.3 }} className='overflow-hidden rounded-s-lg'>
              <img className="w-full h-auto" width="1209" height="890" loading="lazy" decoding="async" alt="" aria-hidden="true" src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745131244/WhatsApp_Image_2025-04-20_at_11.32.31_1_gteopy.png" />
            </motion.div>
          </HoverCard>
          <HoverCard backgroundColor='#ffa28b' direction='flex-col' left='-400px'>
            <div className='md:flex flex-col  flex-1 p-8 sm:p-10 lg:py-16 lg:pl-16 lg:pr-32 '>
              <p className=" text-xl md:text-2xl mb-6 font-medium text-[#7d8590]"><span className='text-white font-semibold'>if hearing manager hiar</span> you get a nft batch from there which can show the transaction </p>
              <div>
                <a onMouseEnter={() => setHovered1(true)} onMouseLeave={() => setHovered1(false)} href="" className='py-1 inline-block text-xl text-white font-semibold'>
                  Check out pull request
                  <svg xmlns="http://www.w3.org/2000/svg" className={` mb-[2px] text-white transition inline-block ml-3 ease-in duration-300  ${hovered1 ? "translate-x-0 " : "-translate-x-1"}`} width="20" height="20" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M7.28033 3.21967C6.98744 2.92678 6.51256 2.92678 6.21967 3.21967C5.92678 3.51256 5.92678 3.98744 6.21967 4.28033L7.28033 3.21967ZM11 8L11.5303 8.53033C11.8232 8.23744 11.8232 7.76256 11.5303 7.46967L11 8ZM6.21967 11.7197C5.92678 12.0126 5.92678 12.4874 6.21967 12.7803C6.51256 13.0732 6.98744 13.0732 7.28033 12.7803L6.21967 11.7197ZM6.21967 4.28033L10.4697 8.53033L11.5303 7.46967L7.28033 3.21967L6.21967 4.28033ZM10.4697 7.46967L6.21967 11.7197L7.28033 12.7803L11.5303 8.53033L10.4697 7.46967Z"></path><path className={` text-white transition ease-in duration-150 ${hovered1 ? " opacity-100" : "opacity-0 "}`} stroke="currentColor" d="M1.75 8H11" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                  <div className={` ${hovered1 ? "w-11/12 scale-100" : "w-0 scale-0"} origin-left  transition ease-in duration-300 h-[2.5px] bg-white rounded-full`}></div>
                </a>
              </div>
            </div>
            <div className='overflow-hidden rounded-s-lg'>
              <motion.img initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ type: 'tween', duration: 0.3 }} className="w-full h-auto " width="1208" height="764" loading="lazy" decoding="async" alt="" aria-hidden="true" src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745136631/Screenshot_2025-04-20_133806_j1z7kg.png" />
            </div>
          </HoverCard>
        </div>
      </div>

      
    {/* users dashboard */}


      <motion.div initial={{ height: 0 }} whileInView={{ height: '160px' }} transition={{ delay: 0.2 }} className=" md:ml-10 ml-3 h-[160px] mt-[-20px] w-[3px] rounded-md bg-gradient-to-b from-transparent via-[#797ef9] to-[#abb4ff]" ></motion.div>
    </div>
  )
}

export default Collaboration

function JobProductSection() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch("/api/jobs/public")
      .then(res => res.json())
      .then(data => setJobs(Array.isArray(data) ? data.slice(0, 3) : [])) // Only 3 cards
      .catch(() => setJobs([]));
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Show 3 cards at once
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2500,
    pauseOnHover: true,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="my-12">
      {/* <h2 className="text-3xl font-bold text-white mb-2">Find Your <span>Dream Job</span></h2> */}
      <h3 className="text-[28px] md:text-[40px] max-md:leading-8 max-lg:leading-10 lg:text-5xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{ transitionDelay: '300ms' }}>
        Find Your<span className="text-[#ffa28b]">Dream Job.</span></h3>
      <p className="text-lg text-[#7d8590] mb-6">Browse through our curated list of available positions in tech and digital industries</p>
      {/* <h2 className="text-2xl font-semibold text-white mb-6">Job Product</h2> */}
      <Slider {...settings}>
        {jobs.length === 0 ? (
          <div className="col-span-4 text-center text-gray-400 py-8">No jobs found.</div>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="px-2">
              <div className="flex flex-col md:flex-row bg-gradient-to-br from-[#23272e] via-[#161b22] to-[#23272e] border border-[#30363d] rounded-2xl shadow-xl hover:border-[#ffa28b] focus:outline-none focus:ring-2 focus:ring-[#ffa28b] focus:ring-offset-2 transition min-h-[360px] overflow-hidden group relative">
                {/* Left: Job Info */}
                <div className="flex-1 flex flex-col p-8 sm:p-10 lg:py-14 lg:pl-14 lg:pr-8">
                  <h2 className="text-2xl font-bold text-white truncate mb-2 drop-shadow-lg" title={job.title}>{job.title}</h2>
                  <p className="text-[#ffa28b] mb-1 flex items-center gap-1 text-base font-medium"><FiBriefcase /> {job.company}</p>
                  <p className="text-[#7d8590] mb-3 flex items-center gap-1 text-base"><FiMapPin /> {job.location}</p>
                  <p className="text-base text-[#c9d1d9] mb-4 line-clamp-3 leading-relaxed">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.techStack?.slice(0, 4).map((tech) => (
                      <span key={tech} className="bg-[#23272e] border border-[#ffa28b] text-xs text-[#ffa28b] px-2 py-1 rounded-full font-semibold shadow-sm">{tech}</span>
                    ))}
                    {job.techStack?.length > 4 && (
                      <span className="text-gray-500 text-xs py-1">+{job.techStack.length - 4} more</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 flex justify-between mt-auto">
                    <span>{job.employmentType} {job.experienceLevel ? `• ${job.experienceLevel}` : ''}</span>
                    <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/jobs/${job._id}`} className="mt-6 inline-block text-base text-[#161b22] font-bold py-2 px-5 rounded bg-[#ffa28b] hover:bg-[#ffbfa3] transition w-fit shadow-lg">View Details</Link>
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-2xl pointer-events-none bg-gradient-to-br from-[#ffa28b33] via-transparent to-transparent blur-lg opacity-60 group-hover:opacity-90 transition" />
              </div>
            </div>
          ))
        )}
      </Slider>
      <div className="flex justify-end mt-6">
        <Link href="/jobs/dashboard" className="px-6 py-2 rounded bg-[#ffa28b] text-[#161b22] font-semibold hover:bg-[#ffbfa3] transition">
          Go to all Products page
        </Link>
      </div>
    </div>
  );
}

function UserDashboardSection() {
  return (
    <div className="my-12">
      <h3 className="text-[28px] md:text-[40px] max-md:leading-8 max-lg:leading-10 lg:text-5xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{ transitionDelay: '300ms' }}>
        Your <span className="text-[#ffa28b]">Dashboard</span>
      </h3>
      <p className="text-lg text-[#7d8590] mb-6">
        Access your personalized dashboard to manage applications, track progress, and update your profile.
      </p>
      <div className="flex justify-end mt-6">
        <Link href="/dashboard" className="px-6 py-2 rounded bg-[#ffa28b] text-[#161b22] font-semibold hover:bg-[#ffbfa3] transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function UserDashboardSliderSection() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setUsers([]));
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2500,
    pauseOnHover: true,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 3 }
      },
      {
        breakpoint: 900,
        settings: { slidesToShow: 2 }
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 }
      }
    ],
  };

  return (
    <div className="my-12">
      <h3 className="text-[28px] md:text-[40px] max-md:leading-8 max-lg:leading-10 lg:text-5xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{ transitionDelay: '300ms' }}>
        Featured <span className="text-[#ffa28b]">Users</span>
      </h3>
      <p className="text-lg text-[#7d8590] mb-6">Meet some of our active users and explore their profiles.</p>
      <Slider {...settings}>
        {users.length === 0 ? (
          <div className="col-span-4 text-center text-gray-400 py-8">No users found.</div>
        ) : (
          users.map(user => (
            <div key={user._id} className="px-2">
              <div className="group relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 rounded-2xl pointer-events-none bg-gradient-to-br from-[#ffa28b33] via-transparent to-transparent blur-lg opacity-60 group-hover:opacity-90 transition z-0" />
                {/* Make the card clickable and link to /profile?email=... */}
                <Link
                  href={`/profile?email=${encodeURIComponent(user.email)}`}
                  className="relative z-10 block focus:outline-none"
                  tabIndex={0}
                >
                  <div className="flex flex-col bg-gradient-to-br from-[#23272e] via-[#161b22] to-[#23272e] border border-[#30363d] rounded-2xl shadow-xl hover:border-[#ffa28b] focus:ring-2 focus:ring-[#ffa28b] focus:ring-offset-2 transition min-h-[360px] overflow-hidden p-8">
                    <UserProfileCard user={{
                      ...user,
                      role: user.email === 'admin@admin.com'
                        ? 'admin'
                        : user.email.endsWith('@hr.com')
                          ? 'hr'
                          : user.email.endsWith('@gmail.com')
                            ? 'user'
                            : user.role
                    }} />
                  </div>
                </Link>
              </div>
            </div>
          ))
        )}
      </Slider>
      <div className="flex justify-end mt-6">
        <Link href="/dashboard" className="px-6 py-2 rounded bg-[#ffa28b] text-[#161b22] font-semibold hover:bg-[#ffbfa3] transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}