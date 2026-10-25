import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Header } from '../../components/Header';
import { PrivacyLink } from '../../components/PrivacyLink';
import { useAuth } from '../../context/useAuth';
import { fetchUserIdByName } from '../../services/stats';
import { errorMessage } from '../../services/user';
import { panel, btnPrimary, feedback } from '../../styles/ui';
import { Profile } from './Profile';

// Page /profile/<username> : retrouve l'id du joueur puis affiche son profil
export function ProfilePage() {
    const { username } = useParams();
    const { userInfo } = useAuth();

    // Après un changement de username, l'URL est mise à jour un peu après le contexte :
    // on garde l'ancien nom le temps que l'URL suive (sinon le profil se recharge et EDIT se ferme)
    const [names, setNames] = useState({ current: userInfo.name, previous: null });
    if (names.current !== userInfo.name) {
        setNames({ current: userInfo.name, previous: names.current });
    } else if (names.previous && username === userInfo.name) {
        setNames({ current: userInfo.name, previous: null });
    }

    // Mon profil : l'id est déjà connu
    if (username === userInfo.name || username === names.previous) {
        return <Profile key={userInfo.id} id={userInfo.id} />;
    }

    // key : on repart d'un état propre quand on change de joueur
    return <ResolveProfile key={username} username={username} />;
}

function ResolveProfile({ username }) {
    const { userInfo } = useAuth();
    const [id, setId] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        fetchUserIdByName(username)
            .then((res) => {
                if (!active) return;
                if (res) setId(res);
                else setNotFound(true);
            })
            .catch((err) => {
                if (!active) return;
                if (err.response?.status === 404) setNotFound(true);
                else setError(errorMessage(err, "Failed to load the profile"));
            });
        return () => { active = false; };
    }, [username]);

    if (id) return <Profile key={id} id={id} />;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6">
                <div className={`${panel} flex w-full max-w-md flex-col items-center gap-4 p-8 text-center`}>
                    {notFound ? (
                        <>
                            <p className="text-2xl font-bold text-slate-800">User not found</p>
                            <p className="break-all text-sm text-slate-600">No player is called "{username}".</p>
                            <Link
                                to={`/profile/${encodeURIComponent(userInfo.name)}`}
                                className={`${btnPrimary} block w-full py-3 text-base font-bold`}>
                                Back to my profile
                            </Link>
                        </>
                    ) : error ? (
                        <p className={`${feedback.error} mt-0 w-full`}>{error}</p>
                    ) : (
                        <p className="text-lg font-semibold text-slate-700">Loading...</p>
                    )}
                </div>
                <PrivacyLink />
            </div>
        </div>
    );
}
