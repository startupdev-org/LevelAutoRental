import React from "react";
import { useNavigate } from "react-router-dom";

export const LogoMarquee: React.FC = () => {
  const navigate = useNavigate();

  const logos = [
    { src: "/logos/audi.png", alt: "Audi", filter: "Audi" },
    { src: "/logos/bmw.webp", alt: "BMW", filter: "BMW" },
    { src: "/logos/hyundai.png", alt: "Hyundai", filter: "Hyundai" },
    { src: "/logos/maserati.png", alt: "Maserati", filter: "Maserati" },
    { src: "/logos/merc.svg", alt: "Mercedes-Benz", filter: "Mercedes" },
    { src: "/logos/lincoln.png", alt: "Lincoln", filter: "Lincoln" },
    { src: "/logos/volkswagen-1-logo-black-and-white.png", alt: "Volkswagen", filter: "Volkswagen" },
    { src: "/logos/porsche.png", alt: "Porsche", filter: "Porsche" },
  ];

  const getLogoSizeClass = (alt: string): string => {
    const altLower = alt.toLowerCase();
    if (altLower === 'audi') {
      // Mobile: 40% bigger, Desktop: 17% smaller
      return 'h-[67px] md:h-[53px]';
    }
    if (altLower === 'hyundai') {
      // 15% smaller total: h-12 (48px) -> 41px, md:h-16 (64px) -> 54px
      return 'h-[41px] md:h-[54px]';
    }
    if (altLower === 'volkswagen' || altLower === 'lincoln') {
      // 30% bigger total: h-12 (48px) -> 63px, md:h-16 (64px) -> 84px
      return 'h-[63px] md:h-[84px]';
    }
    if (altLower === 'mercedes-benz' || altLower === 'mercedes') {
      // 5% smaller: h-16 (64px) -> 61px, md:h-24 (96px) -> 91px
      return 'h-[61px] md:h-[91px]';
    }
    return 'h-16 md:h-24';
  };

  const handleLogoClick = (filter: string) => {
    navigate(`/cars?make=${filter}`);
  };

  return (
    <section className="lg:py-16 py-0 mt-[280px] lg:mt-20 w-full">
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
