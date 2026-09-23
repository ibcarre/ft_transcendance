import './auth.css';

export function SignUp() {
    return (
        <div className="page-wrapper">
            <div className="auth-container">

                <div>
                    <h1 className="SKYJO">SKYJO</h1>
                </div>

                <form className="Login-form">
                    <h2>Create Account</h2>

                    <div className="input-group">
                        <label htmlFor="email" className="info">Email</label>
                        <input
                            id="email"
                            className="auth-input"
                            placeholder="exemple@email.com"
                            type="email"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="info">Password</label>
                        <input
                            id="password"
                            className="auth-input"
                            placeholder="Password"
                            type="password"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="info">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            className="auth-input"
                            placeholder="Confirm Password"
                            type="password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button">
                        Sign up
                    </button>

                    <p className="paragraph">Already have an account? Sign in</p>
                </form>

            </div>
            <p className="privacy">Privacy Terms & Conditions</p>
        </div>
    );
}