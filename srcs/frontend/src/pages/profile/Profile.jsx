import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { EditProfile } from './EditProfile';
import defaultPic from '../../../imgs/default_pic.jpg';
import { Header } from '../../components/Header';

export function Profile() {
    const [editModal, setEditModal] = useState(false);

    const closeModal = () => setEditModal(false);
    return (
        <>
            <Header />

            <div>
                <img src={defaultPic} />
                <p>Username</p>
                <button onClick={() => setEditModal(true)}>Edit</button>
            </div>

            <div>
                <p>Nb  games played : 2; 50%</p>
                <ul>
                    <li>W</li>
                    <li>L</li>
                </ul>
            </div>

            <p>Privacy Terms & Conditions</p>

            {editModal && (
                <Modal title="Edit profile" onClose={closeModal}>
                    <EditProfile />
                </Modal>)}
        </>
    );
}