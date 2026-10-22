import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { EditProfile } from './EditProfile';
import defaultPic from '../../assets/cartes_home.png';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/useAuth';
import { PrivacyLink } from '../../components/PrivacyLink';
import { panel, btnPrimary } from '../../styles/ui';

const matchItem = "flex items-center justify-between rounded-lg border-2 border-l-[6px] border-slate-800 bg-white px-4 py-3 text-lg font-extrabold text-slate-800 sm:px-6 sm:py-4 sm:text-2xl";
const matchDate = "font-semibold text-slate-500";

export function Profile() {
    const { userInfo } = useAuth();

    const [editModal, setEditModal] = useState(false);

    const closeModal = () => setEditModal(false);
    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6 sm:px-8 lg:px-[60px]">
                <div className={`${panel} box-border flex w-full max-w-[1400px] flex-col p-6 sm:p-10 lg:min-h-[700px] lg:px-20 lg:py-[60px]`}>

                    <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6">
                            <img src={defaultPic} className="size-28 rounded-full border-[3px] border-blue-500 bg-white object-cover sm:size-32 lg:size-[150px]" alt="Profile" />
                            <h2 className="break-all text-center text-3xl font-extrabold text-slate-800 sm:text-left sm:text-4xl lg:text-5xl">{userInfo.name}</h2>
                        </div>
                        <button className={`${btnPrimary} shrink-0 rounded-xl px-8 py-4 text-lg font-bold uppercase`} onClick={() => setEditModal(true)}>EDIT</button>
                    </div>

                    <hr className="my-6 w-full border-0 border-t-2 border-slate-300 sm:my-[30px]" />

                    <div className="flex flex-1 flex-col items-stretch md:flex-row">

                        <div className="flex flex-1 flex-col items-center justify-center">
                            <p className="text-xl font-semibold text-slate-800 sm:text-[32px]">Nb game played: 2</p>
                            <p className="mt-2.5 text-7xl font-black text-slate-800 sm:text-8xl lg:text-[140px]">50%</p>
                        </div>

                        <div className="my-6 h-0.5 bg-slate-300 md:mx-10 md:my-0 md:h-auto md:w-0.5"></div>

                        <div className="flex flex-1 flex-col justify-center">
                            <ul className="flex flex-col gap-4">
                                <li className={`${matchItem} border-l-green-500`}>
                                    <span>W</span>
                                    <span className={matchDate}>16/10</span>
                                </li>
                                <li className={`${matchItem} border-l-red-500`}>
                                    <span>L</span>
                                    <span className={matchDate}>16/10</span>
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>
                <PrivacyLink />
            </div>

            {editModal && (
                <Modal title="Edit profile" onClose={closeModal}>
                    <EditProfile defaultPic={defaultPic} />
                </Modal>
            )}

        </div>
    );
}