'use client'
import Container from '@/app/Container'

type Props = {}

const Navbar = (props: Props) => {
  return (
    <nav className="w-full flex justify-center items-center py-8 bg-transparent">
      <a href="/" aria-label="Go to homepage">
        <img
          src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745079464/Layer_1_sbyjkd.png"
          alt="H4B Logo"
          width={220}
          height={80}
          className="object-contain mx-auto drop-shadow-lg"
        />
      </a>
    </nav>
  )
}

export default Navbar