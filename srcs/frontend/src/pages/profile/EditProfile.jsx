import defaultPic from '../../../imgs/default_pic.jpg';
import './EditProfile.css';

export function EditProfile() {
    return (
        <div className="profile-content">
            <div className="profile-header">
                <img src={defaultPic} alt="Profile" className="profile-pic" />
            </div>

            <div className="profile-section">
                <label htmlFor="new-username">New Username</label>
                <div className="input-row">
                    <input id="new-username" type="text" />
                    <button className="validate-button">Update</button>
                </div>
            </div>

            <div className="profile-section">
                <label htmlFor="new-email">New email address</label>
                <div className="input-row">
                    <input id="new-email" type="email" placeholder="current@email.com" />
                    <button className="validate-button">Update</button>
                </div>
            </div>

            <div className="profile-section">
                <label htmlFor="new-pwd">New password</label>
                <input id="new-pwd" type="password" />

                <label htmlFor="confirm-new-pwd" className="mt-2">Confirm new password</label>
                <div className="input-row">
                    <input id="confirm-new-pwd" type="password" />
                    <button className="validate-button">Update</button>
                </div>
            </div>
        </div >
    );
}