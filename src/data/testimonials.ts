import { Testimonial } from '../types';

const reviewCar = (filename: string) => `/pfp/reviews-cars/${filename}`;

const review = (
  id: string,
  userName: string,
  avatar: string,
  cars: string[],
): Testimonial => ({
  id,
  userName,
  rating: 5,
  comment: `pages.reviews.home-page.${id}`,
  publishedAt: `pages.reviews.home-page.published.${id}`,
  avatar: `/pfp/${avatar}`,
  reviewImages: cars.map(reviewCar),
});

export const testimonials: Testimonial[] = [
  review('1', 'Cristian Moraru', 'Cristian Moraru.png', [
    'Cristian Moraru Review IMG1.jpeg',
    'Cristian Moraru Review IMG2.jpeg',
    'Cristian Moraru Review IMG3.jpeg',
  ]),
  review('2', 'Laura Sîrbu', 'Laura Sirbu.png', ['Laura Sirbu Review.jpeg']),
  review('3', 'Dima Gruia', 'Dima Gruia.png', ['Dima Gruia Review.jpeg']),
  review('4', 'Dumitru Gotca', 'Dumitru Gotca.png', [
    'Dumitru Gotca Review IMG1.jpeg',
    'Dumitru Gotca Review IMG2.jpeg',
    'Dumitru Gotca Review IMG3.jpeg',
    'Dumitru Gotca Review IMG4.jpeg',
  ]),
  review('5', 'Andrian Scripnic', 'Adrian Scripnic.png', ['Adrian Scripnic Review.jpeg']),
  review('6', 'Chiseliov Stanislav', 'Chiseliov Stanislav.png', ['Chiseliov Stanislav Review.jpeg']),
  review('7', 'Ghenadie', 'Ghenadie.png', ['Ghenadie Review.jpeg']),
  review('9', 'Cătălin', 'Cătălin.png', ['Catalin Review.jpeg']),
  review('10', 'C 7', 'C7.png', ['C7 Review.jpeg']),
  review('11', 'A L', 'A L.png', ['A L Review.jpeg']),
  review('12', 'Costea Pantelemon', 'Costea Pantelemon.png', ['Costea Pantelemon Review.jpeg']),
];
