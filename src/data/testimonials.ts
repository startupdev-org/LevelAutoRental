import { Testimonial } from '../types';

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Maxim Popovici',
    userName: 'Maxim Popovici',
    avatar: 'https://images.pexels.com/photos/13866229/pexels-photo-13866229.jpeg',
    rating: 5,
    comment: 'Serviciu uimitor! Mașina era curată, de încredere, iar procesul de rezervare a fost incredibil de simplu. Voi folosi din nou cu siguranță!',
    location: 'Chișinău, Moldova',
    product: {
      name: 'Mercedes-AMG C43',
      images: [{ url: '/LevelAutoRental/cars/c43/c43-1.jpg' }]
    }
  },
  {
    id: '2',
    name: 'Mihai Cernat',
    userName: 'Mihai Cernat',
    avatar: 'https://images.pexels.com/photos/7401381/pexels-photo-7401381.jpeg',
    rating: 5,
    comment: 'Cea mai bună experiență de închiriere auto pe care am avut-o. Prețuri excelente, serviciu clienți extraordinar, iar mașina a depășit așteptările mele.',
    location: 'Bălți, Moldova',
    product: {
      name: 'Mercedes GLE',
      images: [{ url: '/LevelAutoRental/cars/gle/gle-1.jpg' }]
    }
  },
  {
    id: '3',
    name: 'Emil Rusu',
    userName: 'Emil Rusu',
    avatar: 'https://images.pexels.com/photos/2797720/pexels-photo-2797720.jpeg',
    rating: 4,
    comment: 'Serviciu foarte profesional. Preluarea a fost rapidă iar mașina era exact cum a fost descrisă. Recomand cu încredere!',
    location: 'Tiraspol, Moldova',
    product: {
      name: 'Mercedes CLS',
      images: [{ url: '/LevelAutoRental/cars/cls/cls-1.jpg' }]
    }
  },
  {
    id: '4',
    name: 'David Munteanu',
    userName: 'David Munteanu',
    avatar: 'https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg',
    rating: 5,
    comment: 'Experiență fantastică de la început până la sfârșit. Site-ul este ușor de folosit iar mașina a fost perfectă pentru călătoria noastră cu familia.',
    location: 'Orhei, Moldova',
    product: {
      name: 'Maserati Ghibli',
      images: [{ url: '/LevelAutoRental/cars/maserati/maserati-1.jpg' }]
    }
  }
];