import React, { MouseEvent, useState } from "react";

import { Mail, Phone, MapPin } from "lucide-react";
import WHATSAPP from "@/lib/contactConfig";


import siteLogo from "@/assets/brand-logo-light.svg";
import favicon from "@/assets/office-logo-light.png"

const Footer = ({ handleAnchorClick }) => {

  return (
    <footer
      className="text-white py-12"
      style={{
        background: 'linear-gradient(120deg, #4A00E0 10%, #00C9FF 90%)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_0.5fr_0.5fr_1fr] gap-8">
          {/* Brand */}
          <div className="">
            <a href="/" onClick={(e) => handleAnchorClick("/", e)} className="flex items-center group overflow-hidden relative">
              {/* full site logo is in the flow (relative) but hidden off-screen by transform; it will slide in on hover */}
              <img
                src={siteLogo}
                alt="Techtide Co. full logo"
                className="relative -translate-x-full drop-shadow-md group-hover:translate-x-0 transition-transform duration-300 pointer-events-none lg:h-12 sm:h-10 h-8"
                style={{ maxHeight: "48px", width: 'auto' }}
              />
              {/* favicon is absolutely positioned on top so it shows immediately; it will move right on hover to reveal the logo */}
              <img
                src={favicon}
                alt="Techtide Co. favicon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 lg:h-12 sm:h-10 h-8 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:translate-x-56 group-hover:scale-0"
                style={{ maxHeight: "48px" }}
              />
            </a>
            <p className="mt-3 text-white/80 leading-relaxed max-w-md">TechTide Co. provides innovative web and software development solutions, helping businesses grow through modern technology, skilled teams, and dependable project delivery.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/"
                  onClick={(e) => handleAnchorClick("/", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Home</a>
              </li>
              <li>
                <a
                  href="/services"
                  onClick={(e) => handleAnchorClick("/services", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Services</a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleAnchorClick("/about", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >About Us</a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleAnchorClick("/contact", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Discover More */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Discover More</h4>
            <ul className="space-y-2">
              <li>
                <a href="/blog"
                  onClick={(e) => handleAnchorClick("/blog", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Blog</a>
              </li>
              <li>
                <a
                  href="/ourteam"
                  onClick={(e) => handleAnchorClick("/ourteam", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Our Team</a>
              </li>
              <li>
                <a
                  href="/careers"
                  onClick={(e) => handleAnchorClick("/careers", e)}
                  className="text-white/80 hover:text-textile-silk transition-colors"
                >Careers</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-2.5 text-white/80">
              <div className="flex items-center gap-2.5 group">
                <div className="size-10 flex justify-center items-center bg-gray-100 rounded-full duration-300 group-hover:bg-gray-600">
                  <Mail className="text-gray-600 duration-300 group-hover:text-white" size={22} />
                </div>
                <a href="mailto:Techtidecorporat@gmail.com" className="break-all duration-300 group-hover:text-gray-600">Techtidecorporate@gmail.com</a>
              </div>
              <div className="flex items-center gap-2.5 group">
                <div className="size-10 flex justify-center items-center bg-gray-100 rounded-full duration-300 group-hover:bg-gray-600">
                  <Phone className="text-gray-600 duration-300 group-hover:text-white" size={22} />
                </div>
                <a href="tel:923247991484" className="duration-300 group-hover:text-gray-600">{WHATSAPP.display}</a>
              </div>
              <div className="flex items-center gap-2.5 group">
                <div className="size-10 flex justify-center items-center bg-gray-100 rounded-full duration-300 group-hover:bg-gray-600">
                  <MapPin className="text-gray-600 duration-300 group-hover:text-white" size={22} />
                </div>
                <a href="https://maps.app.goo.gl/UHdyLRCNkmw4rrjx6" target='_blank' className="capitalize duration-300 group-hover:text-gray-600">G3 heaven mall zaraar<br />shaheed road lahore</a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>&copy; 2024 TechTideCo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;