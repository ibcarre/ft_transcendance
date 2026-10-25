import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import { PrivacyLink } from '../../components/PrivacyLink';
import { panel, inputClass, btnPrimary, errorTooltip, tooltipOrHidden, logoGradient } from '../../styles/ui';

const fieldLabel = "mb-1.5 text-sm font-semibold text-slate-600";
const authInput = `${inputClass} p-3 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]`;

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
            const response = await axios.post('/api/user/login', {
                email,
                password
            });

            // Cas 200: Login successful
            if (response.status === 200) {
                setEmail('');
                setPassword('');
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
        <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-4">
            <div className={`${panel} flex w-full max-w-md flex-col items-center justify-center gap-8 rounded-2xl border-0 px-5 py-10 md:w-auto md:max-w-none md:flex-row md:gap-20 md:px-[100px] md:py-20`}>

                <div>
                    <h1 className={`text-[50px] font-black tracking-[2px] md:text-[80px] ${logoGradient}`}>SKYJO</h1>
                </div>

                <form className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:w-auto md:min-w-80 md:p-10" onSubmit={handleSubmit}>
                    <h2 className="mb-6 text-[28px] font-bold text-slate-800">Login</h2>

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
                        {/* Bulle d'instruction pour l'email */}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Affichage des erreurs retournées par Axios */}
                    <div className="relative">
                        {error && <div className={`${errorTooltip} xl:top-[-8px]`}>{error}</div>}
                    </div>

                    <button
                        type="submit"
                        className={`${btnPrimary} mt-2.5 mb-5 w-full p-3 text-base hover:translate-y-0`}
                        disabled={isLoading || !validEmail || !password}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                    <p className="my-1 text-center text-[13px] text-slate-500">Don't have an account yet? <Link to="signup" className="transition-colors hover:text-blue-500">Create one</Link></p>
                </form>

            </div>
            <PrivacyLink />
        </div>
    );
}
