import { useState } from "react";
import { inputClass, btnPrimary } from '../styles/ui';

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

const sectionTitle = "border-b-2 border-slate-200 pb-2 text-lg font-bold text-slate-800";
const listContainer = "flex flex-col gap-2.5 overflow-y-auto pr-2";
const friendItem = "flex shrink-0 items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors";
const friendName = "truncate text-base font-bold text-slate-800";
const actionButton = "cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5";

export function Friends() {
    const [requests, setRequests] = useState(mockRequests);
    const [friendsList, setFriendsList] = useState(mockFriends);

    return (
        <div className="box-border flex w-full flex-col gap-8 p-2.5 sm:w-[400px]">

            <div className="flex gap-3">
                <input placeholder="Add a friend" className={inputClass} />
                <button className={`${btnPrimary} px-4 py-3 text-sm sm:px-6`}>ADD</button>
            </div>

            {requests.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className={sectionTitle}>Friend request</p>

                    <div className={`${listContainer} max-h-[150px]`}>
                        {requests.map((req) => (
                            <div key={req.id} className={`${friendItem} border-yellow-200 bg-yellow-50`}>
                                <p className={friendName}>{req.name}</p>
                                <div className="flex shrink-0 gap-2">
                                    <button className={`${actionButton} bg-green-500 hover:bg-green-600`}>✔</button>
                                    <button className={`${actionButton} bg-red-500 hover:bg-red-600`}>✖</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <p className={sectionTitle}>Friend list</p>
                <div className={`${listContainer} max-h-[250px]`}>
                    {friendsList.map((friend) => (
                        <div key={friend.id} className={`${friendItem} border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100`}>
                            <p className={friendName}>{friend.name}</p>
                            <div className="flex shrink-0 gap-2">
                                <button className={`${actionButton} bg-blue-500 hover:bg-blue-600`}>Chat</button>
                                <button className={`${actionButton} bg-red-500 hover:bg-red-600`}>✖</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
