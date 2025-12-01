import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import "./coachGroups.css";

export default function CoachGroups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", description: "" });
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [removalGroup, setRemovalGroup] = useState(null);
    const [memberSelection, setMemberSelection] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (!expandedGroup || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchLoading(true);
                const res = await api.get(`/coach/users/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [expandedGroup, searchQuery]);

    async function loadGroups() {
        try {
            setLoading(true);
            const res = await api.get("/coach/groups");
            setGroups(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Impossible de charger les groupes.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateGroup(e) {
        e.preventDefault();
        setError("");
        try {
            await api.post("/coach/groups", form);
            setForm({ name: "", description: "" });
            await loadGroups();
        } catch (err) {
            setError(err.response?.data?.message || "Création impossible.");
        }
    }

    async function handleSelectMember(groupId, athleteId) {
        setError("");
        try {
            await api.post(`/coach/groups/${groupId}/members`, { athlete_id: athleteId });
            setSearchQuery("");
            setSearchResults([]);
            await loadGroups();
        } catch (err) {
            setError(err.response?.data?.message || "Ajout impossible.");
        }
    }

    async function handleRemoveMember(groupId) {
        const athleteId = memberSelection[groupId];
        if (!athleteId) return;
        setError("");
        try {
            await api.delete(`/coach/groups/${groupId}/members/${athleteId}`);
            setMemberSelection((prev) => ({ ...prev, [groupId]: "" }));
            await loadGroups();
        } catch (err) {
            setError(err.response?.data?.message || "Suppression impossible.");
        }
    }

    async function handleDeleteGroup(groupId) {
        if (!window.confirm("Supprimer définitivement ce groupe ?")) return;
        setError("");
        try {
            await api.delete(`/coach/groups/${groupId}`);
            if (expandedGroup === groupId) {
                setExpandedGroup(null);
                setSearchQuery("");
                setSearchResults([]);
            }
            if (removalGroup === groupId) {
                setRemovalGroup(null);
            }
            await loadGroups();
        } catch (err) {
            setError(err.response?.data?.message || "Suppression impossible.");
        }
    }

    const toggleRemoval = (groupId) => {
        setRemovalGroup((prev) => (prev === groupId ? null : groupId));
    };

    return (
        <section className="space-y-6">
            <header className="header-groupes">
                <p className="text-sm text-muted-foreground">Groupes & athlètes</p>
                <h1 className="text-3xl font-semibold">Organisez vos athlètes</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Nouveau groupe</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-3" onSubmit={handleCreateGroup}>
                        <Input
                            placeholder="Nom du groupe"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Textarea
                            placeholder="Objectif / description"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                        <Button type="submit">Créer le groupe</Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="carte-groupe">
                {loading && <p>Chargement des groupes...</p>}
                {!loading && groups.length === 0 && (
                    <p className="text-muted-foreground">Aucun groupe pour le moment.</p>
                )}

                {groups.map((group) => (
                    <Card key={group.id} className="groupe-créer">
                        <CardHeader className="carte-groupe">
                            <div>
                                <div>
                                    <CardTitle>{group.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{group.description}</p>
                                </div>
                                <div className="coach-group-actions">
                                    <Button variant="secondary" asChild>
                                        <Link to={`/coach/groups/${group.id}/plan`}>Ouvrir le plan</Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setExpandedGroup((prev) => (prev === group.id ? null : group.id))
                                        }
                                    >
                                        Ajouter
                                    </Button>
                                    <Button variant="outline" onClick={() => toggleRemoval(group.id)}>
                                        Supprimer des membres
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDeleteGroup(group.id)}>
                                        Supprimer le groupe
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">Athlètes</p>
                                <div className="group-members">
                                    {(group.members || []).map((member) => {
                                        const athlete = member.athlete;
                                        const letter =
                                            athlete?.first_name?.charAt(0)?.toUpperCase() ||
                                            athlete?.email?.charAt(0)?.toUpperCase() ||
                                            "?";
                                        return (
                                            <span
                                                className="member-pill"
                                                key={member.id}
                                                title={`${athlete?.first_name || ""} ${athlete?.last_name || ""}`}
                                            >
                                                {letter}
                                            </span>
                                        );
                                    })}
                                    {group.members?.length === 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            Aucun athlète ajouté.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {removalGroup === group.id && (
                                <div className="remove-member-form">
                                    <select
                                        value={memberSelection[group.id] || ""}
                                        onChange={(e) =>
                                            setMemberSelection((prev) => ({
                                                ...prev,
                                                [group.id]: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Sélectionner un athlète</option>
                                        {(group.members || []).map((member) => (
                                            <option
                                                key={member.id}
                                                value={member.athlete_id ?? member.athlete?.id}
                                            >
                                                {member.athlete?.first_name} {member.athlete?.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="destructive"
                                        disabled={!memberSelection[group.id]}
                                        onClick={() => handleRemoveMember(group.id)}
                                    >
                                        Supprimer du groupe
                                    </Button>
                                </div>
                            )}

                            {expandedGroup === group.id && (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Chercher par prénom ou nom"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchLoading && (
                                        <p className="text-xs text-muted-foreground">Recherche...</p>
                                    )}
                                    {!searchLoading && searchResults.length > 0 && (
                                        <ul className="search-results">
                                            {searchResults.map((user) => {
                                                const fullName = [user.first_name, user.last_name]
                                                    .filter(Boolean)
                                                    .join(" ")
                                                    .trim();
                                                const primaryLabel = fullName || user.email;
                                                const secondaryLabel =
                                                    fullName && user.email ? user.email : null;

                                                return (
                                                    <li key={user.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectMember(group.id, user.id)}
                                                        >
                                                            <span className="search-result-primary">
                                                                {primaryLabel}
                                                            </span>
                                                            {secondaryLabel && (
                                                                <span className="search-result-secondary">
                                                                    {secondaryLabel}
                                                                </span>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                    {!searchLoading &&
                                        searchQuery.length >= 2 &&
                                        searchResults.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Aucun athlète trouvé.
                                            </p>
                                        )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
