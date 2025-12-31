import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../hooks/AuthStore";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "https://backend.riseupmotion.com").replace(/\/$/, "");
const TABS = [
  { key: "events", label: "Événements" },
  { key: "groups", label: "Groupes & amis" },
];

export default function EventChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, fetchUser, isFetchingUser } = useAuthStore();

  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [pendingInvites, setPendingInvites] = useState({ incoming: [], outgoing: [] });
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendResults, setFriendResults] = useState([]);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState("");
  const [friendError, setFriendError] = useState("");
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [selectedFriendshipId, setSelectedFriendshipId] = useState(null);
  const selectedFriendship = useMemo(
    () => friends.find((f) => f.id === selectedFriendshipId) || null,
    [friends, selectedFriendshipId]
  );

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  useEffect(() => {
    fetch(`${API_BASE}/api/user/events`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Non autorisé");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        const eventFromUrl = data.find((ev) => ev.id === Number(id));
        if (eventFromUrl) {
          setSelectedEvent(eventFromUrl);
        } else if (!id && data.length > 0) {
          setSelectedEvent(data[0]);
          navigate(`/events/chat/${data[0].id}`, { replace: true });
        }
      })
      .catch((err) => console.error("Erreur fetch events:", err));
  }, [id, navigate]);

useEffect(() => {
  if (!user) return;
  fetch(`${API_BASE}/api/groups/my`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Non autorisé");
        return res.json();
      })
      .then((data) => setGroups(data))
      .catch((err) => console.error("Erreur fetch groups:", err));
}, [user]);

  const refreshFriendships = useCallback(() => {
    Promise.all([
      fetch(`${API_BASE}/api/friends`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch(`${API_BASE}/api/friends/pending`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : { incoming: [], outgoing: [] }))
        .catch(() => ({ incoming: [], outgoing: [] })),
    ])
      .then(([friendsList, pending]) => {
        const normalizedFriends = Array.isArray(friendsList) ? friendsList : [];
        setFriends(normalizedFriends);
        setSelectedFriendshipId((current) => {
          if (!current) return current;
          return normalizedFriends.some((friendship) => friendship.id === current)
            ? current
            : null;
        });
        setPendingInvites({
          incoming: pending?.incoming || [],
          outgoing: pending?.outgoing || [],
        });
      })
      .catch((err) => console.error("Erreur fetch amitiés:", err));
  }, []);

  useEffect(() => {
    if (user) {
      refreshFriendships();
    }
  }, [user, refreshFriendships]);

  useEffect(() => {
    if (!showFriendModal) {
      setFriendSearch("");
      setFriendResults([]);
      setFriendFeedback("");
      setFriendError("");
      return;
    }
    refreshFriendships();
  }, [showFriendModal, refreshFriendships]);

  useEffect(() => {
    if (!showFriendModal) return;
    const term = friendSearch.trim();
    if (term.length < 2) {
      setFriendResults([]);
      setFriendSearchLoading(false);
      return;
    }

    setFriendSearchLoading(true);
    setFriendError("");
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/friends/search?q=${encodeURIComponent(term)}`, {
        credentials: "include",
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Recherche impossible");
          return res.json();
        })
        .then((results) => setFriendResults(results || []))
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.error(err);
          setFriendError("Recherche impossible pour le moment.");
        })
        .finally(() => setFriendSearchLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setFriendSearchLoading(false);
    };
  }, [friendSearch, showFriendModal]);

useEffect(() => {
  if (activeTab === "events" && events.length > 0 && !selectedEvent) {
    setSelectedEvent(events[0]);
  }
  if (activeTab === "groups") {
    if (!selectedGroup && !selectedFriendship && groups.length > 0) {
      setSelectedGroup(groups[0]);
    } else if (
      !selectedGroup &&
      !selectedFriendship &&
      groups.length === 0 &&
      friends.length > 0
    ) {
      setSelectedFriendshipId((current) => current ?? friends[0].id);
    }
  }
}, [
  activeTab,
  groups,
  events,
  friends,
  selectedGroup,
  selectedEvent,
  selectedFriendship,
]);

  useEffect(() => {
    let intervalId = null;
    const fetchEventMessages = () => {
      if (!selectedEvent) return;
      fetch(`${API_BASE}/api/events/${selectedEvent.id}/messages`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setMessages)
        .catch((err) => console.error("Erreur messages events:", err));
    };
    const fetchGroupMessages = () => {
      if (!selectedGroup) return;
      fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setMessages)
        .catch((err) => console.error("Erreur messages groupes:", err));
    };
    const fetchFriendMessages = () => {
      if (!selectedFriendship) return;
      fetch(`${API_BASE}/api/friends/${selectedFriendship.id}/messages`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setMessages)
        .catch((err) => console.error("Erreur messages amis:", err));
    };

    if (activeTab === "events" && selectedEvent) {
      fetchEventMessages();
      intervalId = setInterval(fetchEventMessages, 5000);
    } else if (activeTab === "groups" && selectedGroup) {
      fetchGroupMessages();
      intervalId = setInterval(fetchGroupMessages, 5000);
    } else if (activeTab === "groups" && selectedFriendship) {
      fetchFriendMessages();
      intervalId = setInterval(fetchFriendMessages, 5000);
    } else {
      setMessages([]);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, selectedEvent, selectedGroup, selectedFriendship]);

  function handleSelectEvent(event) {
    setSelectedEvent(event);
    setActiveTab("events");
    setSelectedGroup(null);
    setSelectedFriendshipId(null);
    setMessages([]);
    navigate(`/events/chat/${event.id}`);
  }

  function handleSelectGroup(group) {
    setSelectedGroup(group);
    setActiveTab("groups");
    setSelectedEvent(null);
    setSelectedFriendshipId(null);
    setMessages([]);
  }

  function handleSelectFriend(friendship) {
    setSelectedFriendshipId(friendship.id);
    setActiveTab("groups");
    setSelectedEvent(null);
    setSelectedGroup(null);
    setMessages([]);
  }

  const formatUserDisplay = (person) => {
    if (!person) return "Utilisateur";
    if (person.first_name || person.last_name) {
      return `${person.first_name || ""} ${person.last_name || ""}`.trim();
    }
    return person.name || person.email || "Utilisateur";
  };

  async function fetchCsrfToken() {
    await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: "include" });
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];
    return token ? decodeURIComponent(token) : "";
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    let endpoint = null;
    if (activeTab === "events" && selectedEvent) {
      endpoint = `${API_BASE}/api/events/${selectedEvent.id}/messages`;
    } else if (activeTab === "groups" && selectedGroup) {
      endpoint = `${API_BASE}/api/groups/${selectedGroup.id}/messages`;
    } else if (activeTab === "groups" && selectedFriendship) {
      endpoint = `${API_BASE}/api/friends/${selectedFriendship.id}/messages`;
    }
    if (!endpoint) return;

    try {
      const token = await fetchCsrfToken();
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": token,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (!res.ok) {
        console.error("Erreur envoi message", res.status);
        return;
      }

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteMessage(messageId) {
    if (!messageId) return;
    if (!(activeTab === "events" && selectedEvent)) return;

    try {
      const token = await fetchCsrfToken();
      const res = await fetch(
        `${API_BASE}/api/events/${selectedEvent.id}/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-XSRF-TOKEN": token,
          },
        }
      );

      if (!res.ok) {
        console.error("Erreur suppression message", res.status);
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendFriendRequest(friendId) {
    if (!friendId) return;
    try {
      setFriendError("");
      setFriendFeedback("");
      setFriendActionLoading(true);
      const token = await fetchCsrfToken();
      const res = await fetch(`${API_BASE}/api/friends`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": token,
        },
        body: JSON.stringify({ friend_id: friendId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const message =
          errData?.message ||
          errData?.errors?.friend_id?.[0] ||
          "Impossible d'envoyer l'invitation.";
        throw new Error(message);
      }

      setFriendFeedback("Invitation envoyée !");
      setFriendSearch("");
      setFriendResults([]);
      refreshFriendships();
    } catch (err) {
      console.error(err);
      setFriendError(err.message || "Impossible d'envoyer l'invitation.");
    } finally {
      setFriendActionLoading(false);
    }
  }

  async function handleRespondFriendship(friendshipId, action) {
    if (!friendshipId || !["accept", "reject"].includes(action)) return;
    try {
      setFriendError("");
      setFriendActionLoading(true);
      const token = await fetchCsrfToken();
      const res = await fetch(
        `${API_BASE}/api/friends/${friendshipId}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": token,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Action impossible pour le moment.");
      }

      refreshFriendships();
    } catch (err) {
      console.error(err);
      setFriendError(err.message || "Action impossible.");
    } finally {
      setFriendActionLoading(false);
    }
  }

  if (isFetchingUser) {
    return <Centered>Chargement de votre profil...</Centered>;
  }

  if (!user) {
    return <Centered>Vous devez être connecté pour accéder aux discussions.</Centered>;
  }

  const conversationTitle = activeTab === "events"
    ? selectedEvent?.title
    : selectedGroup
      ? selectedGroup?.name
      : selectedFriendship
        ? formatUserDisplay(selectedFriendship.friend)
        : null;

  const conversationSubtitle = (() => {
    if (activeTab === "events" && selectedEvent) {
      return selectedEvent?.description;
    }
    if (activeTab === "groups" && selectedGroup) {
      return `${selectedGroup?.members?.length || 0} athlètes`;
    }
    if (activeTab === "groups" && selectedFriendship) {
      return "Conversation privée";
    }
    return "";
  })();

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <div style={tabStyle}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...tabButtonStyle,
                background: activeTab === tab.key ? "#213A57" : "transparent",
                color: activeTab === tab.key ? "#E0F2F1" : "#213A57",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={listStyle}>
          {activeTab === "events" ? (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                style={{
                  ...listItemStyle,
                  borderColor:
                    selectedEvent?.id === event.id ? "#45DFB1" : "transparent",
                }}
              >
                <span>{event.title}</span>
                <small>Rang {event.training_rank}</small>
              </button>
            ))
          ) : (
            <>
              <div style={friendHeaderStyle}>
                <span style={sectionTitleStyle}>Vos amis</span>
                <button
                  style={friendAddButton}
                  onClick={() => setShowFriendModal(true)}
                >
                  Ajouter un ami
                </button>
              </div>
              {friends.length === 0 ? (
                <p style={mutedTextStyle}>
                  Aucun ami pour le moment. Envoyez une invitation pour commencer
                  une discussion privée.
                </p>
              ) : (
                friends.map((friendship) => (
                  <button
                    key={`friend-${friendship.id}`}
                    onClick={() => handleSelectFriend(friendship)}
                    style={{
                      ...listItemStyle,
                      borderColor:
                        selectedFriendship?.id === friendship.id
                          ? "#45DFB1"
                          : "transparent",
                    }}
                  >
                    <span>{formatUserDisplay(friendship.friend)}</span>
                    <small>
                      {friendship.since
                        ? `Ami depuis ${new Date(
                            friendship.since
                          ).toLocaleDateString()}`
                        : "Ami confirmé"}
                    </small>
                  </button>
                ))
              )}
              <div style={sectionDividerStyle}>Vos groupes</div>
              {groups.length === 0 ? (
                <p style={mutedTextStyle}>
                  Vous n'appartenez à aucun groupe pour le moment.
                </p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    style={{
                      ...listItemStyle,
                      borderColor:
                        selectedGroup?.id === group.id
                          ? "#45DFB1"
                          : "transparent",
                    }}
                  >
                    <span>{group.name}</span>
                    <small>{group.members?.length || 0} athlètes</small>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <div style={chatPaneStyle}>
        {conversationTitle ? (
          <>
            <div style={chatHeaderStyle}>
              <div>
                <h2>{conversationTitle}</h2>
                {conversationSubtitle && (
                  <p style={{ color: "#94A3B8" }}>{conversationSubtitle}</p>
                )}
              </div>
              {activeTab === "events" && selectedEvent && (
                <button style={infoButtonStyle} onClick={() => setShowEventInfo(true)}>
                  Infos
                </button>
              )}
            </div>

              <div style={messageListStyle}>
              {messages.map((msg) => {
                const isOwnMessage =
                  msg.user_id === user.id || msg.sender_id === user.id;
                const isEventOwner =
                  activeTab === "events" &&
                  selectedEvent &&
                  selectedEvent.created_by === user?.id;
                const canDelete = isOwnMessage || isEventOwner;
                return (
                  <div
                    key={msg.id}
                    style={isOwnMessage ? userMessageStyle : otherMessageStyle}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ margin: 0, flex: 1 }}>{msg.message}</p>
                      {canDelete && (
                        <button
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onClick={() => deleteMessage(msg.id)}
                          title="Supprimer ce message"
                        >
                          ×
                          <span style={{ fontSize: 12 }}>Supprimer</span>
                        </button>
                      )}
                    </div>
                    <small>{new Date(msg.created_at).toLocaleString()}</small>
                  </div>
                );
              })}
            </div>

            <div style={composerStyle}>
              <input
                style={inputStyle}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Votre message"
              />
              <button style={sendButtonStyle} onClick={sendMessage}>
                Envoyer
              </button>
            </div>
          </>
        ) : (
          <Centered>
            {activeTab === "events" ? (
              <div style={{ textAlign: "center", maxWidth: 320 }}>
                <p>Créez ou participez à votre premier run communautaire.</p>
                <a href="/trouver" style={{
                  display: "inline-block",
                  marginTop: 12,
                  background: "#14919B",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 9999,
                  textDecoration: "none",
                  fontWeight: 600,
                }}>
                  Découvrir les événements
                </a>
              </div>
            ) : (
              "Choisissez un salon de discussion."
            )}
          </Centered>
        )}
      </div>

      {showFriendModal && (
        <div style={modalOverlay} onClick={() => setShowFriendModal(false)}>
          <div
            style={friendModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={modalClose} onClick={() => setShowFriendModal(false)}>
              ×
            </button>
            <h2>Ajouter un ami</h2>
            <p style={{ color: "#475569" }}>
              Recherchez un utilisateur par son prénom, nom ou email pour lui
              envoyer une invitation.
            </p>
            <input
              style={friendSearchInput}
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Ex. Léa Martin ou lea@example.com"
            />
            <div style={friendResultsWrapper}>
              {friendSearch.trim().length < 2 ? (
                <p style={mutedTextStyle}>
                  Tapez au moins deux lettres pour lancer la recherche.
                </p>
              ) : friendSearchLoading ? (
                <p style={mutedTextStyle}>Recherche en cours...</p>
              ) : friendResults.length === 0 ? (
                <p style={mutedTextStyle}>Aucun résultat.</p>
              ) : (
                friendResults.map((person) => (
                  <div key={person.id} style={friendResultRow}>
                    <div>
                      <strong>{formatUserDisplay(person)}</strong>
                    </div>
                    <button
                      style={inviteButtonStyle}
                      onClick={() => handleSendFriendRequest(person.id)}
                      disabled={friendActionLoading}
                    >
                      Inviter
                    </button>
                  </div>
                ))
              )}
            </div>
            {friendFeedback && (
              <p style={successTextStyle}>{friendFeedback}</p>
            )}
            {friendError && <p style={errorTextStyle}>{friendError}</p>}

            <div style={pendingSectionStyle}>
              <h3>Invitations reçues</h3>
              {pendingInvites.incoming.length === 0 ? (
                <p style={mutedTextStyle}>Aucune invitation en attente.</p>
              ) : (
                pendingInvites.incoming.map((invite) => (
                  <div key={invite.id} style={friendResultRow}>
                    <div>
                      <strong>{formatUserDisplay(invite.user)}</strong>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        {new Date(invite.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={inviteButtonStyle}
                        onClick={() =>
                          handleRespondFriendship(invite.id, "accept")
                        }
                        disabled={friendActionLoading}
                      >
                        Accepter
                      </button>
                      <button
                        style={secondaryInviteButton}
                        onClick={() =>
                          handleRespondFriendship(invite.id, "reject")
                        }
                        disabled={friendActionLoading}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={pendingSectionStyle}>
              <h3>Invitations envoyées</h3>
              {pendingInvites.outgoing.length === 0 ? (
                <p style={mutedTextStyle}>Aucune invitation en cours.</p>
              ) : (
                pendingInvites.outgoing.map((invite) => (
                  <div key={invite.id} style={friendResultRow}>
                    <div>
                      <strong>{formatUserDisplay(invite.user)}</strong>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        Envoyée le{" "}
                        {new Date(invite.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={badgeStyle}>{invite.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showEventInfo && selectedEvent && (
        <div style={modalOverlay} onClick={() => setShowEventInfo(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <button style={modalClose} onClick={() => setShowEventInfo(false)}>
              ×
            </button>
            <h2>{selectedEvent.title}</h2>
            <p>{selectedEvent.description || "Aucune description"}</p>
            <p><strong>Type :</strong> {selectedEvent.type || "-"}</p>
            <p><strong>Allure :</strong> {selectedEvent.allure_visee || "-"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "90vh",
      color: "#213A57",
    }}>
      {children}
    </div>
  );
}

const containerStyle = {
  display: "flex",
  height: "90vh",
  background: "#F3F4F6",
  borderRadius: 16,
  overflow: "hidden",
};
const sidebarStyle = {
  width: "30%",
  borderRight: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
};
const tabStyle = {
  display: "flex",
  gap: 8,
  padding: 16,
};
const tabButtonStyle = {
  flex: 1,
  borderRadius: 9999,
  padding: "8px 12px",
  border: "1px solid #213A57",
  cursor: "pointer",
  fontWeight: 600,
};
const listStyle = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const listItemStyle = {
  borderRadius: 14,
  border: "2px solid transparent",
  padding: 12,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
};
const chatPaneStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: 24,
};
const chatHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const infoButtonStyle = {
  border: "1px solid #213A57",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
};
const messageListStyle = {
  flex: 1,
  marginTop: 16,
  padding: 16,
  background: "#fff",
  borderRadius: 16,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const userMessageStyle = {
  alignSelf: "flex-end",
  background: "#0F172A",
  color: "#F8FAFC",
  borderRadius: 16,
  padding: 12,
  maxWidth: "70%",
  textAlign: "right",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.3)",
};
const otherMessageStyle = {
  alignSelf: "flex-start",
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  color: "#0F172A",
  borderRadius: 16,
  padding: 12,
  maxWidth: "70%",
  textAlign: "left",
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
};
const composerStyle = {
  marginTop: 16,
  display: "flex",
  gap: 8,
};
const inputStyle = {
  flex: 1,
  borderRadius: 9999,
  border: "1px solid #cbd5f5",
  padding: "10px 16px",
};
const sendButtonStyle = {
  background: "#45DFB1",
  color: "#213A57",
  border: "none",
  borderRadius: 9999,
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99,
};
const modalCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  width: 360,
  position: "relative",
};
const friendModalCard = {
  ...modalCard,
  width: "min(640px, 90vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  paddingBottom: 32,
};
const modalClose = {
  position: "absolute",
  top: 8,
  right: 8,
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 18,
};
const friendHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
  gap: 12,
};
const sectionTitleStyle = {
  fontWeight: 600,
  color: "#0f172a",
};
const friendAddButton = {
  borderRadius: 9999,
  border: "1px solid #045D56",
  padding: "6px 16px",
  background: "#045D56",
  color: "#E0F2F1",
  cursor: "pointer",
  fontWeight: 600,
};
const mutedTextStyle = {
  color: "#64748b",
  fontSize: 14,
  margin: "4px 0 8px",
};
const sectionDividerStyle = {
  marginTop: 16,
  marginBottom: 8,
  fontWeight: 600,
  color: "#334155",
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: 0.5,
};
const friendSearchInput = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #cbd5f5",
  padding: "10px 14px",
  marginBottom: 12,
};
const friendResultsWrapper = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
  background: "#F8FAFC",
};
const friendResultRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #e2e8f0",
};
const inviteButtonStyle = {
  background: "#045D56",
  color: "#E0F2F1",
  border: "none",
  borderRadius: 9999,
  padding: "6px 12px",
  cursor: "pointer",
  fontWeight: 600,
};
const secondaryInviteButton = {
  ...inviteButtonStyle,
  background: "#e2e8f0",
  color: "#0f172a",
};
const pendingSectionStyle = {
  marginTop: 16,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 12,
};
const badgeStyle = {
  background: "#e0f2f1",
  color: "#045D56",
  borderRadius: 9999,
  padding: "4px 10px",
  fontSize: 12,
  textTransform: "capitalize",
};
const successTextStyle = {
  color: "#047857",
  fontWeight: 600,
};
const errorTextStyle = {
  color: "#b91c1c",
  fontWeight: 600,
};
