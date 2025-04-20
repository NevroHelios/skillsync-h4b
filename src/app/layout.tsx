"use client";

import React, { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StarknetConfig, InjectedConnector } from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import {
  publicProvider,
  argent,
  braavos,
} from "@starknet-react/core";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // configure the injected wallet connector (Braavos, ArgentX, etc.)
  
  const chains = [sepolia];
  const provider = publicProvider();
  const connectors = [braavos(), argent()];

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100`}
      >
        <video 
          className="absolute inset-0 w-screen object-cover z-0 filter blur-xs" // Changed absolute to fixed for full-screen background
          autoPlay 
          loop 
          muted 
          playsInline
          preload="metadata"
          poster="https://res.cloudinary.com/dlrlet9fg/image/upload/v1742230891/video-poster.jpg"
        >
          <source 
            src="https://res.cloudinary.com/dlrlet9fg/video/upload/v1745090293/3129957-uhd_3840_2160_25fps_2_1_1_1_ohss3y.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
        <StarknetConfig chains={chains} provider={provider} connectors={connectors}>
          <AuthProvider>
            <Navbar />
            {/* Adjusted margin-top to account for fixed navbar height */}
            
            {children}
            <ToastContainer
              position="top-center"
              autoClose={2500}
              hideProgressBar
              newestOnTop
              closeOnClick
              pauseOnFocusLoss={false}
              theme="dark"
            /><Footer />
          </AuthProvider>
        </StarknetConfig>
      </body>
    </html>
  );
}
