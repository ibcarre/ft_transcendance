import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { inputClass, btnPrimary, labelClass, hint, success, hintOrHidden } from '../../styles/ui';

const section = "flex flex-col gap-2";
const inputRow = "mb-0.5 flex gap-3";
const validateButton = `${btnPrimary} shrink-0 px-4 py-2.5`;
const editInput = `${inputClass} px-4 py-2.5`;

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9\-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

export function EditProfile({ defaultPic }) {
    const { userInfo, setUserInfo } = useAuth();

    // 1. Les états des champs
    const [username, setUsername] = useState('');
    const [usernameFocus, setUsernameFocus] = useState(false);

    const [email, setEmail] = useState('');
    const [emailFocus, setEmailFocus] = useState(false);

    const [password, setPassword] = useState('');
    const [pwdFocus, setPwdFocus] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [matchFocus, setMatchFocus] = useState(false);

    // 2. Les états de l'API (un message par section)
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(null);

    // 3. ÉTATS DÉRIVÉS : Validation calculée automatiquement
    const validName = USER_REGEX.test(username);
    const validEmail = EMAIL_REGEX.test(email);
    const validPwd = PWD_REGEX.test(password);
    const validMatch = password === confirmPassword && confirmPassword !== '';

    const updateField = async (field, body, onSuccess) => {
        setStatus((prev) => ({ ...prev, [field]: null }));
        setLoading(field);

        try {
            const response = await axios.put(`/api/user/edit_profile/${field}`, body, {
                withCredentials: true
            });

            if (response.status === 200) {
                onSuccess();
                setStatus((prev) => ({ ...prev, [field]: { ok: true, message: response.data.message } }));
            }
        } catch (err) {
            const message = err.response?.data?.message || "Failed to reach the server";
            setStatus((prev) => ({ ...prev, [field]: { ok: false, message } }));
        } finally {
            setLoading(null);
        }
    };

    const handleUsername = (e) => {
        e.preventDefault();
        if (!validName) return;
        updateField('username', { username }, () => {
            setUserInfo((prev) => ({ ...prev, name: username }));
            setUsername('');
        });
    };

    const handleEmail = (e) => {
        e.preventDefault();
        if (!validEmail) return;
        updateField('email', { email }, () => {
            setUserInfo((prev) => ({ ...prev, email }));
            setEmail('');
        });
    };

    const handlePassword = (e) => {
        e.preventDefault();
        if (!validPwd || !validMatch) return;
        updateField('password', { password }, () => {
            setPassword('');
            setConfirmPassword('');
        });
    };

    const renderStatus = (field) => {
        const s = status[field];
        if (!s) return null;
        return <div className={s.ok ? success : hint}>{s.message}</div>;
    };

    return (
        <div className="flex w-full flex-col gap-6 sm:w-[400px]">
            <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5">
                <img src={defaultPic} alt="Profile" className="size-[100px] rounded-full border-[3px] border-blue-500 object-cover" />
            </div>

            <form className={section} onSubmit={handleUsername}>
                <label htmlFor="new-username" className={labelClass}>New Username</label>
                <div className={inputRow}>
                    <input
                        id="new-username"
                        className={editInput}
                        type="text"
                        placeholder={userInfo.name}
                        autoComplete="off"
                        aria-invalid={validName ? "false" : "true"}
                        aria-describedby="edit-uidnote"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setUsernameFocus(true)}
                        onBlur={() => setUsernameFocus(false)}
                    />
                    <button
                        type="submit"
                        className={validateButton}
                        disabled={loading === 'username' || !validName}>
                        Update
                    </button>
                </div>
                <p id="edit-uidnote" className={hintOrHidden(username && !validName && !usernameFocus)}>
                    4 to 24 characters.<br />
                    Must begin with a letter.<br />
                    Letters, numbers, underscores, hyphens allowed.
                </p>
                {renderStatus('username')}
            </form>

            <form className={section} onSubmit={handleEmail}>
                <label htmlFor="new-email" className={labelClass}>New email address</label>
                <div className={inputRow}>
                    <input
                        id="new-email"
                        className={editInput}
                        type="email"
                        placeholder={userInfo.email}
                        aria-invalid={validEmail ? "false" : "true"}
                        aria-describedby="edit-emailnote"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocus(true)}
                        onBlur={() => setEmailFocus(false)}
                    />
                    <button
                        type="submit"
                        className={validateButton}
                        disabled={loading === 'email' || !validEmail}>
                        Update
                    </button>
                </div>
                <p id="edit-emailnote" className={hintOrHidden(email && !validEmail && !emailFocus)}>
                    Invalid email address.
                </p>
                {renderStatus('email')}
            </form>

            <form className={section} onSubmit={handlePassword}>
                <label htmlFor="new-pwd" className={labelClass}>New password</label>
                <input
                    id="new-pwd"
                    className={editInput}
                    type="password"
                    aria-invalid={validPwd ? "false" : "true"}
                    aria-describedby="edit-pwdnote"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPwdFocus(true)}
                    onBlur={() => setPwdFocus(false)}
                />
                <p id="edit-pwdnote" className={hintOrHidden(password && !pwdFocus && !validPwd)}>
                    8 to 64 characters.<br />
                    Must include uppercase and lowercase letters, a number and a special character.
                </p>

                <label htmlFor="confirm-new-pwd" className={`${labelClass} mt-2`}>Confirm new password</label>
                <div className={inputRow}>
                    <input
                        id="confirm-new-pwd"
                        className={editInput}
                        type="password"
                        aria-invalid={validMatch ? "false" : "true"}
                        aria-describedby="edit-confirmnote"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setMatchFocus(true)}
                        onBlur={() => setMatchFocus(false)}
                    />
                    <button
                        type="submit"
                        className={validateButton}
                        disabled={loading === 'password' || !validPwd || !validMatch}>
                        Update
                    </button>
                </div>
                <p id="edit-confirmnote" className={hintOrHidden(confirmPassword && !validMatch && !matchFocus)}>
                    Must match the first password input field.
                </p>
                {renderStatus('password')}
            </form>
        </div >
    );
}
