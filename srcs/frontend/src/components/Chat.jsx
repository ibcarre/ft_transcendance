import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

const mockMessages = [
    { id: 1, author: "Demahom 1", body: "Salut tout le monde !", sentAt: "2026-10-20T14:02:00" },
    { id: 2, author: "Demahom 2", body: "Quelqu'un pour une partie de Skyjo ?", sentAt: "2026-10-20T14:03:00" },
    { id: 3, author: "Demahom 3", body: "Je suis chaud, je crée une room", sentAt: "2026-10-20T14:04:00" },
    { id: 4, author: "Demahom 1", body: "Go, mets un mot de passe stp", sentAt: "2026-10-20T14:05:00" },
    { id: 5, author: "Demahom 4", body: "Je vous rejoins dans 5 min", sentAt: "2026-10-20T14:07:00" }
];

export function Chat() {
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
        <div className="chat-container">

            <div className="chat-messages" ref={listRef}>
                {messages.map((msg) => {
                    const isMine = msg.author === userInfo.name;
                    return (
                        <div key={msg.id} className={`chat-message ${isMine ? 'mine' : ''}`}>
                            {!isMine && <p className="chat-author">{msg.author}</p>}
                            <div className="chat-bubble">
                                <p className="chat-body">{msg.body}</p>
                                <p className="chat-time">{dayjs(msg.sentAt).format('HH:mm')}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <form className="chat-form" onSubmit={sendMessage}>
                <input
                    placeholder="Write a message"
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                />
                <button type="submit" className="chat-send-btn">SEND</button>
            </form>

        </div>
    );
}
