import React, { useState } from 'react';

const ActivityFeed = () => {
    const [activeTab, setActiveTab] = useState('activities'); // 'activities' ou 'events'

    // Données des activités récentes et populaires
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
            image: null, // Espace pour image
            description: "Belle session matinale ! Le temps était parfait pour courir 🏃‍♂️"
        },
        {
            id: 2,
            user: "Sophie Martin",
            avatar: "S",
            time: "il y a 4h",
            activity: "Trail en forêt",
            location: "Forêt de Fontainebleau",
            distance: "12.3 km",
            duration: "1h18:30",
            likes: 45,
            comments: 12,
            isLiked: true,
            image: null,
            description: "Trail technique aujourd'hui ! Les dénivelés étaient au rendez-vous 💪"
        },
        {
            id: 3,
            user: "Thomas Leblanc",
            avatar: "T",
            time: "il y a 6h",
            activity: "Course urbaine",
            location: "Berges de Seine",
            distance: "10.0 km",
            duration: "48:22",
            likes: 18,
            comments: 5,
            isLiked: false,
            image: null,
            description: "Première fois sur ce parcours, très sympa ! Merci pour les conseils 👍"
        },
        {
            id: 4,
            user: "Emma Rodriguez",
            avatar: "E",
            time: "il y a 8h",
            activity: "Course longue",
            location: "Bois de Boulogne",
            distance: "15.2 km",
            duration: "1h22:45",
            likes: 67,
            comments: 18,
            isLiked: true,
            image: null,
            description: "Préparation semi-marathon ! Je sens que ça progresse bien 🎯"
        },
        {
            id: 5,
            user: "Lucas Moreau",
            avatar: "L",
            time: "il y a 1 jour",
            activity: "Fractionné",
            location: "Stade Charléty",
            distance: "6.8 km",
            duration: "35:12",
            likes: 31,
            comments: 9,
            isLiked: false,
            image: null,
            description: "Séance de fractionné intense ! 8x400m, je suis cuit mais content 🔥"
        }
    ];

    // Données des événements communautaires
    const events = [
        {
            id: 1,
            organizer: "Club Running Paris",
            avatar: "C",
            title: "Sortie longue dominicale",
            date: "Dimanche 24 septembre",
            time: "08:00",
            location: "Château de Vincennes",
            distance: "15-20 km",
            pace: "5:00-5:30/km",
            participants: 12,
            maxParticipants: 20,
            difficulty: "Intermédiaire",
            description: "Sortie en groupe pour préparer les courses d'automne. Allure confortable.",
            isJoined: false
        },
        {
            id: 2,
            organizer: "Sarah Chen",
            avatar: "S",
            title: "Entraînement fractionné",
            date: "Mercredi 27 septembre",
            time: "19:30",
            location: "Stade Jean Bouin",
            distance: "8 km",
            pace: "4:00-4:30/km",
            participants: 8,
            maxParticipants: 15,
            difficulty: "Avancé",
            description: "Séance de vitesse : échauffement + 6x1000m + récupération",
            isJoined: true
        },
        {
            id: 3,
            organizer: "Team Trail Île-de-France",
            avatar: "T",
            title: "Découverte trail débutant",
            date: "Samedi 30 septembre",
            time: "14:00",
            location: "Forêt de Sénart",
            distance: "8-10 km",
            pace: "6:00-6:30/km",
            participants: 15,
            maxParticipants: 25,
            difficulty: "Débutant",
            description: "Première approche du trail sur sentiers faciles. Matériel de base suffisant.",
            isJoined: false
        },
        {
            id: 4,
            organizer: "Marie Dubois",
            avatar: "M",
            title: "Course matinale récupération",
            date: "Vendredi 29 septembre",
            time: "07:00",
            location: "Parc Montsouris",
            distance: "6-8 km",
            pace: "5:30-6:00/km",
            participants: 6,
            maxParticipants: 12,
            difficulty: "Facile",
            description: "Footing tranquille pour bien commencer la journée. Café après la course !",
            isJoined: false
        }
    ];

    const toggleLike = (activityId) => {
        // Logique pour liker/unliker une activité
        console.log(`Toggle like for activity ${activityId}`);
    };

    const joinEvent = (eventId) => {
        // Logique pour rejoindre un événement
        console.log(`Join event ${eventId}`);
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
            {/* Header avec onglets emoji */}
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
                
                <div style={{
                    display: 'flex',
                    gap: '10px'
                }}>
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

            {/* Contenu des onglets */}
            <div style={{
                maxHeight: '900px',
                overflowY: 'auto',
                paddingRight: '10px'
            }}>
                {activeTab === 'activities' ? (
                    // Onglet Activités
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {activities.map((activity) => (
                            <div key={activity.id} style={{
                                backgroundColor: '#E0F2F1',
                                borderRadius: '15px',
                                padding: '20px',
                                color: '#213A57'
                            }}>
                                {/* Header de l'activité */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #45DFB1, #14919B)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: '#E0F2F1',
                                        fontSize: '18px'
                                    }}>
                                        {activity.avatar}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: '600',
                                            fontSize: '16px',
                                            marginBottom: '2px'
                                        }}>
                                            {activity.user}
                                        </div>
                                        <div style={{
                                            color: '#14919B',
                                            fontSize: '14px'
                                        }}>
                                            {activity.time} • {activity.location}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p style={{
                                    margin: '0 0 15px 0',
                                    fontSize: '15px',
                                    lineHeight: '1.4'
                                }}>
                                    {activity.description}
                                </p>

                                {/* Espace pour image */}
                                <div style={{
                                    width: '100%',
                                    height: '180px',
                                    backgroundColor: 'rgba(69, 223, 177, 0.1)',
                                    borderRadius: '10px',
                                    marginBottom: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #45DFB1',
                                    fontSize: '14px',
                                    color: '#14919B'
                                }}>
                                    Espace image activité - {activity.activity}
                                </div>

                                {/* Statistiques de l'activité */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '15px',
                                    marginBottom: '15px',
                                    padding: '15px',
                                    backgroundColor: 'rgba(69, 223, 177, 0.1)',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: '#213A57'
                                        }}>
                                            {activity.distance}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#14919B'
                                        }}>
                                            DISTANCE
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: '#213A57'
                                        }}>
                                            {activity.duration}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#14919B'
                                        }}>
                                            DURÉE
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: '#213A57'
                                        }}>
                                            {activity.activity}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#14919B'
                                        }}>
                                            TYPE
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (likes, commentaires) */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid rgba(69, 223, 177, 0.2)',
                                    paddingTop: '15px'
                                }}>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <button
                                            onClick={() => toggleLike(activity.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                cursor: 'pointer',
                                                color: activity.isLiked ? '#FF6B6B' : '#14919B',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {activity.isLiked ? '❤️' : '🤍'} {activity.likes}
                                        </button>
                                        <button style={{
                                            background: 'none',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            cursor: 'pointer',
                                            color: '#14919B',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}>
                                            💬 {activity.comments}
                                        </button>
                                    </div>
                                    <button style={{
                                        background: '#45DFB1',
                                        color: '#213A57',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                        Voir le parcours
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Onglet Événements
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
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #45DFB1, #14919B)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            color: '#E0F2F1',
                                            fontSize: '16px'
                                        }}>
                                            {event.avatar}
                                        </div>
                                        <div>
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '16px',
                                                marginBottom: '2px'
                                            }}>
                                                {event.title}
                                            </div>
                                            <div style={{
                                                color: '#14919B',
                                                fontSize: '13px'
                                            }}>
                                                Organisé par {event.organizer}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        backgroundColor: getDifficultyColor(event.difficulty),
                                        color: '#FFFFFF',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {event.difficulty}
                                    </div>
                                </div>

                                {/* Informations de l'événement */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    marginBottom: '12px',
                                    fontSize: '14px'
                                }}>
                                    <div>📅 {event.date} à {event.time}</div>
                                    <div>📍 {event.location}</div>
                                    <div>📏 {event.distance}</div>
                                    <div>⏱️ Allure: {event.pace}</div>
                                </div>

                                {/* Description */}
                                <p style={{
                                    margin: '0 0 15px 0',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    color: '#14919B'
                                }}>
                                    {event.description}
                                </p>

                                {/* Footer avec participants et action */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid rgba(69, 223, 177, 0.2)',
                                    paddingTop: '12px'
                                }}>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#14919B'
                                    }}>
                                        👥 {event.participants}/{event.maxParticipants} participants
                                    </div>
                                    
                                    <button
                                        onClick={() => joinEvent(event.id)}
                                        style={{
                                            background: event.isJoined ? '#14919B' : '#45DFB1',
                                            color: event.isJoined ? '#E0F2F1' : '#213A57',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {event.isJoined ? 'Inscrit ✓' : 'Rejoindre'}
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