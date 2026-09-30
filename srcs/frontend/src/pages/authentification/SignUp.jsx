import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import './Auth.css';

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9\-_]{3,23}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

export function SignUp() {
    let navigate = useNavigate();

    // 1. Les états des champs et du focus (plus besoin des setValidX !)
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
            const response = await axios.post('https://localhost:44443/api/user/signup', {
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
        <div className="page-wrapper">
            <div className="auth-container">

                <div>
                    <h1 className="SKYJO">SKYJO</h1>
                </div>

                <form className="Login-form" onSubmit={handleSubmit}>
                    <h2>Create Account</h2>

                    <div className="input-group">
                        <label htmlFor="username" className="info">Username</label>
                        <input
                            id="username"
                            className="auth-input"
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
                        <p id="uidnote" className={username && !validName && !usernameFocus ? "instructions" : "offscreen"}>
                            4 to 24 characters.<br />
                            Must begin with a letter.<br />
                            Letters, numbers, underscores, hyphens allowed.
                        </p>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="info">Email</label>
                        <input
                            id="email"
                            className="auth-input"
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
                        <p id="emailnote" className={email && !validEmail && !emailFocus ? "instructions" : "offscreen"}>
                            Invalid email address.
                        </p>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="info">Password</label>
                        <input
                            id="password"
                            className="auth-input"
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
                        <p id="pwdnote" className={password && !pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                            8 to 64 characters.<br />
                            Must include uppercase and lowercase letters, a number and a special character.
                        </p>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="info">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            className="auth-input"
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
                        <p id="confirmnote" className={confirmPassword && !validMatch && !matchFocus ? "instructions" : "offscreen"}>
                            Must match the first password input field.
                        </p>
                    </div>

                    {error && <div className="instructions">{error}</div>}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={isLoading || !validName || !validEmail || !validPwd || !validMatch}>
                            {isLoading ? "Signing up..." : "Sign up"}
                        </button>
                    <p className="paragraph">Already have an account? <Link to="/" className="paragraph-link"> Sign in </Link></p>
                </form>

            </div>
            <p className="privacy">Privacy Terms & Conditions</p>
        </div>
    );
}