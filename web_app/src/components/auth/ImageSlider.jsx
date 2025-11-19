import React, { useState, useEffect } from 'react';

const ImageSlider = ({ showClearImage = false }) => {
    const images = [
        '/image/hinh4.png',
        '/image/hinh1.jpg',
        '/image/hinh2.jpg',
        '/image/hinh3.jpg'
    ];

    const captions = [
        { title: 'BookFlow - Smart Management', subtitle: 'Optimize your booking experience' },
        { title: 'Capturing Moments', subtitle: 'Creating Memories' },
        { title: 'Your Journey Begins', subtitle: 'With BookFlow Manager' },
        { title: 'Seamless Management', subtitle: 'Powerful Results' }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
                setIsTransitioning(false);
            }, 500);
        }, 5000);

        return () => clearInterval(interval);
    }, [images.length]);

    const goToSlide = (index) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsTransitioning(false);
        }, 500);
    };

    // If showClearImage is true, render only the clear image with caption
    if (showClearImage) {
        return (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                <div
                    className={`transition-all duration-700 ease-in-out ${
                        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                    <img
                        src={images[currentIndex]}
                        alt={`Slide ${currentIndex + 1}`}
                        className="w-[600px] h-[340px] mx-auto rounded-2xl shadow-2xl object-cover"
                    />
                </div>

                {/* Caption below image */}
                <div
                    className={`mt-8 text-center transition-all duration-700 ease-in-out ${
                        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                    }`}
                >
                    <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                        {captions[currentIndex].title}
                    </h2>
                    <p className="text-lg text-white/90 drop-shadow-md">
                        {captions[currentIndex].subtitle}
                    </p>
                </div>

                {/* Dot indicators */}
                <div className="mt-6 flex space-x-3">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url(${images[currentIndex]})`,
                    filter: 'blur(25px)',
                    transform: 'scale(1.2)',
                    opacity: isTransitioning ? 0.7 : 1
                }}
            />
            {/* Overlay gradient - darker for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-indigo-900/60 to-purple-900/50" />
        </div>
    );
};

export default ImageSlider;
