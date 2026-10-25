import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import dayjs from 'dayjs';
import { useAuth } from '../context/useAuth';
import { useChat } from '../context/useChat';
import { Avatar } from './Avatar';
import { inputClass, btnPrimary, logoGradientHover } from '../styles/ui';

const infoText = "m-auto text-center text-sm text-slate-400";

// embedded : version intégrée dans une colonne (page game) au lieu d'une modal
// onNavigate : appelé quand on ouvre un profil (ferme la modal)
export function Chat({ embedded = false, onNavigate }) {
    const { userInfo } = useAuth();
    // Messages partagés et reçus en temps réel par ChatProvider (socket /globalChat)
    const { messages, connected, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (sendMessage(input)) setInput('');
    };

    return (
        <div className={`box-border flex w-full flex-col ${embedded ? 'gap-4' : 'gap-5 p-2.5 sm:w-[450px]'}`}>

            <div className={`flex flex-col gap-3.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 pr-2 ${embedded ? 'h-80' : 'h-[50vh] sm:h-[400px]'}`} ref={listRef}>
                {!connected && <p className={infoText}>Connecting...</p>}
                {connected && messages.length === 0 && <p className={infoText}>No messages yet, say hi!</p>}

                {messages.map((msg) => {
                    const isMine = msg.userId === userInfo.id;
                    // Lien vers le profil de l'auteur, une fois son nom chargé
                    const profileLink = msg.author ? `/profile/${encodeURIComponent(msg.author.name)}` : null;
                    const avatar = <Avatar file={msg.author?.avatar} alt={msg.author?.name ?? 'Avatar'} className="size-9" />;
                    return (
                        <div key={msg.id} className={`flex max-w-[85%] shrink-0 flex-col gap-1 ${isMine ? 'items-end self-end' : 'items-start'}`}>
                            {/* Nom aligné sur la bulle (décalé de la largeur de l'avatar) */}
                            {!isMine && (profileLink
                                ? <Link to={profileLink} onClick={onNavigate} title="See profile" className={`ml-11 text-[13px] font-bold text-blue-900 ${logoGradientHover}`}>{msg.author.name}</Link>
                                : <p className="pl-11 text-[13px] font-bold text-blue-900">...</p>)}
                            <div className="flex min-w-0 items-start gap-2">
                                {!isMine && (profileLink
                                    ? <Link to={profileLink} onClick={onNavigate} tabIndex={-1} className="shrink-0">{avatar}</Link>
                                    : <span className="shrink-0">{avatar}</span>)}
                                <div className={`flex min-w-0 flex-col gap-1 rounded-xl border px-3.5 py-2.5 ${isMine ? 'rounded-tr-sm border-blue-500 bg-blue-500' : 'rounded-tl-sm border-slate-200 bg-white'}`}>
                                    <p className={`break-words text-[15px] ${isMine ? 'text-white' : 'text-slate-800'}`}>{msg.body}</p>
                                    <p className={`self-end text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{dayjs(msg.sentAt).format('HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <form className="flex gap-3" onSubmit={handleSubmit}>
                <input
                    placeholder="Write a message"
                    className={inputClass}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                />
                <button
                    type="submit"
                    className={`${btnPrimary} px-4 py-3 text-sm sm:px-6`}
                    disabled={!connected || !input.trim()}>
                    SEND
                </button>
            </form>

        </div>
    );
}
