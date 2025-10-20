export interface Review {
    id: string;
    userName: string;
    userInitial: string;
    userInitialColor: string;
    rating: number;
    date: string;
    category: string;
    comment: string;
    isTranslated?: boolean;
    originalLanguage?: string;
    hasProfilePicture?: boolean;
    profilePicture?: string;
}

export const reviews: Review[] = [
    {
        id: '1',
        userName: 'Artur Sincarenco',
        userInitial: 'A',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '6 februarie 2025',
        category: 'Închiriere',
        comment: 'Am avut experiență cu mai multe servicii de închiriere, iar acesta este, probabil, unul dintre cele mai rapide și de încredere. Mașinile îngrijite, contractul este transparent și bine detaliat, fără condiții speciale sau plată în plus pentru plecări peste hotare, loiali. Dacă ar trebui să recomand un parc de închirieri, cu siguranță ar fi acesta.',
        hasProfilePicture: true,
        profilePicture: 'https://images.pexels.com/photos/13866229/pexels-photo-13866229.jpeg'
    },
    {
        id: '2',
        userName: 'Dragoș',
        userInitial: 'D',
        userInitialColor: 'bg-blue-500',
        rating: 5,
        date: '1 martie 2025',
        category: 'Închiriere',
        comment: 'Totul super 🔥 service la nivel, masini fain, personal de nota 10. 🙌😍'
    },
    {
        id: '3',
        userName: 'Igor Karpov',
        userInitial: 'I',
        userInitialColor: 'bg-purple-500',
        rating: 5,
        date: '30 ianuarie 2025',
        category: 'Spălare',
        comment: 'Băieții oferă într-adevăr un serviciu de calitate, cea mai bună spălătorie auto din Chișinău, o gamă largă de servicii, folosesc produse chimice de calitate și respectă procesul de curățare, pleci mereu cu bună dispoziție într-o mașină cu adevărat curată.',
        isTranslated: true,
        originalLanguage: 'rusă'
    },
    {
        id: '4',
        userName: 'Alexandr',
        userInitial: 'A',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '19 ianuarie 2025',
        category: 'Închiriere',
        comment: 'Evaluare fără recenzie'
    },
    {
        id: '5',
        userName: 'Artiom Rebrov',
        userInitial: 'A',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '28 ianuarie 2025',
        category: 'Închiriere',
        comment: 'Serviciu excelent, gamă largă de mașini, posibilitatea de a prelungi contractul de închiriere la distanță! Băieți extraordinari. ✊',
        isTranslated: true,
        originalLanguage: 'rusă',
        hasProfilePicture: true,
        profilePicture: 'https://images.pexels.com/photos/7401381/pexels-photo-7401381.jpeg'
    },
    {
        id: '6',
        userName: 'Stefan',
        userInitial: 'S',
        userInitialColor: 'bg-purple-500',
        rating: 5,
        date: '19 ianuarie 2025',
        category: 'Închiriere',
        comment: 'Am găsit mașina de închiriat pe care o căutam.',
        isTranslated: true,
        originalLanguage: 'rusă'
    },
    {
        id: '7',
        userName: 'Andriy Vovchok',
        userInitial: 'A',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '19 ianuarie 2025',
        category: 'Închiriere',
        comment: 'Serviciu excelent. Sunt multe mașini. Procesul de închiriere este foarte rapid. Oferă mașini și străinilor. Recomand!',
        isTranslated: true,
        originalLanguage: 'rusă',
        hasProfilePicture: true,
        profilePicture: 'https://images.pexels.com/photos/2797720/pexels-photo-2797720.jpeg'
    },
    {
        id: '8',
        userName: 'Iulian Iulian',
        userInitial: 'I',
        userInitialColor: 'bg-pink-500',
        rating: 4,
        date: '19 ianuarie 2025',
        category: 'Vânzare',
        comment: 'Au și mașini de vânzare. Am vrut să vedem una. În primul rând, nu răspundeau. A doua oară au răspuns. Au spus că vor reveni cu un apel. Nu au sunat înapoi. S-a dovedit că anunțul nu era actualizat.',
        isTranslated: true,
        originalLanguage: 'rusă'
    },
    {
        id: '9',
        userName: 'Alexandr',
        userInitial: 'A',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '20 decembrie 2024',
        category: 'Detailing auto',
        comment: 'Evaluare fără recenzie'
    },
    {
        id: '10',
        userName: 'Iura',
        userInitial: 'I',
        userInitialColor: 'bg-blue-600',
        rating: 5,
        date: '15 decembrie 2024',
        category: 'Închiriere',
        comment: 'Serviciu foarte bun! Mașina era curată și în stare perfectă. Procesul de rezervare a fost simplu și rapid. Voi folosi din nou cu siguranță serviciile acestea.',
        hasProfilePicture: true,
        profilePicture: 'https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg'
    },
    {
        id: '11',
        userName: 'Maxim',
        userInitial: 'M',
        userInitialColor: 'bg-green-500',
        rating: 5,
        date: '10 decembrie 2024',
        category: 'Închiriere',
        comment: 'Cea mai bună experiență de închiriere auto! Prețuri excelente, serviciu clienți extraordinar, iar mașina a depășit așteptările mele. Recomand cu încredere!'
    },
    {
        id: '12',
        userName: 'Ion',
        userInitial: 'I',
        userInitialColor: 'bg-blue-600',
        rating: 5,
        date: '5 decembrie 2024',
        category: 'Spălare',
        comment: 'Serviciu de spălare auto de calitate superioară! Mașina a ieșit ca nouă. Personalul este foarte atent la detalii și folosește produse de calitate. Voi reveni sigur!'
    }
];
