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

  const handleLogoClick = (filter: string) => {
    navigate(`/cars?make=${filter}`);
  };

  return (
    <section className="py-16 mt-32 lg:mt-20 w-full">
      <div className="w-full">
        <div className="marquee">
          <ul className="marquee__content">
            {logos.map((logo, index) => (
              <li key={index} className="mx-8 md:mx-12 lg:mx-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  onClick={() => handleLogoClick(logo.filter)}
                  className="h-16 md:h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
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
                  className="h-16 md:h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
