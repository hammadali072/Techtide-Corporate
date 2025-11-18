import React, { useRef } from 'react';
import { FaLinkedin, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import MuhammadNadirKhan from '../../assets/Muhammad Nadir.png';
import MuhammadMoazzam from '../../assets/Muhammad Moazzam.png';
import SajideenHassan from '../../assets/Sajideen Hassan.png';
import ShaminGull from '../../assets/Shamin Gull.png';
import AmmarHaider from '../../assets/Muhammad Hammad Haider.png';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// import required modules
import { Navigation } from 'swiper/modules';

interface Leader {
    id: number;
    image: string;
    name: string;
    role: string;
    description?: string;
    linkedin: string;
}

const LeaderShipPagination = () => {
    const swiperRef = useRef<SwiperType>();

    const leadershipData: Leader[] = [
        {
            id: 1,
            image: MuhammadNadirKhan,
            name: 'Muhammad Nadir Khan',
            description: 'Leading TechTide’s vision with strong, forward-focused strategic direction.',
            role: 'Founder, CEO',
            linkedin: 'https://www.linkedin.com/in/muhammad-nadir-202186383/',
        },
        {
            id: 2,
            image: MuhammadMoazzam,
            name: 'Muhaammad Moazzam',
            role: 'Chief Finance Officer',
            description: 'Ensuring financial stability, growth, and sustainability.',
            linkedin: 'https://www.linkedin.com/in/muhammad-moazzam-366bb238b/',
        },
        {
            id: 3,
            image: SajideenHassan,
            name: 'Sajideen Hassan',
            role: 'Chief Technology Officer',
            description: 'Driving innovation through advanced technological leadership.',
            linkedin: 'https://www.linkedin.com/in/sajideen-hassan-79875428a/',
        },
        {
            id: 4,
            image: ShaminGull,
            name: 'Shamin Gull',
            role: 'Chief Operating Officer',
            description: 'Optimizing operations for efficiency and seamless performance.',
            linkedin: 'https://www.linkedin.com/in/shamin-gul-khan/',
        },
        {
            id: 5,
            image: AmmarHaider,
            name: 'Muhammad Hammad Haider',
            role: 'Digital Marketing Director',
            description: 'Leading impactful, data-driven digital marketing growth.',
            linkedin: 'https://techtidecorporate.com/www.linkedin.com/in/ammarhaider75',
        },
    ];

    // Enhanced responsive breakpoints
    const breakpoints = {
        // Mobile first - small phones
        0: {
            slidesPerView: 1,
            spaceBetween: 16,
        },
        // Small tablets and large phones
        480: {
            slidesPerView: 1,
            spaceBetween: 20,
        },
        // Tablets
        768: {
            slidesPerView: 2,
            spaceBetween: 24,
        },
        // Small desktops
        1024: {
            slidesPerView: 3,
            spaceBetween: 28,
        },
        // Large desktops
        1280: {
            slidesPerView: 3,
            spaceBetween: 32,
        },
        1536: {
            slidesPerView: 4,
            spaceBetween: 32,
        },
    };

    return (
        <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center  ">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                    Leadership & Team
                </h3>
            </div>
            {/* Navigation Buttons - Responsive Positioning */}
            <div className="absolute top-8 right-4 sm:top-0 sm:right-6 lg:top-0 lg:right-8 z-10 flex space-x-2">
                <button
                    onClick={() => swiperRef.current?.slidePrev()}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    aria-label="Previous slide"
                >
                    <FaChevronLeft className="text-xs sm:text-sm" />
                </button>
                <button
                    onClick={() => swiperRef.current?.slideNext()}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    aria-label="Next slide"
                >
                    <FaChevronRight className="text-xs sm:text-sm" />
                </button>
            </div>

            {/* Swiper Container with Responsive Padding */}
            <div className="pt-16 sm:pt-20 lg:pt-24 pb-8">
                <Swiper
                    breakpoints={breakpoints}
                    modules={[Navigation]}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    className="mySwiper"
                >
                    {leadershipData.map((leader) => (
                        <SwiperSlide key={leader.id}>
                            <div className="flex flex-col items-center h-full mx-2 sm:mx-3">
                                {/* Image Container - Responsive */}
                                <div className="w-full max-w-[280px] sm:max-w-[320px] h-60 sm:h-56 lg:h-60 object-contain flex items-center justify-center overflow-hidden ">
                                    <img
                                        src={leader.image}
                                        alt={leader.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Content Container - Responsive */}
                                <div className="mt-4 sm:mt-6 text-center flex-1 flex flex-col w-full max-w-[280px] sm:max-w-[320px]">
                                    <h3 className="text-lg sm:text-xl lg:text-xl font-semibold text-blue-600 leading-tight">
                                        {leader.name}
                                    </h3>
                                    <p className="text-gray-600 font-medium text-sm sm:text-base mt-1 sm:mt-2">
                                        {leader.role}
                                    </p>
                                    <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3 flex-1 leading-relaxed">
                                        {leader.description || 'Driving excellence and innovation in their domain.'}
                                    </p>
                                    <a
                                        href={leader.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className=" flex justify-center mt-3 sm:mt-4 hover:opacity-80 transition-opacity duration-200"
                                    >
                                        <FaLinkedin className="w-5 h-5 sm:w-6 sm:h-6" color="#0A66C2" />
                                    </a>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}

export default LeaderShipPagination;