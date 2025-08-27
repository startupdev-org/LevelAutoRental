import React from "react";

export const LogoMarquee: React.FC = () => {
  const logos = [
    { src: "/logos/audi.png", alt: "Audi" },
    { src: "/logos/bmw.webp", alt: "BMW" },
    { src: "/logos/hyundai.png", alt: "Hyundai" },
    { src: "/logos/maserati.png", alt: "Maserati" },
    { src: "/logos/merc.svg", alt: "Mercedes-Benz" },
  ];

  return (
    <section className="py-16 mt-20 w-full">
      <div className="w-full ">
        {/* <h2 className="text-3xl font-bold text-center mb-32 text-gray-800">
          Încrederea Mărcilor de Top
        </h2> */}
        <div className="relative overflow-hidden w-full">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* First set of logos */}
            {logos.map((logo, index) => (
              <div
                key={`first-${index}`}
                className="flex items-center justify-center mx-12 min-w-[160px]"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {logos.map((logo, index) => (
              <div
                key={`second-${index}`}
                className="flex items-center justify-center mx-12 min-w-[160px]"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
            {/* Third set to ensure seamless infinite loop */}
            {logos.map((logo, index) => (
              <div
                key={`third-${index}`}
                className="flex items-center justify-center mx-12 min-w-[160px]"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
