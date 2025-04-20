'use client'
import React from 'react' // Removed useState as it's no longer used
import Link from "next/link"; // Import Link
import Image from "next/image"; // Import next/image
import { motion } from 'framer-motion';

// Extend the session type to include 'role' if needed, or use a simpler type
type UserWithRole = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string; // Assuming role might be part of your session
};

type SessionWithRole = {
  user?: UserWithRole;
} | null; // Allow session to be null

type HeroProps = {
  session: SessionWithRole; // Add session prop
};

const Hero = ({ session }: HeroProps) => { // Destructure session from props

  return (
    <div className='relative max-w-[1280px] lg:pt-32 md:px-10 mx-auto  overflow-hidden'> {/* Ensure this container is the positioning context */}
        {/* Video Background - Positioned fixed to cover the full screen */}
      
          {/* <video 
            className="absolute inset-0 w-full h-full object-cover z-0 filter blur-xs" // Changed absolute to fixed
            autoPlay 
            loop 
            muted 
            playsInline
            preload="metadata"
            // onLoadedData={handleVideoLoad}
            poster="https://res.cloudinary.com/dlrlet9fg/image/upload/v1742230891/video-poster.jpg"
          >
            <source 
              src="https://res.cloudinary.com/dlrlet9fg/video/upload/v1745090293/3129957-uhd_3840_2160_25fps_2_1_1_1_ohss3y.mp4" 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video> */}

        {/* Dark Overlay */}
        <div className="absolute  inset-0 w-full h-full bg-black/10 z-1"></div>

        {/* Gradient Overlay for bottom shadow effect - Adjusted z-index */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 to-transparent z-2"></div>

        {/* Ensure drone image is above the video and overlays - Adjusted z-index */}
        <Image 
            className='absolute hero-drone  top-20 w-1/4 h-auto right-0 xl:right-0 z-10' /* Kept z-10, should be above dark overlay (z-1) and gradient (z-2) but below content (z-10) - let's adjust content z-index */
            width={500} 
            height={326} 
            src="https://github.githubassets.com/images/modules/site/home-campaign/hero-drone.webp" 
            alt="Hero Drone" 
            priority
        />
        {/* Ensure the main content flex container is positioned relatively and above overlays - Adjusted z-index */}
        <div className='relative flex z-20'> {/* Increased z-index to 20 */}
            {/* Ensure the decorative lines container is positioned relatively and above overlays - Adjusted z-index */}
            <div className='relative z-20'> {/* Increased z-index to 20 */}
                {/* Replaced img with Image for lines-hero.svg */}
                <Image 
                    aria-hidden="true" 
                    className='' 
                    src="https://github.githubassets.com/images/modules/site/home-campaign/lines-hero.svg" 
                    width={437} 
                    height={637} 
                    alt="Decorative lines" 
                />
                <div className='mx-auto my-3 '>
                    <span className='relative z-[11]'>
                    <svg aria-hidden="true" height="24" viewBox="0 0 24 24" fill='currentColor' version="1.1" width="24" data-view-component="true" className=" text-white">
                        <path d="M15.22 4.97a.75.75 0 0 1 1.06 0l6.5 6.5a.75.75 0 0 1 0 1.06l-6.5 6.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L21.19 12l-5.97-5.97a.75.75 0 0 1 0-1.06Zm-6.44 0a.75.75 0 0 1 0 1.06L2.81 12l5.97 5.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.5-6.5a.75.75 0 0 1 0-1.06l6.5-6.5a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                    <span className="absolute left-0 top-0 w-6 h-full  home-campaign-glowing-icon-glow " style={{ backgroundColor: 'var(--mktg-accent-primary)', filter: 'blur(17px)' }}></span>
                    </span>
                </div>
                <div style={{ background: 'linear-gradient(#d2a8ff, #a371f7 10%, #196c2e 70%, #2ea043 80%, #56d364)', marginLeft:'11px' }} className= " max-md:w-[2px] w-[3px] h-[450px] max-md:h-[650px] max-sm:h-[750px] max-ssm:h-[900px] max-sssm:h-[1150px] line rounded-md"></div>
            </div>
            {/* Text content container already has relative and z-10, which is good */}
            <div className= ' absolute pt-32 mt-28 max-md:px-4 ml-4 md:ml-12'>
        
                 {/* Replaced img with Image for H4B Logo */}
                 <Image
                    src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745079464/Layer_1_sbyjkd.png"
                    alt="H4B Logo"
                    width={440} // Adjusted width as per user prompt
                    height={100}
                    className="mt-5 mb-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" // Removed second drop-shadow to fix lint error
                 />
                <p className="relative z-1 text-2xl md:text-3xl lg:text-4xl font-medium leading-tight md:leading-snug lg:leading-tight mb-2 md:mb-5 lg:w-10/12 text-white/50 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"> {/* Changed text color to cyan-300, kept glow and dark shadow */}
                The Future of Professional Verification & Recruitment
                </p>
                <div className='flex lg:w-11/12 md:space-x-5 max-md:flex-col'>
                    {/* Content inside this div if any */}
                </div>

                <div className="mt-10"> {/* Increased margin-top */}
                    {!session?.user && (
                    <Link
                        href="/auth/signin"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out text-lg inline-block" // Modernized button style
                    >
                        Get Started
                    </Link>
                    )}
                    {session?.user && (
                    <Link
                        href="/profile"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out text-lg inline-block" // Modernized button style
                    >
                        Go to Profile
                    </Link>
                    )}
                </div>

                <div className='md:my-32 my-24'>
                    {/* <p className="text-[16px] leading-[24px] text-[#7d8590]">Trusted by the world&apos;s leading&nbsp;organizations&nbsp;↘︎</p> */}
                    {/* Correctly commented out or removed the logo section */}

                    <div className='md:w-10/12 mb-24'>
                {/* <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.4, duration:0.3}} viewport={{once:false}} className="text-[20px] md:text-2xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{transitionDelay: '200ms'}}>Productivity</motion.div>   */}
                <motion.h3 initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.5,duration:0.3}} viewport={{once:false}} className="text-[28px] md:text-[40px] max-md:leading-8 max-lg:leading-10 lg:text-5xl mb-7 font-medium text-white js-build-in-item build-in-slideX-left build-in-animate" style={{transitionDelay: '300ms'}}>
                    <span className="text-[#7ee787]">A more professional alternative to LinkedIn  </span>
                    with verifiable job posts and internships via NFTs, preventing fraud, and featuring a public leaderboard to boost competitiveness.
                </motion.h3>
            </div>
                </div>
            </div> {/* Closing tag for the text content container */}
        </div> {/* Closing tag for the main flex container */}
    </div> /* Closing tag for the outermost container */
  )
}

export default Hero