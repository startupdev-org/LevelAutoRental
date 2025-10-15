import React from "react";

export const LogoMarquee: React.FC = () => {
  const logos = [
    { src: "/LevelAutoRental/logos/audi.png", alt: "Audi" },
    { src: "/LevelAutoRental/logos/bmw.webp", alt: "BMW" },
    { src: "/LevelAutoRental/logos/hyundai.png", alt: "Hyundai" },
    { src: "/LevelAutoRental/logos/maserati.png", alt: "Maserati" },
    { src: "/LevelAutoRental/logos/merc.svg", alt: "Mercedes-Benz" },
    { src: "/LevelAutoRental/logos/audi.png", alt: "Audi" },
    { src: "/LevelAutoRental/logos/bmw.webp", alt: "BMW" },
  ];

  return (
    <section className="py-16 mt-20 w-full">
      <div className="w-full">
        <div className="marquee">
          <ul className="marquee__content">
            {logos.map((logo, index) => (
              <li key={index}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </li>
            ))}
          </ul>
          {/* Mirrors the content above */}
          <ul className="marquee__content" aria-hidden="true">
            {logos.map((logo, index) => (
              <li key={`duplicate-${index}`}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-24 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
