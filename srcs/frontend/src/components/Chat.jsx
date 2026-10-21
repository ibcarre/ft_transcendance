import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { inputClass, btnPrimary } from '../styles/ui';

const mockMessages = [
    { id: 1, author: "Demahom 1", body: "Salut tout le monde !", sentAt: "2026-10-20T14:02:00" },
    { id: 2, author: "Demahom 2", body: "Quelqu'un pour une partie de Skyjo ?", sentAt: "2026-10-20T14:03:00" },
    { id: 3, author: "Demahom 3", body: "Je suis chaud, je crée une room", sentAt: "2026-10-20T14:04:00" },
    { id: 4, author: "Demahom 1", body: "Go, mets un mot de passe stp", sentAt: "2026-10-20T14:05:00" },
    { id: 5, author: "Demahom 4", body: "Je vous rejoins dans 5 min", sentAt: "2026-10-20T14:07:00" }
];

// embedded : version intégrée dans une colonne (page game) au lieu d'une modal
export function Chat({ embedded = false }) {
    const { userInfo } = useAuth();
    const [messages, setMessages] = useState(mockMessages);
    const [input, setInput] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        const body = input.trim();
        if (!body) return;

        setMessages((prev) => [
            ...prev,
            { id: Date.now(), author: userInfo.name, body, sentAt: dayjs().toISOString() }
        ]);
        setInput('');
    };

    return (
        <div className={`box-border flex w-full flex-col ${embedded ? 'gap-4' : 'gap-5 p-2.5 sm:w-[450px]'}`}>

            <div className={`flex flex-col gap-3.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 pr-2 ${embedded ? 'h-80' : 'h-[50vh] sm:h-[400px]'}`} ref={listRef}>
                {messages.map((msg) => {
                    const isMine = msg.author === userInfo.name;
                    return (
                        <div key={msg.id} className={`flex max-w-[80%] shrink-0 flex-col gap-1 ${isMine ? 'items-end self-end' : 'items-start'}`}>
                            {!isMine && <p className="pl-1 text-[13px] font-bold text-blue-900">{msg.author}</p>}
                            <div className={`flex flex-col gap-1 rounded-xl border px-3.5 py-2.5 ${isMine ? 'rounded-tr-sm border-blue-500 bg-blue-500' : 'rounded-tl-sm border-slate-200 bg-white'}`}>
                                <p className={`break-words text-[15px] ${isMine ? 'text-white' : 'text-slate-800'}`}>{msg.body}</p>
                                <p className={`self-end text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{dayjs(msg.sentAt).format('HH:mm')}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <form className="flex gap-3" onSubmit={sendMessage}>
                <input
                    placeholder="Write a message"
                    className={inputClass}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                />
                <button type="submit" className={`${btnPrimary} px-4 py-3 text-sm sm:px-6`}>SEND</button>
            </form>

        </div>
    );
}
