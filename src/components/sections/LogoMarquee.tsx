import React from "react";
import { useNavigate } from "react-router-dom";

export const LogoMarquee: React.FC = () => {
  const navigate = useNavigate();

  const logos = [
    { src: "/LevelAutoRental/logos/audi.png", alt: "Audi", filter: "audi" },
    { src: "/LevelAutoRental/logos/bmw.webp", alt: "BMW", filter: "bmw" },
    { src: "/LevelAutoRental/logos/hyundai.png", alt: "Hyundai", filter: "hyundai" },
    { src: "/LevelAutoRental/logos/maserati.png", alt: "Maserati", filter: "maserati" },
    { src: "/LevelAutoRental/logos/merc.svg", alt: "Mercedes-Benz", filter: "mercedes" },
    { src: "/LevelAutoRental/logos/audi.png", alt: "Audi", filter: "audi" },
    { src: "/LevelAutoRental/logos/bmw.webp", alt: "BMW", filter: "bmw" },
  ];

  const getLogoSizeClass = (alt: string): string => {
    const altLower = alt.toLowerCase();
    if (altLower === 'audi' || altLower === 'hyundai') {
      return 'h-12 md:h-16';
    }
    return 'h-16 md:h-24';
  };

  const handleLogoClick = (filter: string) => {
    navigate(`/cars?make=${filter}`);
  };

  return (
    <section className="lg:py-16 py-0 mt-[360px] lg:mt-20 w-full">
      <div className="w-full">
        <div className="marquee">
          <ul className="marquee__content">
            {logos.map((logo, index) => (
              <li key={index} className="mx-8 md:mx-12 lg:mx-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  onClick={() => handleLogoClick(logo.filter)}
                  className={`${getLogoSizeClass(logo.alt)} w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer`}
                />
              </li>
            ))}
          </ul>
          {/* Mirrors the content above */}
          <ul className="marquee__content" aria-hidden="true">
            {logos.map((logo, index) => (
              <li key={`duplicate-${index}`} className="mx-8 md:mx-12 lg:mx-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  onClick={() => handleLogoClick(logo.filter)}
                  className={`${getLogoSizeClass(logo.alt)} w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
