import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Avatar } from '../../components/Avatar';
import { uploadAvatar, fetchMe, errorMessage, MAX_AVATAR_SIZE } from '../../services/user';
import { inputClass, btnPrimary, labelClass, feedback, hintOrHidden } from '../../styles/ui';

const section = "flex flex-col gap-2";
const inputRow = "mb-0.5 flex gap-3";
const validateButton = `${btnPrimary} shrink-0 px-4 py-2.5`;
const editInput = `${inputClass} px-4 py-2.5`;

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9\-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

export function EditProfile() {
    const { userInfo, setUserInfo } = useAuth();
    const navigate = useNavigate();

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
    const fileInput = useRef(null);

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
            setStatus((prev) => ({ ...prev, [field]: { ok: false, message: errorMessage(err) } }));
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
            navigate(`/profile/${encodeURIComponent(username)}`, { replace: true });
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

    // Clic sur l'avatar -> sélecteur de fichier -> upload -> on recharge le profil (nouveau avatar_url)
    const handleAvatar = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';   // permet de re-sélectionner le même fichier
        if (!file) return;

        const setPicture = (ok, message) => setStatus((prev) => ({ ...prev, picture: { ok, message } }));
        if (!file.type.startsWith('image/')) return setPicture(false, "Please choose an image (jpg, png, webp...)");
        if (file.size > MAX_AVATAR_SIZE) return setPicture(false, "Image shouldn't be bigger than 2MB");

        setStatus((prev) => ({ ...prev, picture: null }));
        setLoading('picture');
        try {
            const response = await uploadAvatar(file);
            setUserInfo(await fetchMe());
            setPicture(true, response.data?.message || "Profile picture changed");
        } catch (err) {
            setPicture(false, errorMessage(err));
        } finally {
            setLoading(null);
        }
    };

    const renderStatus = (field) => {
        const s = status[field];
        if (!s) return null;
        return <div className={s.ok ? feedback.success : feedback.error}>{s.message}</div>;
    };

    return (
        <div className="flex w-full flex-col gap-6 sm:w-[400px]">
            <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5">
                <button
                    type="button"
                    className="group relative cursor-pointer rounded-full disabled:cursor-wait"
                    title="Change your profile picture"
                    disabled={loading === 'picture'}
                    onClick={() => fileInput.current?.click()}>
                    <Avatar file={userInfo.avatar_url} className="size-[100px]" />
                    <span className={`absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-xs font-bold text-white transition-opacity ${loading === 'picture' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {loading === 'picture' ? 'Uploading...' : 'Change'}
                    </span>
                </button>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                {renderStatus('picture')}
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
