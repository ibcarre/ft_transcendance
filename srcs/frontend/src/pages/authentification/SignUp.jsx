import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import { PrivacyLink } from '../../components/PrivacyLink';
import { panel, inputClass, btnPrimary, hintTooltip, tooltipOrHidden } from '../../styles/ui';

const fieldLabel = "mb-1.5 text-sm font-semibold text-slate-600";
const authInput = `${inputClass} p-3 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]`;

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9\-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

export function SignUp() {
    let navigate = useNavigate();

    // 1. Les états des champs et du focus
    const [username, setUsername] = useState('');
    const [usernameFocus, setUsernameFocus] = useState(false);

    const [email, setEmail] = useState('');
    const [emailFocus, setEmailFocus] = useState(false);

    const [password, setPassword] = useState('');
    const [pwdFocus, setPwdFocus] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [matchFocus, setMatchFocus] = useState(false);

    // 2. Les états de l'API
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 3. ÉTATS DÉRIVÉS : Validation calculée automatiquement et de manière synchrone
    const validName = USER_REGEX.test(username);
    const validEmail = EMAIL_REGEX.test(email);
    const validPwd = PWD_REGEX.test(password);
    const validMatch = password === confirmPassword && confirmPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Double sécurité front-end avant d'interroger l'API
        if (!validName || !validEmail || !validPwd || !validMatch) {
            setError("Invalid entry");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/api/user/signup', {
                username,
                email,
                password
            });

            if (response.status === 201) {
                setUsername('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');

                navigate("/lobby");
            }
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError("Failed to reach the server");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-4">
            <div className={`${panel} flex w-full max-w-md flex-col items-center justify-center gap-8 rounded-2xl border-0 px-5 py-10 md:w-auto md:max-w-none md:flex-row md:gap-20 md:px-[100px] md:py-20`}>

                <div>
                    <h1 className="text-[50px] font-black tracking-[2px] text-blue-900 md:text-[80px]">SKYJO</h1>
                </div>

                <form className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:w-auto md:min-w-80 md:p-10" onSubmit={handleSubmit}>
                    <h2 className="mb-6 text-[28px] font-bold text-slate-800">Create Account</h2>

                    <div className="relative mb-4 flex flex-col">
                        <label htmlFor="username" className={fieldLabel}>Username</label>
                        <input
                            id="username"
                            className={authInput}
                            placeholder="Your username"
                            type="text"
                            aria-invalid={validName ? "false" : "true"}
                            aria-describedby="uidnote"
                            value={username}
                            autoComplete="off"
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setUsernameFocus(true)}
                            onBlur={() => setUsernameFocus(false)}
                            required
                        />
                        <p id="uidnote" className={tooltipOrHidden(username && !validName && !usernameFocus)}>
                            4 to 24 characters.<br />
                            Must begin with a letter.<br />
                            Letters, numbers, underscores, hyphens allowed.
                        </p>
                    </div>

                    <div className="relative mb-4 flex flex-col">
                        <label htmlFor="email" className={fieldLabel}>Email</label>
                        <input
                            id="email"
                            className={authInput}
                            placeholder="exemple@email.com"
                            type="email"
                            aria-invalid={validEmail ? "false" : "true"}
                            aria-describedby="emailnote"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocus(true)}
                            onBlur={() => setEmailFocus(false)}
                            required
                        />
                        <p id="emailnote" className={tooltipOrHidden(email && !validEmail && !emailFocus)}>
                            Invalid email address.
                        </p>
                    </div>

                    <div className="relative mb-4 flex flex-col">
                        <label htmlFor="password" className={fieldLabel}>Password</label>
                        <input
                            id="password"
                            className={authInput}
                            placeholder="Password"
                            type="password"
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                            required
                        />
                        <p id="pwdnote" className={tooltipOrHidden(password && !pwdFocus && !validPwd)}>
                            8 to 64 characters.<br />
                            Must include uppercase and lowercase letters, a number and a special character.
                        </p>
                    </div>

                    <div className="relative mb-4 flex flex-col">
                        <label htmlFor="confirmPassword" className={fieldLabel}>Confirm Password</label>
                        <input
                            id="confirmPassword"
                            className={authInput}
                            placeholder="Confirm Password"
                            type="password"
                            aria-invalid={validMatch ? "false" : "true"}
                            aria-describedby="confirmnote"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                            required
                        />
                        <p id="confirmnote" className={tooltipOrHidden(confirmPassword && !validMatch && !matchFocus)}>
                            Must match the first password input field.
                        </p>
                    </div>

                    <div className="relative">
                        {error && <div className={`${hintTooltip} xl:top-[-8px]`}>{error}</div>}
                    </div>

                        <button
                            type="submit"
                            className={`${btnPrimary} mt-2.5 mb-5 w-full p-3 text-base hover:translate-y-0`}
                            disabled={isLoading || !validName || !validEmail || !validPwd || !validMatch}>
                            {isLoading ? "Signing up..." : "Sign up"}
                        </button>
                    <p className="my-1 text-center text-[13px] text-slate-500">Already have an account? <Link to="/" className="transition-colors hover:text-blue-500"> Sign in </Link></p>
                </form>

            </div>
            <PrivacyLink />
        </div>
    );
}