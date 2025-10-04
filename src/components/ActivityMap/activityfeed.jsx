import React, { useState, useEffect } from 'react';

const ActivityFeed = () => {
    const [activeTab, setActiveTab] = useState('activities'); 
    const [events, setEvents] = useState([]);
    const joinEvent = async (eventId) => {
    try {
        await fetch(`http://backend.react.test:8000/api/events/${eventId}/join`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"), // si tu utilises Sanctum/JWT
        },
        });
        alert("Inscription réussie !");
    } catch (err) {
        console.error("Erreur inscription:", err);
    }
    };

    const leaveEvent = async (eventId) => {
    try {
        await fetch(`http://backend.react.test:8000/api/events/${eventId}/leave`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        });
        alert("Désinscription réussie !");
    } catch (err) {
        console.error("Erreur désinscription:", err);
    }
    };

    // --- activités en local (mock) ---
    const activities = [
        {
            id: 1,
            user: "Marc Dupont",
            avatar: "M",
            time: "il y a 2h",
            activity: "Course matinale",
            location: "Parc de Vincennes",
            distance: "8.5 km",
            duration: "42:15",
            likes: 23,
            comments: 7,
            isLiked: false,
            description: "Belle session matinale ! Le temps était parfait pour courir 🏃‍♂️"
        },
        // … autres activités en dur
    ];

    // --- charger les events depuis Laravel ---
    useEffect(() => {
        fetch("http://backend.react.test:8000/api/events")
            .then(res => res.json())
            .then(setEvents)
            .catch(err => console.error("Erreur fetch events:", err));
    }, []);

    const toggleLike = (activityId) => {
        console.log(`Toggle like for activity ${activityId}`);
    };



    const getDifficultyColor = (difficulty) => {
        switch(difficulty) {
            case 'Facile': return '#32CD32';
            case 'Débutant': return '#32CD32';
            case 'Intermédiaire': return '#FFD700';
            case 'Avancé': return '#FF6B6B';
            default: return '#45DFB1';
        }
    };

    return (
        <div style={{
            backgroundColor: '#213A57',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(69, 223, 177, 0.2)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* Header avec onglets */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '25px',
                borderBottom: '1px solid rgba(69, 223, 177, 0.2)',
                paddingBottom: '15px'
            }}>
                <h3 style={{
                    color: '#E0F2F1',
                    fontSize: '22px',
                    fontWeight: '600',
                    margin: '0'
                }}>
                    {activeTab === 'activities' ? 'Fil d\'actualités' : 'Événements communautaires'}
                </h3>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setActiveTab('activities')}
                        style={{
                            background: activeTab === 'activities' ? '#45DFB1' : 'rgba(69, 223, 177, 0.2)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 15px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        title="Activités récentes"
                    >
                        🏃‍♂️
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        style={{
                            background: activeTab === 'events' ? '#45DFB1' : 'rgba(69, 223, 177, 0.2)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 15px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        title="Événements communautaires"
                    >
                        📅
                    </button>
                </div>
            </div>

            {/* Contenu */}
            <div style={{ maxHeight: '900px', overflowY: 'auto', paddingRight: '10px' }}>
                {activeTab === 'activities' ? (
                    // --- Activités mock ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {activities.map((activity) => (
                            <div key={activity.id} style={{
                                backgroundColor: '#E0F2F1',
                                borderRadius: '15px',
                                padding: '20px',
                                color: '#213A57'
                            }}>
                                <b>{activity.user}</b> — {activity.activity}
                                <p>{activity.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    // --- Événements backend ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {events.map((event) => (
                            <div key={event.id} style={{
                                backgroundColor: '#E0F2F1',
                                borderRadius: '15px',
                                padding: '20px',
                                color: '#213A57'
                            }}>
                                {/* Header de l'événement */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '15px'
                                }}>
                                    <div>
                                        <div style={{
                                            fontWeight: '600',
                                            fontSize: '16px',
                                            marginBottom: '2px'
                                        }}>
                                            {event.title}
                                        </div>
                                        <div style={{ color: '#14919B', fontSize: '13px' }}>
                                            {event.description}
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: getDifficultyColor(event.type),
                                        color: '#FFFFFF',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {event.type || 'N/A'}
                                    </div>
                                </div>

                                {/* Infos */}
                                <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                                    📍 {event.location ?? '-'}<br/>
                                    📏 {event.kilometre ?? '-'} km — ⏱ {event.allure_visee ?? '-'}
                                </div>

                                {/* Dates */}
                                <div style={{ fontSize: '13px', color: '#14919B', marginBottom: '10px' }}>
                                    Début : {event.start_time ? new Date(event.start_time).toLocaleString() : '-'} <br />
                                    Fin : {event.end_time ? new Date(event.end_time).toLocaleString() : '-'}
                                </div>

                                {/* Bouton */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => joinEvent(event.id)}
                                        style={{
                                            background: '#45DFB1',
                                            color: '#213A57',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Rejoindre
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
