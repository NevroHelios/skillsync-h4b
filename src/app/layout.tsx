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
        <StarknetConfig chains={chains} provider={provider} connectors={connectors}>
          <AuthProvider>
            {children}
            <ToastContainer
              position="top-center"
              autoClose={2500}
              hideProgressBar
              newestOnTop
              closeOnClick
              pauseOnFocusLoss={false}
              theme="dark"
            />
          </AuthProvider>
        </StarknetConfig>
      </body>
    </html>
  );
}
