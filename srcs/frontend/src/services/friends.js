import axios from 'axios';

// Le back renvoie un corps vide (et non []) quand la liste est vide
const toIds = (data) => (Array.isArray(data) ? data : []);

// /friends/list, /friends/invites et les sockets ne donnent que des ids : on récupère le profil
export const fetchProfile = async (id) => {
    try {
        const { data } = await axios.get(`/api/friends/profile/${id}`, { withCredentials: true });
        return { id, ...data };
    } catch {
        return { id, name: "Unknown user", status: "offline" };
    }
};

const fetchProfiles = (ids) => Promise.all(ids.map(fetchProfile));

// Amis en ligne en premier, puis ordre alphabétique
export const sortFriends = (list) => [...list].sort((a, b) =>
    (a.status === 'online' ? 0 : 1) - (b.status === 'online' ? 0 : 1) || a.name.localeCompare(b.name));

// Charge amis + invitations reçues, avec le profil (nom, statut) de chacun
export const fetchFriendsData = async () => {
    const [friendsRes, invitesRes] = await Promise.all([
        axios.get('/api/friends/list', { withCredentials: true }),
        axios.get('/api/friends/invites', { withCredentials: true }),
    ]);
    const [friends, invites] = await Promise.all([
        fetchProfiles(toIds(friendsRes.data)),
        fetchProfiles(toIds(invitesRes.data)),
    ]);
    return { friends: sortFriends(friends), invites };
};

// Invitation (201 "Invite sent") ; si la personne nous avait déjà invité : 200 "Friendship accepted"
export const sendFriendRequest = (friendUsername) =>
    axios.post('/api/friends/add', { friendUsername }, { withCredentials: true }).then((res) => res.data?.message);
