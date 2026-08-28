import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCars } from "../../lib/db/cars/cars-page/cars";
import { getMakeLogo, MAKE_LOGOS } from "../../utils/car/car";

type BrandLogo = { src: string; alt: string; filter: string };

const uniqueMakesFromCars = (cars: { make?: string | null }[]) => {
  const makes = cars.map((car) => {
    const make = car.make || "";
    const normalizedMake = make.includes("-") ? make.split("-")[0] : make;
    return normalizedMake.trim().toLowerCase();
  });
  return Array.from(new Set(makes)).filter(Boolean).map(
    (make) => make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
  );
};

const mergeLogos = (fleetMakes: string[]): BrandLogo[] => {
  const fromFleet: BrandLogo[] = fleetMakes
    .map((make) => {
      const src = getMakeLogo(make);
      return src ? { src, alt: make, filter: make } : null;
    })
    .filter((logo): logo is BrandLogo => logo !== null);

  const seen = new Set<string>();
  return [...fromFleet, ...MAKE_LOGOS].filter((logo) => {
    if (seen.has(logo.src)) return false;
    seen.add(logo.src);
    return true;
  });
};

export const LogoMarquee: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [logos, setLogos] = useState<BrandLogo[]>(MAKE_LOGOS);

  useEffect(() => {
    const load = async () => {
      try {
        const cars = await fetchCars();
        setLogos(mergeLogos(uniqueMakesFromCars(cars)));
      } catch (error) {
        console.error("Error fetching cars for logo marquee:", error);
      }
    };
    load();
  }, []);

  const getLogoSizeClass = (alt: string): string => {
    const altLower = alt.toLowerCase();
    if (altLower === "audi") {
      return "h-[67px] md:h-[53px]";
    }
    if (altLower === "hyundai") {
      return "h-[41px] md:h-[54px]";
    }
    if (altLower === "volkswagen" || altLower === "lincoln") {
      return "h-[63px] md:h-[84px]";
    }
    if (altLower === "mercedes-benz" || altLower === "mercedes") {
      return "h-[61px] md:h-[91px]";
    }
    if (altLower === "renault") {
      return "h-[60px] md:h-[90px] -translate-x-[2px]";
    }
    return "h-16 md:h-24";
  };

  const getLogoDimensions = (alt: string): { width: number; height: number } => {
    const altLower = alt.toLowerCase();
    if (altLower === "audi") {
      return { width: 120, height: 67 };
    }
    if (altLower === "hyundai") {
      return { width: 100, height: 41 };
    }
    if (altLower === "volkswagen" || altLower === "lincoln") {
      return { width: 120, height: 63 };
    }
    if (altLower === "mercedes-benz" || altLower === "mercedes") {
      return { width: 120, height: 61 };
    }
    if (altLower === "porsche" || altLower === "bmw" || altLower === "maserati") {
      return { width: 120, height: 64 };
    }
    if (altLower === "renault") {
      return { width: 112, height: 60 };
    }
    return { width: 120, height: 64 };
  };

  const renderLogos = (keyPrefix: string) =>
    logos.map((logo, index) => {
      const dimensions = getLogoDimensions(logo.alt);
      return (
        <li key={`${keyPrefix}-${logo.src}-${index}`} className="mx-8 md:mx-12 lg:mx-4">
          <img
            src={logo.src}
            alt={logo.alt}
            width={dimensions.width}
            height={dimensions.height}
            loading="lazy"
            onClick={() => navigate(`/cars?make=${logo.filter}`)}
            className={`${getLogoSizeClass(logo.alt)} w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer`}
          />
        </li>
      );
    });

  return (
    <section className={`lg:py-16 py-0 ${i18n.language === "ru" ? "mt-[320px]" : "mt-[280px]"} lg:mt-20 w-full`}>
      <div className="w-full">
        <div className="marquee">
          <ul className="marquee__content">{renderLogos("a")}</ul>
          <ul className="marquee__content" aria-hidden="true">
            {renderLogos("b")}
          </ul>
        </div>
      </div>
    </section>
  );
};
