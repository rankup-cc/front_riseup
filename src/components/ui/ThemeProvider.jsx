import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';

// État initial pour notre contexte de thème
const initialState = {
    theme: "system",
    setTheme: () => null,
};

// Création du contexte React
const ThemeProviderContext = createContext(initialState);
export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                                  ...props
                              }) {
    // Utilisation de useState pour gérer l'état du thème.
    // On récupère le thème sauvegardé dans le localStorage, ou on utilise le thème par défaut.
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    );

    // Utilisation de useEffect pour appliquer le thème au document HTML.
    // Ce code s'exécute chaque fois que la valeur de `theme` change.
    useEffect(() => {
        const root = window.document.documentElement;

        // On retire les classes de thème précédentes pour éviter les conflits.
        root.classList.remove("light", "dark");

        // Si le thème est "system", on détecte le préférence du système d'exploitation.
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            return;
        }

        // Sinon, on applique directement le thème choisi (light ou dark).
        root.classList.add(theme);
    }, [theme]);

    // La valeur qui sera partagée via le contexte.
    // Elle contient le thème actuel et la fonction pour le modifier.
    const value = {
        theme,
        setTheme: (newTheme) => {
            // On sauvegarde le nouveau thème dans le localStorage pour la persistance.
            localStorage.setItem(storageKey, newTheme);
            // On met à jour l'état de notre composant.
            setTheme(newTheme);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

// Définition des PropTypes pour la validation des props
ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
    defaultTheme: PropTypes.oneOf(["dark", "light", "system"]),
    storageKey: PropTypes.string,
};

/**
 * Le hook useTheme
 * Il permet aux composants enfants d'accéder facilement au contexte du thème.
 */
export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    // Si le hook est utilisé en dehors du ThemeProvider, on lance une erreur.
    if (context === undefined) {
        throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider");
    }

    return context;
};