
export const ContractSection: React.FC = () => {
    return (
        <>
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract</h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                    Compania noastră oferă servicii de închiriere auto pe teritoriul Republicii Moldova, respectând cu strictețe legislația în vigoare. Interacțiunea cu clienții se bazează pe Contractul de închiriere, care garantează protecția juridică a intereselor acestora.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Condiții și cerințe</h3>
                <p className="text-gray-700 mb-4">
                    Pentru a închiria o mașină, trebuie îndeplinite următoarele cerințe și acceptate următoarele condiții:
                </p>

                <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Vârsta minimă a șoferului: 21 ani.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Permis de conducere valabil, categoria B.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Experiență de conducere de cel puțin 3 ani.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Deținerea buletinului de identitate.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Achitarea integrală (100%) a taxei de închiriere pentru mașina selectată.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Depunerea unui depozit conform valorii stabilite în Contract. Depozitul reprezintă o asigurare a îndeplinirii obligațiilor de către Chiriaș și este returnat după 10 zile de la predarea mașinii, în absența încălcărilor majore.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Toate amenzile primite în timpul utilizării vehiculului revin în responsabilitatea șoferului.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>În lipsa poliței CASCO, responsabilitatea pentru accidente revine șoferului.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Limita zilnică de parcurs este de 200 km. În cazul închirierii pentru mai multe zile, limita se calculează în total. În cazul depășirii limitei și în lipsa opțiunii activate «Kilometraj nelimitat», depășirea se achită separat.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Plata se poate efectua în numerar, prin transfer bancar sau cu cardul.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Clientul are dreptul la recalcularea costului în caz de returnare anticipată a vehiculului.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Prelungirea Contractului de închiriere este posibilă în format la distanță, dar nu este garantată.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Este posibilă livrarea sau returnarea mașinii la adresa convenabilă. Costul se confirmă la telefon +373 79 75-22-22.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                        <span>Înainte de semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 0 lei. După semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 500 lei.</span>
                    </li>
                </ul>
            </div>
        </>
    )
}