import { useAuthStore} from "../hooks/AuthStore.jsx";

export default function Accueil() {
    const { user } = useAuthStore();
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold mb-4">Bienvenue {user.name}</h1>
            <p className="text-lg text-gray-700">Ceci est la page d'accueil de votre application.</p>
        </div>
    );
}