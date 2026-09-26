import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import './Auth.css';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function SignIn() {
    let navigate = useNavigate();

    // 1. Déclaration des états
    const [email, setEmail] = useState('');
    const [emailFocus, setEmailFocus] = useState(false);

    const [password, setPassword] = useState('');

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 2. État dérivé pour la validation de l'email
    const validEmail = EMAIL_REGEX.test(email);

    // 3. Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);


        // Sécurité front-end basique
        if (!validEmail) {
            setError("Invalid email address");
            return;
        }

        if (!password) {
            setError("Empty field");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('https://localhost:44443/api/user/login', {
                email,
                password
            });

            // Cas 200: Login successful
            if (response.status === 200) {
                setEmail('');
                setPassword('');

                // TODO: Ajouter ici la redirection vers le Lobby (ex: navigate('/lobby'))
                navigate("/lobby")
            }
            else {
                setError("Test");
            }
        } catch (err) {
            // Gère automatiquement les cas 400, 401 et 500 définis dans ton backend
            if (err.response && err.response.data) {
                setError(err.response.data.message);
                console.log(err.response.data.message);
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
                    <h2>Login</h2>

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
                        {/* Bulle d'instruction pour l'email */}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Affichage des erreurs retournées par Axios */}
                    {error && <div className="instructions">{error}</div>}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading || !validEmail || !password}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                    <p className="paragraph">Don't have an account yet? <Link to="SignUp" className="paragraph-link">Create one</Link></p>
                </form>

            </div>
            <p className="privacy">Privacy Terms & Conditions</p>
        </div>
    );
}