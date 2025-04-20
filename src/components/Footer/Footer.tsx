import React from 'react'

type Props = {}

const Footer = (props: Props) => {
  return (
    <div className='footer relative pt-14 break-words '>
      <div className='max-w-[1280px] mx-auto relative z-[2] overflow-hidden'>
        <div className='flex flex-col lg:flex-row py-10 mb-8 space-x-6 px-4'>
          <div className='mb-12 px-2 flex items-center'>
            <a href="/" aria-label="Go to homepage">
              <img
                src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745079464/Layer_1_sbyjkd.png"
                alt="H4B Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </a>
          </div>
        </div>
      </div>
      <div className='bg-[#161b22]'>
        <div className='max-w-[1280px] mx-auto text-[12px] md:flex flex-row-reverse py-6 justify-between items-center px-4'>
          <ul className='flex items-center max-md:mb-4  '>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/twitter.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/facebook.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/linkedin.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/youtube.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/twitch.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li className='mr-4'>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/tiktok.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
            <li>
              <a href=""><img src="https://github.githubassets.com/images/modules/site/icons/footer/github-mark.svg" height="18" width="22" className="d-block" loading="lazy" decoding="async" alt="Twitter icon" /></a>
            </li>
          </ul>
          <ul className='flex items-center mb-4 sm:mb-0 text-[#7d8590] flex-wrap' >
            <li className="mr-3 ">© 2023 GitHub, Inc.</li>
            <li className='mr-3 '><a href="">Terms</a></li>
            <li className='mr-3 '><a href="">Privacy (Updated 08/2022)</a></li>
            <li className='mr-3 '><a href="">Sitemap</a></li>
            <li className='mr-3 '><a href="">What is Git?</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Footer