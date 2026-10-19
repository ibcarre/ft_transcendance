import { useState } from "react";
import './Friends.css';

const mockRequests = [
    { id: 1, name: "New friend 1" },
    { id: 2, name: "New friend 2" },
    { id: 3, name: "New friend 3" }
];

const mockFriends = [
    { id: 101, name: "Demahom 1" },
    { id: 102, name: "Demahom 2" },
    { id: 103, name: "Demahom 3" },
    { id: 104, name: "Demahom 4" },
    { id: 105, name: "Demahom 5" }
];

export function Friends() {
    const [requests, setRequests] = useState(mockRequests);
    const [friendsList, setFriendsList] = useState(mockFriends);

    return (
        <div className="friend-container">

            <div className="add-friend-section">
                <input placeholder="Add a friend" className="friend-input" />
                <button className="action-button add-btn">ADD</button>
            </div>

            {requests.length > 0 && (
                <div className="friend-section">
                    <p className="section-title">Friend request</p>

                    <div className="friends-list-container requests-container">
                        {requests.map((req) => (
                            <div key={req.id} className="friend-item request-item">
                                <p className="friend-name">{req.name}</p>
                                <div className="friend-actions">
                                    <button className="action-button accept-btn">✔</button>
                                    <button className="action-button refuse-btn">✖</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="friend-section">
                <p className="section-title">Friend list</p>
                <div className="friends-list-container">
                    {friendsList.map((friend) => (
                        <div key={friend.id} className="friend-item">
                            <p className="friend-name">{friend.name}</p>
                            <div className="friend-actions">
                                <button className="action-button chat-btn">Chat</button>
                                <button className="action-button delete-btn">✖</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}