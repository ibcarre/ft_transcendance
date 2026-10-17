import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { EditProfile } from './EditProfile';
import defaultPic from '../../../imgs/default_pic.jpg';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

export function Profile() {
    const { userInfo } = useAuth();

    const [editModal, setEditModal] = useState(false);

    const closeModal = () => setEditModal(false);
    return (
        <div className="profile-container">

            <Header />

            <div className="profile-wrapper">
                <div className="info-container">

                    <div className="profile-header-section">
                        <div className="profile-identity">
                            <img src={defaultPic} className="profile-pic" alt="Profile" />
                            <h2 className="profile-username">{userInfo.name}</h2>
                        </div>
                        <button className="edit-button" onClick={() => setEditModal(true)}>EDIT</button>
                    </div>

                    <hr className="horizontal-divider" />

                    <div className="profile-stats-section">

                        <div className="stats-left">
                            <p className="games-played">Nb game played: 2</p>
                            <p className="win-rate">50%</p>
                        </div>

                        <div className="vertical-divider"></div>

                        <div className="history-right">
                            <ul className="match-list">
                                <li className="match-item win">
                                    <span>W</span>
                                    <span className="match-date">16/10</span>
                                </li>
                                <li className="match-item loss">
                                    <span>L</span>
                                    <span className="match-date">16/10</span>
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>
                <p className="privacy">Privacy Terms & Conditions</p>
            </div>

            {editModal && (
                <Modal title="Edit profile" onClose={closeModal}>
                    <EditProfile />
                </Modal>
            )}

        </div>
    );
}